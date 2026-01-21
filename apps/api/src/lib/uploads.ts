import fs from "fs/promises";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export type UploadedKind = "image" | "video" | "image-or-video";

export async function validateUploadedFile(file: Express.Multer.File, kind: UploadedKind) {
  const { fileTypeFromFile } = await import("file-type");
  const detected = await fileTypeFromFile(file.path);
  if (!detected) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }

  const isImage = detected.mime.startsWith("image/");
  const isVideo = detected.mime.startsWith("video/");
  if (kind === "image" && !isImage) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }
  if (kind === "video" && !isVideo) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }
  if (kind === "image-or-video" && !isImage && !isVideo) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    await cleanupFile(file.path);
    throw new Error("FILE_TOO_LARGE");
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    await cleanupFile(file.path);
    throw new Error("FILE_TOO_LARGE");
  }

  return { type: isVideo ? "VIDEO" : "IMAGE" };
}

async function cleanupFile(pathname: string) {
  try {
    await fs.unlink(pathname);
  } catch {
    // ignore cleanup errors
  }
}
