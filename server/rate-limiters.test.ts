import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { limitPublicChat, limitPublicChatbotRequests, limitPublicContactForm, limitPublicEventRegistrations, limitPublicPageViews, limitPublicVenueChat, passwordHelpLimiter, requireSameOrigin } from "./rate-limiters";

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

describe("public venue chatbot rate limiting", () => {
  it("limits a venue chatbot call without consuming another chatbot budget", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicVenueChat);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app).post("/api/trpc/public.chat").expect(200);
    }
    await request(app).post("/api/trpc/public.chat").expect(429);
    await request(app).post("/api/trpc/chat.sendMessage").expect(200);
  });
});

describe("public contact form rate limiting", () => {
  it("limits owner-notification requests without blocking other public procedures", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicContactForm);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(app).post("/api/trpc/public.submitContactForm").expect(200);
    }
    await request(app).post("/api/trpc/public.submitContactForm").expect(429);
    await request(app).post("/api/trpc/public.trackPageView").expect(200);
  });
});

describe("public page-view rate limiting", () => {
  it("allows normal navigation while bounding analytics inflation from one IP", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicPageViews);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await request(app).post("/api/trpc/public.trackPageView").expect(200);
    }
    await request(app).post("/api/trpc/public.trackPageView").expect(429);
    await request(app).post("/api/trpc/public.getRestaurant").expect(200);
  });
});

describe("public event registration rate limiting", () => {
  it("limits registrations without consuming unrelated public procedure budgets", async () => {
    const app = express();
    app.use("/api/trpc", limitPublicEventRegistrations);
    app.post("/api/trpc/:procedure", (_req, res) => res.status(200).json({ success: true }));

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post("/api/trpc/events.registerForEvent").expect(200);
    }
    await request(app).post("/api/trpc/events.registerForEvent").expect(429);
    await request(app).post("/api/trpc/events.getPublicEvents").expect(200);
  });
});
