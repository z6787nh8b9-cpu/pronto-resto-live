import type { AdminAccount, RestaurantOwner, User } from "../../drizzle/schema";

export type AuthenticatedPrincipal =
  | { kind: "admin"; id: number; email: string; name: string; source: "password" }
  | { kind: "owner"; id: number; email: string; name: string; source: "email" | "google" | "facebook" }
  | { kind: "platform"; id: number; email: string | null; name: string | null; source: "manus" };

export function resolvePrincipal(input: {
  adminAccount: AdminAccount | null;
  restaurantOwner: RestaurantOwner | null;
  user: User | null;
}): AuthenticatedPrincipal | null {
  if (input.adminAccount) {
    return { kind: "admin", id: input.adminAccount.id, email: input.adminAccount.email, name: input.adminAccount.name, source: "password" };
  }
  if (input.restaurantOwner) {
    return {
      kind: "owner",
      id: input.restaurantOwner.id,
      email: input.restaurantOwner.email,
      name: input.restaurantOwner.name,
      source: input.restaurantOwner.provider,
    };
  }
  if (input.user) {
    return { kind: "platform", id: input.user.id, email: input.user.email, name: input.user.name, source: "manus" };
  }
  return null;
}
