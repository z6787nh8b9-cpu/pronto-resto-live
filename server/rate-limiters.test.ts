import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { passwordHelpLimiter, requireSameOrigin } from "./rate-limiters";

describe("password help rate limiting", () => {
  it("limits neutral recovery requests even though the normal reply is successful", async () => {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.post("/password-help", passwordHelpLimiter, (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app).post("/password-help").type("form").send({ email: "rate-limit-test@example.test" }).expect(200);
    }
    await request(app).post("/password-help").type("form").send({ email: "rate-limit-test@example.test" }).expect(429);
  });
});

describe("same-origin mutation guard", () => {
  it("rejects an inter-site mutation and accepts the exact application origin", async () => {
    const app = express();
    app.post("/mutation", requireSameOrigin, (_req, res) => res.status(200).json({ success: true }));

    await request(app).post("/mutation").set("Origin", "https://evil.example").expect(403);
    await request(app).post("/mutation").set("Host", "pronto.test").set("Origin", "http://pronto.test").expect(200);
  });
});
