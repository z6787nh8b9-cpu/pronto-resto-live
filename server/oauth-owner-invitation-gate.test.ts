import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/auth-config.ts"), "utf8");

describe("création OAuth propriétaire invitée", () => {
  it("exige une invitation et revendique établissement et propriétaire dans une transaction", () => {
    expect(source).toContain("class OwnerInvitationRequiredError");
    expect(source).toContain("if (!isOwnerInvitationToken(invitationToken)) throw new OwnerInvitationRequiredError()");
    expect(source).toContain("return await db.transaction(async (tx) =>");
    expect(source).toContain("eq(invitations.status, \"pending\")");
    expect(source).toContain("isNull(restaurants.ownerId)");
    expect(source).toContain("upsertGoogleOwner(profile, req.session?.invitationToken)");
    expect(source).toContain("upsertFacebookOwner(profile, req.session?.invitationToken)");
  });
});
