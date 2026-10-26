const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { sendApiError, errorHandler } = require("../src/utils/apiError.js");

function createResponse() {
    return {
        statusCode: null,
        body: null,
        headersSent: false,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

describe("API error responses", () => {
    it("returns a consistent error shape and preserves extra response data", () => {
        const response = createResponse();

        sendApiError(response, 409, "Already exists.", undefined, { itemId: "123" });

        assert.equal(response.statusCode, 409);
        assert.deepEqual(response.body, {
            success: false,
            message: "Already exists.",
            error: {
                code: "CONFLICT",
                message: "Already exists.",
            },
            itemId: "123",
        });
    });

    it("normalizes malformed JSON errors", () => {
        const response = createResponse();

        errorHandler({ status: 400, type: "entity.parse.failed" }, {}, response, () => {});

        assert.equal(response.statusCode, 400);
        assert.equal(response.body.error.code, "BAD_REQUEST");
        assert.equal(response.body.message, "Request body contains invalid JSON.");
    });

    it("does not expose internal error details", () => {
        const response = createResponse();
        const originalConsoleError = console.error;

        console.error = () => {};
        try {
            errorHandler(
                new Error("database password should not be exposed"),
                {},
                response,
                () => {}
            );
        } finally {
            console.error = originalConsoleError;
        }

        assert.equal(response.statusCode, 500);
        assert.deepEqual(response.body.error, {
            code: "INTERNAL_SERVER_ERROR",
            message: "An internal server error occurred.",
        });
    });

    it("returns the upload limit with the standard payload-too-large code", () => {
        const response = createResponse();

        errorHandler({ code: "LIMIT_FILE_SIZE", name: "MulterError" }, {}, response, () => {});

        assert.equal(response.statusCode, 413);
        assert.equal(response.body.error.code, "PAYLOAD_TOO_LARGE");
        assert.equal(response.body.message, "Uploaded file exceeds the 20 MB limit.");
    });

    it("passes errors onward after response headers were sent", () => {
        const response = { headersSent: true };
        let forwardedError;

        errorHandler(new Error("late error"), {}, response, (error) => {
            forwardedError = error;
        });

        assert.equal(forwardedError.message, "late error");
    });
});
