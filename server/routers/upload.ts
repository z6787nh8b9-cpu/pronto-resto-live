import { z } from "zod";
import { router, restaurantOwnerProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { acceptedMediaTypes, decodeStrictBase64, hasValidMediaSignature, mediaExtension } from "../media-validation";

const acceptedMediaTypeSchema = z.enum(acceptedMediaTypes);
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export const uploadRouter = router({
  uploadImage: restaurantOwnerProcedure
    .input(
      z.object({
        base64Data: z.string().min(16).max(7_000_000),
        filename: z.string().trim().min(1).max(255),
        mimeType: acceptedMediaTypeSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Extract base64 data without the data URL prefix
      const base64Match = input.base64Data.match(/^data:([A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
      if (!base64Match || base64Match[1] !== input.mimeType) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le format déclaré du média est invalide." });
      }

      const buffer = decodeStrictBase64(base64Match[2]);
      if (!buffer || buffer.length > MAX_MEDIA_BYTES || !hasValidMediaSignature(buffer, input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier est invalide, son format ne correspond pas ou il dépasse 5 Mo." });
      }

      // Generate unique filename
      const uniqueFilename = `${nanoid()}.${mediaExtension(input.mimeType)}`;
      const actorId = ctx.restaurantOwner?.id ?? ctx.adminAccount?.id;
      if (!actorId) throw new Error("Unauthorized");
      const fileKey = `uploads/${actorId}/${uniqueFilename}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      return { url, key: fileKey };
    }),
});
