/**
 * Tests for the invitation system
 */

import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

describe("Invitation System", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create a mock context (Super Admin in dev mode)
    const mockContext = await createContext({
      req: {} as any,
      res: {} as any,
    });

    caller = appRouter.createCaller(mockContext);
  });

  it("should create an invitation with valid token and expiration", async () => {
    // First, create a test restaurant
    const restaurant = await caller.admin.createRestaurant({
      name: "Test Restaurant OAuth",
      slug: "test-restaurant-oauth",
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });

    // Create an invitation
    const invitation = await caller.invitations.create({
      restaurantId: restaurant.id,
    });

    // Verify invitation structure
    expect(invitation).toHaveProperty("id");
    expect(invitation).toHaveProperty("token");
    expect(invitation).toHaveProperty("invitationUrl");
    expect(invitation).toHaveProperty("expiresAt");

    // Verify token is a valid UUID
    expect(invitation.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Verify invitation URL contains the token
    expect(invitation.invitationUrl).toContain(invitation.token);

    // Verify expiration is approximately 24 hours from now
    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeGreaterThan(23.9);
    expect(hoursDiff).toBeLessThan(24.1);
  });

  it("should validate invitation token correctly", async () => {
    // Create a test restaurant
    const restaurant = await caller.admin.createRestaurant({
      name: "Test Restaurant Token Validation",
      slug: "test-restaurant-token-validation",
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });

    // Create an invitation
    const invitation = await caller.invitations.create({
      restaurantId: restaurant.id,
    });

    // Validate the token
    const validation = await caller.invitations.getByToken({
      token: invitation.token,
    });

    expect(validation.valid).toBe(true);
    expect(validation.invitation).toBeDefined();
    expect(validation.restaurant).toBeDefined();
    expect(validation.restaurant?.id).toBe(restaurant.id);
  });

  it("should reject invalid invitation token", async () => {
    const validation = await caller.invitations.getByToken({
      token: "invalid-token-12345",
    });

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe("not_found");
  });

  it("should create invitation URL with correct domain", async () => {
    // Create a test restaurant
    const restaurant = await caller.admin.createRestaurant({
      name: "Test Restaurant URL",
      slug: "test-restaurant-url",
      subscriptionTier: "menu",
      subscriptionStatus: "trial",
    });

    // Create an invitation
    const invitation = await caller.invitations.create({
      restaurantId: restaurant.id,
    });

    // Verify URL format
    expect(invitation.invitationUrl).toMatch(/^https:\/\/pronto\.page\/invite\//);
  });
});
