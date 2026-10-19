import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config";

export interface ResumeStorage {
  upload(userId: number, file: Express.Multer.File, extension: ".pdf" | ".docx"): Promise<string>;
  download(userId: number, resumeId: string): Promise<{ body: Uint8Array; contentType: string }>;
}

type StorageError = Error & { statusCode?: number };

function createStorageError(message: string, statusCode: number): StorageError {
  return Object.assign(new Error(message), { statusCode });
}

function getContentType(resumeId: string): string {
  return resumeId.endsWith(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isResumeId(resumeId: string): boolean {
  return /^[0-9a-f-]{36}\.(?:pdf|docx)$/i.test(resumeId);
}

export function createLocalResumeStorage(
  storageDirectory = path.resolve(
    process.cwd(),
    process.env.RESUME_STORAGE_DIR?.trim() || ".local-data/candidate-resumes",
  ),
): ResumeStorage {
  return {
    async upload(userId, file, extension) {
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw createStorageError("Invalid candidate ID", 400);
      }

      const resumeId = `${randomUUID()}${extension}`;
      const candidateDirectory = path.join(storageDirectory, String(userId));
      await mkdir(candidateDirectory, { recursive: true, mode: 0o700 });
      await writeFile(path.join(candidateDirectory, resumeId), file.buffer, {
        flag: "wx",
        mode: 0o600,
      });
      return resumeId;
    },
    async download(userId, resumeId) {
      if (!Number.isSafeInteger(userId) || userId <= 0 || !isResumeId(resumeId)) {
        throw createStorageError("Resume not found", 404);
      }

      try {
        const body = await readFile(path.join(storageDirectory, String(userId), resumeId));
        return { body: new Uint8Array(body), contentType: getContentType(resumeId) };
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
          throw createStorageError("Resume not found", 404);
        }
        throw error;
      }
    },
  };
}

export function createResumeStorage(): ResumeStorage {
  return config.isProduction ? createS3ResumeStorage() : createLocalResumeStorage();
}

function requiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createS3ResumeStorage(): ResumeStorage {
  return {
    async upload(userId, file, extension) {
      const bucket = requiredSetting("RESUME_S3_BUCKET");
      const region = process.env.RESUME_S3_REGION?.trim() || "us-east-1";
      const endpoint = process.env.RESUME_S3_ENDPOINT?.trim();
      const accessKeyId = requiredSetting("RESUME_S3_ACCESS_KEY_ID");
      const secretAccessKey = requiredSetting("RESUME_S3_SECRET_ACCESS_KEY");
      const resumeId = `${randomUUID()}${extension}`;
      const key = `candidate-resumes/${userId}/${resumeId}`;
      const client = new S3Client({
        region,
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        credentials: { accessKeyId, secretAccessKey },
      });

      try {
        await client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentLength: file.size,
          ContentType: extension === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ContentDisposition: "attachment",
        }));
      } finally {
        client.destroy();
      }

      return resumeId;
    },
    async download(userId, resumeId) {
      const bucket = requiredSetting("RESUME_S3_BUCKET");
      const region = process.env.RESUME_S3_REGION?.trim() || "us-east-1";
      const endpoint = process.env.RESUME_S3_ENDPOINT?.trim();
      const accessKeyId = requiredSetting("RESUME_S3_ACCESS_KEY_ID");
      const secretAccessKey = requiredSetting("RESUME_S3_SECRET_ACCESS_KEY");
      const client = new S3Client({
        region,
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        credentials: { accessKeyId, secretAccessKey },
      });

      try {
        const result = await client.send(new GetObjectCommand({
          Bucket: bucket,
          Key: `candidate-resumes/${userId}/${resumeId}`,
        }));
        if (!result.Body) throw new Error("Resume object has no body");
        return {
          body: await result.Body.transformToByteArray(),
          contentType: result.ContentType ?? (resumeId.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        };
      } finally {
        client.destroy();
      }
    },
  };
}
