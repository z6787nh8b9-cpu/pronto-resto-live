import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { restaurantRouter } from "./routers/restaurant";
import { publicRouter } from "./routers/public";
import { uploadRouter } from "./routers/upload";
import { translationsRouter } from "./routers/translations";
import { openingHoursRouter } from "./routers/openingHours";
import { reservationsRouter } from "./routes/reservations";
import { eventsRouter } from "./routers/events";
import { galleryRouter } from "./routers/gallery";
import { invitationsRouter } from "./routers/invitations";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Admin routes
  admin: adminRouter,

  // Restaurant management routes
  restaurant: restaurantRouter,

  // Public routes (menu, chatbot)
  public: publicRouter,

  // Upload routes
  upload: uploadRouter,

  // Translation routes
  translations: translationsRouter,

  // Opening hours routes
  openingHours: openingHoursRouter,

  // Reservations routes
  reservations: reservationsRouter,

  // Events routes
  events: eventsRouter,

  // Invitations routes
  invitations: invitationsRouter,

  // Gallery routes
  gallery: galleryRouter,
});

export type AppRouter = typeof appRouter;
