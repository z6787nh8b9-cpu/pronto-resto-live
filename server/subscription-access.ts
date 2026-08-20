import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

export type SubscriptionTier = "menu" | "pro" | "premium";
export type SubscriptionFeature = "translations" | "premium";

const tierRank: Record<SubscriptionTier, number> = {
  menu: 0,
  pro: 1,
  premium: 2,
};

const minimumTier: Record<SubscriptionFeature, SubscriptionTier> = {
  translations: "pro",
  premium: "premium",
};

const featureLabel: Record<SubscriptionFeature, string> = {
  translations: "les traductions",
  premium: "cette fonctionnalité Premium",
};

export function requireSubscriptionFeature(
  ctx: Pick<TrpcContext, "adminAccount">,
  subscriptionTier: string | null | undefined,
  feature: SubscriptionFeature,
) {
  if (ctx.adminAccount) return;

  const currentTier: SubscriptionTier = subscriptionTier === "pro" || subscriptionTier === "premium"
    ? subscriptionTier
    : "menu";
  const requiredTier = minimumTier[feature];

  if (tierRank[currentTier] < tierRank[requiredTier]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Votre formule ne donne pas accès à ${featureLabel[feature]}.`,
    });
  }
}
