import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface ResumeStorage {
  upload(userId: number, file: Express.Multer.File, extension: ".pdf" | ".docx"): Promise<string>;
  download(userId: number, resumeId: string): Promise<{ body: Uint8Array; contentType: string }>;
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
