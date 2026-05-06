export const uploadConstraints = {
  maxBytes: Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES || process.env.UPLOAD_MAX_BYTES || 50 * 1024 * 1024),
  allowedExtensions: ["txt", "pdf", "docx", "pptx"],
  allowedMimeTypes: {
    txt: ["text/plain", "application/octet-stream"],
    pdf: ["application/pdf"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  },
};

export function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function validateUploadFile(file) {
  if (!file) return "Select a file to upload.";

  const extension = getFileExtension(file.name);
  const acceptedMimes = uploadConstraints.allowedMimeTypes[extension];
  const mime = file.type || "application/octet-stream";

  if (!acceptedMimes || !acceptedMimes.includes(mime)) {
    return `Unsupported file type. Use ${uploadConstraints.allowedExtensions.map((item) => item.toUpperCase()).join(", ")}.`;
  }

  if (file.size <= 0) {
    return "File cannot be empty.";
  }

  if (file.size > uploadConstraints.maxBytes) {
    return `File is too large. Maximum size is ${Math.round(uploadConstraints.maxBytes / 1024 / 1024)}MB.`;
  }

  return "";
}
