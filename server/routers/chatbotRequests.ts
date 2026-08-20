import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { chatbotRequests } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { verifyRecaptcha } from "../_core/recaptcha";
import { TRPCError } from "@trpc/server";

export const publicChatbotRequestSchema = z.object({
  type: z.enum(["call_request", "issue_report"]),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().min(3).max(40).regex(/^[+()0-9 .-]+$/).optional(),
  message: z.string().trim().min(1).max(2_000),
  recaptchaToken: z.string().min(1).max(4_096),
}).superRefine(({ type, email, phone }, ctx) => {
  if (type === "call_request" && !email && !phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Un email ou un numéro de téléphone est nécessaire pour une demande de rappel.",
    });
  }
});

export const chatbotRequestListSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
}).optional();

export const chatbotRequestStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "contacted", "resolved", "dismissed"]),
  adminNotes: z.string().trim().max(5_000).optional(),
});

export const chatbotRequestsRouter = router({
  // Public procedure - anyone can submit a request from the landing page
  submit: publicProcedure
    .input(publicChatbotRequestSchema)
    .mutation(async ({ input }) => {
      const isHuman = await verifyRecaptcha(input.recaptchaToken, "submit_assistance_request");
      if (!isHuman) throw new TRPCError({ code: "FORBIDDEN", message: "Vérification anti-spam refusée." });

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert the request
      const [request] = await db.insert(chatbotRequests).values({
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        status: "pending",
      });

      // Send notification to owner
      const typeLabel = input.type === "call_request" ? "Demande d'appel" : "Signalement";
      const contactInfo = [
        input.name && `Nom : ${input.name}`,
        input.email && `Email : ${input.email}`,
        input.phone && `Téléphone : ${input.phone}`,
      ]
        .filter(Boolean)
        .join("\n");

      await notifyOwner({
        title: `🔔 ${typeLabel} depuis le chatbot`,
        content: `${contactInfo}\n\nMessage : ${input.message}`,
      });

      return { success: true, id: request.insertId };
    }),

  // Protected procedure - only Super Admins can list requests
  list: adminProcedure.input(chatbotRequestListSchema).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const requests = await db
      .select()
      .from(chatbotRequests)
      .orderBy(desc(chatbotRequests.createdAt))
      .limit(input?.limit ?? 50);

    return requests;
  }),

  // Protected procedure - update request status
  updateStatus: adminProcedure
    .input(chatbotRequestStatusSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(chatbotRequests)
        .set({
          status: input.status,
          adminNotes: input.adminNotes,
        })
        .where(eq(chatbotRequests.id, input.id));

      return { success: true };
    }),
});
