import { loadLocalEnv } from "./env.js";
import { uploadConstraints } from "../upload-constraints.js";

loadLocalEnv();

export const appConfig = {
  get uploadMaxBytes() {
    return Number(process.env.UPLOAD_MAX_BYTES || uploadConstraints.maxBytes);
  },
  get jwtExpiresIn() {
    return Number(process.env.JWT_EXPIRES_IN || 3600);
  },
  get textMaxChars() {
    return Number(process.env.TEXT_MAX_CHARS || 12000);
  },
  get useCloudinary() {
    return process.env.USE_CLOUDINARY === "true";
  },
  get cloudinary() {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "smartreview-ai/uploads",
    };
  },
  get libreOfficePath() {
    return process.env.LIBREOFFICE_PATH || "";
  },
};

export const requiredEnv = [
  "JWT_SECRET",
  "DATABASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_API_KEY",
];

export function envStatus() {
  return Object.fromEntries(requiredEnv.map((name) => [name, Boolean(process.env[name])]));
}

export function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return new TextEncoder().encode(process.env.JWT_SECRET);
}
