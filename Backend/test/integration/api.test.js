const assert = require("node:assert/strict");
const path = require("node:path");
const { after, before, beforeEach, describe, it } = require("node:test");
const bcrypt = require("bcryptjs");
const mock = require("mock-require");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.SECRET_KEY = "qa-only-secret-for-automated-tests";

const blacklistedTokens = new Set();
const redis = {
    async get(token) {
        return blacklistedTokens.has(token) ? "blacklisted" : null;
    },
    async set(token) {
        blacklistedTokens.add(token);
        return "OK";
    },
};

mock(path.resolve(__dirname, "../../src/config/cache.js"), redis);

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
    blacklistedTokens.clear();
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
        assert.match(response.headers["set-cookie"][0], /HttpOnly/i);
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
            .send({ email: credentials.email, password: credentials.password })
            .expect(200);

        const response = await agent.get("/api/auth/get-me").expect(200);
        assert.equal(response.body.user.username, credentials.username);
        assert.equal(response.body.user.password, undefined);
    });

    it("rejects invalid credentials and unauthenticated profile access", async () => {
        await request(app)
            .post("/api/auth/login")
            .send({ email: "missing@example.com", password: "not-the-password" })
            .expect(400);

        await request(app).get("/api/auth/get-me").expect(401);
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
    });

    it("denies song upload unless the caller is authenticated as an admin", async () => {
        await request(app).post("/api/songs").expect(401);
    });

    it("returns an empty result for a mood with no matching songs", async () => {
        const response = await request(app)
            .get("/api/songs")
            .query({ mood: "unlisted-mood" })
            .expect(200);

        assert.deepEqual(response.body.song, []);
    });
});
