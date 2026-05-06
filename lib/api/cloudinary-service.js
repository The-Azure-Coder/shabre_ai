import { v2 as cloudinary } from "cloudinary";
import { appConfig } from "./config.js";

let configured = false;

export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = appConfig.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

export async function uploadBufferToCloudinary({ buffer, fileName, mime }) {
  if (!isCloudinaryConfigured()) {
    const error = new Error("Cloudinary is not configured");
    error.code = "STORAGE_NOT_CONFIGURED";
    throw error;
  }

  configureCloudinary();
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: appConfig.cloudinary.folder,
        public_id: publicIdFromName(fileName),
        resource_type: "raw",
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        context: { mime },
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(uploadResult);
      },
    );
    stream.end(buffer);
  });

  return {
    provider: "cloudinary",
    publicId: result.public_id,
    resourceType: result.resource_type,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    format: result.format,
  };
}

export async function deleteCloudinaryAsset(storage) {
  if (!storage || storage.provider !== "cloudinary" || !storage.publicId) return;
  configureCloudinary();
  await cloudinary.uploader.destroy(storage.publicId, { resource_type: storage.resourceType || "raw" });
}

export async function verifyCloudinaryRetrievable(secureUrl) {
  const response = await fetch(secureUrl, { method: "GET" });
  if (!response.ok) {
    const error = new Error(`Cloudinary asset was not retrievable: ${response.status}`);
    error.code = "STORAGE_RETRIEVE_FAILED";
    throw error;
  }
  return {
    ok: true,
    status: response.status,
    contentType: response.headers.get("content-type"),
    bytes: Number(response.headers.get("content-length") || 0),
  };
}

function configureCloudinary() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = appConfig.cloudinary;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

function publicIdFromName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "");
  return `${base || "assignment"}-${Date.now()}`;
}
