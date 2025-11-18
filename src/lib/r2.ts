import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" for region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2 compatibility
});

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  content: {
    qtInput: string;
    viOutput: string;
  };
  metadata: {
    chapter?: number;
    progress?: number;
    wordCount?: number;
    status?: "in-progress" | "completed";
  };
}

export const r2Operations = {
  async saveProject(githubUsername: string, project: Project): Promise<void> {
    const key = `${githubUsername}/projects/${project.id}.json`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      Body: JSON.stringify(project, null, 2),
      ContentType: "application/json",
    });

    await r2Client.send(command);
  },

  async loadProject(githubUsername: string, projectId: string): Promise<Project | null> {
    try {
      const key = `${githubUsername}/projects/${projectId}.json`;

      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
        Key: key,
      });

      const response = await r2Client.send(command);
      const body = await response.Body?.transformToString();

      if (!body) {
        return null;
      }

      return JSON.parse(body) as Project;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return null;
      }
      throw error;
    }
  },

  async deleteProject(githubUsername: string, projectId: string): Promise<void> {
    const key = `${githubUsername}/projects/${projectId}.json`;

    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
    });

    await r2Client.send(command);
  },

  async listProjects(githubUsername: string): Promise<string[]> {
    const prefix = `${githubUsername}/projects/`;

    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents
      .map((obj) => obj.Key)
      .filter((key): key is string => !!key)
      .map((key) => key.replace(prefix, "").replace(".json", ""));
  },
};