import { z } from "zod";
import { router, restaurantOwnerProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const uploadRouter = router({
  uploadImage: restaurantOwnerProcedure
    .input(
      z.object({
        base64Data: z.string(),
        filename: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Extract base64 data without the data URL prefix
      const base64Match = input.base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error("Invalid base64 data");
      }

      const base64Content = base64Match[2];
      const buffer = Buffer.from(base64Content, "base64");

      // Generate unique filename
      const ext = input.filename.split(".").pop() || "jpg";
      const uniqueFilename = `${nanoid()}.${ext}`;
      const actorId = ctx.restaurantOwner?.id ?? ctx.adminAccount?.id ?? ctx.user?.id;
      if (!actorId) throw new Error("Unauthorized");
      const fileKey = `uploads/${actorId}/${uniqueFilename}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      return { url, key: fileKey };
    }),
});
