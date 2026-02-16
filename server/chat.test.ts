import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Chatbot RISE AI™", () => {
  it("devrait répondre à une question sur les tarifs", async () => {
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
      restaurantOwner: null,
    };

    const caller = appRouter.createCaller(mockContext);

    const response = await caller.chat.sendMessage({
      message: "Quels sont les tarifs de PRONTO ?",
    });

    expect(response.response).toBeTruthy();
    expect(response.response.length).toBeGreaterThan(10);
    // Vérifier que la réponse contient des informations sur les tarifs
    expect(
      response.response.toLowerCase().includes("19") ||
      response.response.toLowerCase().includes("29") ||
      response.response.toLowerCase().includes("39") ||
      response.response.toLowerCase().includes("basic") ||
      response.response.toLowerCase().includes("pro") ||
      response.response.toLowerCase().includes("premium")
    ).toBe(true);
  }, 10000);

  it("devrait répondre à une question sur les fonctionnalités", async () => {
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
      restaurantOwner: null,
    };

    const caller = appRouter.createCaller(mockContext);

    const response = await caller.chat.sendMessage({
      message: "Quelles sont les fonctionnalités de PRONTO ?",
    });

    expect(response.response).toBeTruthy();
    expect(response.response.length).toBeGreaterThan(10);
    // Vérifier que la réponse mentionne des fonctionnalités clés
    expect(
      response.response.toLowerCase().includes("menu") ||
      response.response.toLowerCase().includes("chatbot") ||
      response.response.toLowerCase().includes("site") ||
      response.response.toLowerCase().includes("personnalis")
    ).toBe(true);
  }, 10000);

  it("devrait nettoyer le formatage (pas de ** ou -)", async () => {
    const mockContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
      restaurantOwner: null,
    };

    const caller = appRouter.createCaller(mockContext);

    const response = await caller.chat.sendMessage({
      message: "Parle-moi de PRONTO",
    });

    // Vérifier qu'il n'y a pas de double astérisques
    expect(response.response.includes("**")).toBe(false);
    // Vérifier qu'il n'y a pas de tirets en début de ligne (liste)
    expect(response.response.match(/^- /m)).toBe(null);
  }, 10000);
});
