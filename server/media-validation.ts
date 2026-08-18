export const acceptedMediaTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type AcceptedMediaType = typeof acceptedMediaTypes[number];

export function isAcceptedMediaType(value: string): value is AcceptedMediaType {
  return (acceptedMediaTypes as readonly string[]).includes(value);
}

export function hasValidMediaSignature(data: Buffer, mimeType: AcceptedMediaType) {
  if (mimeType === "image/jpeg") return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (mimeType === "image/png") return data.length > 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/webp") return data.length > 12 && data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP";
  return data.length > 4 && data.subarray(0, 4).toString() === "%PDF";
}
