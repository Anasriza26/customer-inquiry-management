import test from "node:test";
import assert from "node:assert/strict";
import { requireAuth } from "../src/middleware/require-auth.js";

test("rejects a request when no session user exists", async () => {
    let statusCode;
    let responseBody;
    let nextCalled = false;

    const request = {
        session: {},
    };

    const response = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };

    const next = () => {
        nextCalled = true;
    };

    await requireAuth(request, response, next);

    assert.equal(statusCode, 401);
    assert.deepEqual(responseBody, {
        error: "Authentication required.",
    });
    assert.equal(nextCalled, false);
});