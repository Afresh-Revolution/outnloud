import { v2 as cloudinary } from "cloudinary";

function config() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY ?? "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET ?? "").trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return { cloudName, apiKey, apiSecret };
}

export function signUpload() {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "outnloud";
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
  return { cloudName, apiKey, timestamp, signature, folder };
}

export function isCloudinaryUrl(url: string, cloudName: string): boolean {
  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

export async function destroyAsset(publicId: string, kind: "image" | "video") {
  if (!publicId) return;
  config();
  await cloudinary.uploader.destroy(publicId, { resource_type: kind });
}
