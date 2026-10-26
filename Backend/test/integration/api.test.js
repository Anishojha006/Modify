const assert = require("node:assert/strict");
const path = require("node:path");
const { after, before, beforeEach, describe, it } = require("node:test");
const bcrypt = require("bcryptjs");
const mock = require("mock-require");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.SECRET_KEY = "qa-only-secret-for-automated-tests";

const { resetRateLimitStores } = require("../../src/middlewares/rateLimit.middleware.js");
const blacklistedTokens = new Set();
const deletedFileIds = [];
let uploadFailureFilename = null;
const redis = {
    status: "ready",
    async get(token) {
        return blacklistedTokens.has(token) ? "blacklisted" : null;
    },
    async set(token) {
        blacklistedTokens.add(token);
        return "OK";
    },
};

mock(path.resolve(__dirname, "../../src/config/cache.js"), redis);
mock(path.resolve(__dirname, "../../src/service/storage.service.js"), {
    DEFAULT_POSTER: Buffer.from("test-poster"),
    async uploadFile({ filename, folder }) {
        if (filename === uploadFailureFilename) {
            throw new Error("Simulated storage outage");
        }

        return {
            url: `https://example.test${folder}/${filename}`,
            fileId: `file-${filename}`,
        };
    },
    async deleteFile(fileId) {
        deletedFileIds.push(fileId);
    },
});

let app;
let mongo;

before(async () => {
    mongo = await MongoMemoryServer.create({
        instance: {
            dbName: "modify_qa_test",
            launchTimeout: 60_000,
        },
    });

    const testDatabaseUri = mongo.getUri("modify_qa_test");
    const databaseName = new URL(testDatabaseUri).pathname.slice(1);
    if (!databaseName.startsWith("modify_qa_test")) {
        throw new Error("Integration tests must use the isolated QA database.");
    }

    await mongoose.connect(testDatabaseUri);
    app = require("../../src/app.js");
});

beforeEach(async () => {
    await resetRateLimitStores();
    blacklistedTokens.clear();
    deletedFileIds.length = 0;
    uploadFailureFilename = null;
    await Promise.all(
        Object.values(mongoose.connection.collections).map((collection) =>
            collection.deleteMany({}),
        ),
    );
});

after(async () => {
    mock.stopAll();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    if (mongo) {
        await mongo.stop();
    }
});

describe("HTTP API integration", () => {
    it("reports application health", async () => {
        const response = await request(app).get("/health").expect(200);
        assert.deepEqual(response.body, { status: "ok" });
        assert.equal(response.headers["x-powered-by"], undefined);
    });

    it("reports readiness only after database and Redis are connected", async () => {
        const response = await request(app).get("/ready").expect(200);
        assert.deepEqual(response.body, { status: "ready" });
    });

    it("returns a standard error for unknown API routes", async () => {
        const response = await request(app)
            .get("/api/not-a-route")
            .expect(404);

        assert.equal(response.body.success, false);
        assert.equal(response.body.error.code, "NOT_FOUND");
    });

    it("registers a user without returning the password", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                username: "qa-user",
                email: "qa@example.com",
                password: "correct-horse-battery",
            })
            .expect(201);

        assert.equal(response.body.user.username, "qa-user");
        assert.equal(response.body.user.email, "qa@example.com");
        assert.equal(response.body.user.password, undefined);
        const userTokenCookie = response.headers["set-cookie"].find((cookie) =>
            cookie.startsWith("token="),
        );
        assert.match(userTokenCookie, /HttpOnly/i);
    });

    it("rejects duplicate registration", async () => {
        const user = {
            username: "qa-user",
            email: "qa@example.com",
            password: "correct-horse-battery",
        };

        await request(app).post("/api/auth/register").send(user).expect(201);
        const response = await request(app)
            .post("/api/auth/register")
            .send(user)
            .expect(409);

        assert.match(response.body.message, /already registered/i);
    });

    it("rejects incomplete registration input with a client error", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ username: "qa-user" })
            .expect(400);

        await request(app)
            .post("/api/auth/register")
            .send({
                username: {},
                email: {},
                password: {},
            })
            .expect(400);
    });

    it("authenticates a registered user and restores their session", async () => {
        const agent = request.agent(app);
        const credentials = {
            username: "qa-user",
            email: "qa@example.com",
            password: "correct-horse-battery",
        };

        await agent.post("/api/auth/register").send(credentials).expect(201);
        await agent
            .post("/api/auth/login")
            .send({
                email: credentials.email.toUpperCase(),
                password: credentials.password,
            })
            .expect(200);

        const response = await agent.get("/api/auth/get-me").expect(200);
        assert.equal(response.body.user.username, credentials.username);
        assert.equal(response.body.user.email, credentials.email);
        assert.equal(response.body.user.password, undefined);
    });

    it("rejects invalid credentials and unauthenticated profile access", async () => {
        await request(app)
            .post("/api/auth/login")
            .send({})
            .expect(400);

        await request(app)
            .post("/api/auth/login")
            .send({ email: "missing@example.com", password: "not-the-password" })
            .expect(401);

        await request(app).get("/api/auth/get-me").expect(401);
    });

    it("limits repeated user authentication attempts", async () => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            await request(app).post("/api/auth/login").send({}).expect(400);
        }

        const response = await request(app)
            .post("/api/auth/login")
            .send({})
            .expect(429);

        assert.equal(response.body.error.code, "RATE_LIMITED");
    });

    it("limits repeated admin authentication attempts", async () => {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            await request(app)
                .post("/api/v1/admin/login")
                .send({})
                .expect(401);
        }

        const response = await request(app)
            .post("/api/v1/admin/login")
            .send({})
            .expect(429);

        assert.equal(response.body.error.code, "RATE_LIMITED");
    });

    it("creates an admin session using the admin cookie", async () => {
        const Admin = require("../../src/models/admin.model.js");
        await Admin.create({
            username: "qa-admin",
            passwordHash: await bcrypt.hash("long-test-admin-password", 12),
        });
        const agent = request.agent(app);

        await agent
            .post("/api/v1/admin/login")
            .send({ username: "qa-admin", password: "long-test-admin-password" })
            .expect(200);

        const response = await agent.get("/api/v1/admin/getme").expect(200);
        assert.equal(response.body.admin.username, "qa-admin");
        assert.equal(response.body.admin.role, "admin");
    });

    it("does not create an admin with a default plaintext password", async () => {
        const Admin = require("../../src/models/admin.model.js");

        await assert.rejects(
            Admin.create({ username: "no-password-admin" }),
            mongoose.Error.ValidationError,
        );
        await assert.rejects(
            Admin.create({
                username: "plaintext-password-admin",
                passwordHash: "plaintext-password",
            }),
            mongoose.Error.ValidationError,
        );
    });

    it("denies song upload unless the caller is authenticated as an admin", async () => {
        const agent = request.agent(app);
        const csrfResponse = await agent.get("/api/csrf-token").expect(200);
        const csrfToken = csrfResponse.headers["set-cookie"]
            .find((cookie) => cookie.startsWith("csrf_token="))
            .split(";")[0]
            .slice("csrf_token=".length);

        await agent
            .post("/api/songs")
            .set("x-csrf-token", csrfToken)
            .expect(401);
    });

    it("rejects unsupported song file types", async () => {
        const Admin = require("../../src/models/admin.model.js");
        await Admin.create({
            username: "qa-admin",
            passwordHash: await bcrypt.hash("long-test-admin-password", 12),
        });
        const agent = request.agent(app);
        const loginResponse = await agent
            .post("/api/v1/admin/login")
            .send({ username: "qa-admin", password: "long-test-admin-password" })
            .expect(200);
        const csrfToken = loginResponse.headers["set-cookie"]
            .find((cookie) => cookie.startsWith("csrf_token="))
            .split(";")[0]
            .slice("csrf_token=".length);

        const response = await agent
            .post("/api/songs")
            .set("x-csrf-token", csrfToken)
            .field("mood", "happy")
            .attach("song", Buffer.from("not audio"), "notes.txt")
            .expect(415);

        assert.equal(response.body.error.code, "UNSUPPORTED_MEDIA_TYPE");

        const spoofedFileResponse = await agent
            .post("/api/songs")
            .set("x-csrf-token", csrfToken)
            .field("mood", "happy")
            .attach("song", Buffer.from("not audio"), "spoofed.mp3")
            .expect(415);

        assert.equal(spoofedFileResponse.body.error.code, "UNSUPPORTED_MEDIA_TYPE");
    });

    it("enforces a unique song mood in the database", async () => {
        const Song = require("../../src/models/song.model.js");
        const song = {
            title: "Happy song",
            url: "https://example.test/happy.mp3",
            posterUrl: "https://example.test/happy.jpg",
            mood: "happy",
        };
        await Song.create(song);

        await assert.rejects(
            Song.create({ ...song, title: "Another happy song" }),
            (error) => error.code === 11000,
        );
    });

    it("rejects uploading another song for a mood that already has one", async () => {
        const Admin = require("../../src/models/admin.model.js");
        const Song = require("../../src/models/song.model.js");
        await Admin.create({
            username: "qa-admin",
            passwordHash: await bcrypt.hash("long-test-admin-password", 12),
        });
        await Song.create({
            title: "Existing happy song",
            url: "https://example.test/existing.mp3",
            posterUrl: "https://example.test/existing.jpg",
            mood: "happy",
        });
        const agent = request.agent(app);

        const loginResponse = await agent
            .post("/api/v1/admin/login")
            .send({ username: "qa-admin", password: "long-test-admin-password" })
            .expect(200);
        const csrfToken = loginResponse.headers["set-cookie"]
            .find((cookie) => cookie.startsWith("csrf_token="))
            .split(";")[0]
            .slice("csrf_token=".length);

        const response = await agent
            .post("/api/songs")
            .set("x-csrf-token", csrfToken)
            .field("mood", "happy")
            .attach("song", Buffer.from("ID3\x04\x00\x00\x00\x00\x00\x00", "binary"), "replacement.mp3")
            .expect(409);

        assert.match(response.body.message, /delete it before uploading another/i);
        assert.equal(response.body.song.title, "Existing happy song");
    });

    it("cleans up a successful asset upload when its paired upload fails", async () => {
        const Admin = require("../../src/models/admin.model.js");
        await Admin.create({
            username: "qa-admin",
            passwordHash: await bcrypt.hash("long-test-admin-password", 12),
        });
        const agent = request.agent(app);
        const loginResponse = await agent
            .post("/api/v1/admin/login")
            .send({ username: "qa-admin", password: "long-test-admin-password" })
            .expect(200);
        const csrfToken = loginResponse.headers["set-cookie"]
            .find((cookie) => cookie.startsWith("csrf_token="))
            .split(";")[0]
            .slice("csrf_token=".length);
        uploadFailureFilename = "orphaned.mp3";

        const response = await agent
            .post("/api/songs")
            .set("x-csrf-token", csrfToken)
            .field("mood", "happy")
            .attach("song", Buffer.from("ID3\x04\x00\x00\x00\x00\x00\x00", "binary"), "orphaned.mp3")
            .expect(500);

        assert.equal(response.body.error.code, "INTERNAL_SERVER_ERROR");
        assert.deepEqual(deletedFileIds, ["file-orphaned.jpeg"]);
    });

    it("allows an admin to delete a song and its stored files", async () => {
        const Admin = require("../../src/models/admin.model.js");
        const Song = require("../../src/models/song.model.js");
        await Admin.create({
            username: "qa-admin",
            passwordHash: await bcrypt.hash("long-test-admin-password", 12),
        });
        const song = await Song.create({
            title: "Happy song",
            url: "https://example.test/happy.mp3",
            posterUrl: "https://example.test/happy.jpg",
            fileId: "happy-song-file",
            posterFileId: "happy-poster-file",
            mood: "happy",
        });
        const agent = request.agent(app);

        const loginResponse = await agent
            .post("/api/v1/admin/login")
            .send({ username: "qa-admin", password: "long-test-admin-password" })
            .expect(200);
        const csrfToken = loginResponse.headers["set-cookie"]
            .find((cookie) => cookie.startsWith("csrf_token="))
            .split(";")[0]
            .slice("csrf_token=".length);

        await agent
            .delete(`/api/songs/${song._id}`)
            .set("x-csrf-token", csrfToken)
            .expect(200);

        assert.equal(await Song.countDocuments({ mood: "happy" }), 0);
        assert.deepEqual(deletedFileIds.sort(), [
            "happy-poster-file",
            "happy-song-file",
        ]);
    });

    it("returns an empty result for a mood with no matching songs", async () => {
        const response = await request(app)
            .get("/api/songs")
            .query({ mood: "unlisted-mood" })
            .expect(200);

        assert.deepEqual(response.body.song, []);
    });
});
