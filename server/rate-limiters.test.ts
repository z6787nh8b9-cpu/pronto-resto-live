import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { limitPublicChat, limitPublicChatbotRequests, passwordHelpLimiter, requireSameOrigin } from "./rate-limiters";

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

describe("public chatbot rate limiting", () => {
  it("limits the expensive chatbot procedure without consuming the budget of other procedures", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicChat);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app).post("/api/trpc/chat.sendMessage").expect(200);
    }
    await request(app).post("/api/trpc/chat.sendMessage").expect(429);
    await request(app).post("/api/trpc/businesses.getPublicBusinessCatalog").expect(200);
  });
});

describe("public assistance request rate limiting", () => {
  it("limits contact requests without blocking other tRPC procedures", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicChatbotRequests);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app).post("/api/trpc/chatbotRequests.submit").expect(200);
    }
    await request(app).post("/api/trpc/chatbotRequests.submit").expect(429);
    await request(app).post("/api/trpc/chat.sendMessage").expect(200);
  });
});
