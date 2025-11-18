import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  HeadBucketCommand,
  S3ServiceException,
  NoSuchKey
} from "@aws-sdk/client-s3";
import { StandardRetryStrategy } from "@smithy/util-retry";

// Validate required environment variables
if (!process.env.CLOUDFLARE_R2_ENDPOINT) {
  throw new Error('CLOUDFLARE_R2_ENDPOINT environment variable is required');
}
if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
  throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID environment variable is required');
}
if (!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable is required');
}
if (!process.env.CLOUDFLARE_R2_BUCKET) {
  throw new Error('CLOUDFLARE_R2_BUCKET environment variable is required');
}

// Configure R2 client with proper retry strategy and error handling
const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" for region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 S3 compatibility
  // Configure retry strategy for better reliability
  retryStrategy: new StandardRetryStrategy(3), // Max 3 retry attempts
  // Enable following region redirects (useful for S3 compatibility)
  followRegionRedirects: true,
});

/**
 * Enhanced error handling for R2 operations
 */
function handleR2Error(error: unknown, operation: string): never {
  if (error instanceof NoSuchKey) {
    throw new Error(`Object not found during ${operation}`);
  }
  
  if (error instanceof S3ServiceException) {
    const statusCode = error.$metadata.httpStatusCode;
    const errorCode = error.name;
    
    // Handle specific R2/S3 errors
    switch (errorCode) {
      case 'NoSuchBucket':
        throw new Error(`Bucket not found during ${operation}`);
      case 'AccessDenied':
        throw new Error(`Access denied during ${operation}`);
      case 'InvalidBucketName':
        throw new Error(`Invalid bucket name during ${operation}`);
      case 'TooManyRequests':
      case 'SlowDown':
        throw new Error(`Rate limit exceeded during ${operation}. Please retry later.`);
      default:
        throw new Error(`R2 ${operation} failed: ${errorCode} (${statusCode})`);
    }
  }
  
  throw new Error(`Unknown error during ${operation}: ${error instanceof Error ? error.message : String(error)}`);
}

/**
 * Test R2 bucket connectivity
 */
export async function testR2Connection(): Promise<boolean> {
  try {
    const command = new HeadBucketCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    });
    
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 connection test failed:', error);
    return false;
  }
}

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
    // Add version for future compatibility
    version?: string;
  };
}

/**
 * Enhanced R2 operations with proper error handling and validation
 */
export const r2Operations = {
  /**
   * Save project to R2 with enhanced error handling
   */
  async saveProject(githubUsername: string, project: Project): Promise<void> {
    if (!githubUsername?.trim()) {
      throw new Error('GitHub username is required');
    }
    if (!project?.id?.trim()) {
      throw new Error('Project ID is required');
    }
    if (!project?.title?.trim()) {
      throw new Error('Project title is required');
    }

    const key = `${githubUsername}/projects/${project.id}.json`;
    
    // Add version for future compatibility
    const projectWithVersion = {
      ...project,
      metadata: {
        ...project.metadata,
        version: '1.0',
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
        Body: JSON.stringify(projectWithVersion, null, 2),
        ContentType: "application/json",
        // Add metadata for better tracking
        Metadata: {
          'project-id': project.id,
          'owner': githubUsername,
          'created-at': project.createdAt,
        },
      });

      await r2Client.send(command);
    } catch (error) {
      handleR2Error(error, 'save project');
    }
  },

  /**
   * Load project from R2 with enhanced error handling
   */
  async loadProject(githubUsername: string, projectId: string): Promise<Project | null> {
    if (!githubUsername?.trim()) {
      throw new Error('GitHub username is required');
    }
    if (!projectId?.trim()) {
      throw new Error('Project ID is required');
    }

    const key = `${githubUsername}/projects/${projectId}.json`;

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      });

      const response = await r2Client.send(command);
      const body = await response.Body?.transformToString();

      if (!body) {
        return null;
      }

      const project = JSON.parse(body) as Project;
      
      // Validate loaded project structure
      if (!project.id || !project.title || !project.content) {
        throw new Error('Invalid project data structure');
      }

      return project;
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return null;
      }
      handleR2Error(error, 'load project');
    }
  },

  /**
   * Delete project from R2 with enhanced error handling
   */
  async deleteProject(githubUsername: string, projectId: string): Promise<void> {
    if (!githubUsername?.trim()) {
      throw new Error('GitHub username is required');
    }
    if (!projectId?.trim()) {
      throw new Error('Project ID is required');
    }

    const key = `${githubUsername}/projects/${projectId}.json`;

    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      });

      await r2Client.send(command);
    } catch (error) {
      handleR2Error(error, 'delete project');
    }
  },

  /**
   * List projects from R2 with pagination support
   */
  async listProjects(
    githubUsername: string, 
    options: { maxKeys?: number; continuationToken?: string } = {}
  ): Promise<{ projectIds: string[]; nextToken?: string; isTruncated: boolean }> {
    if (!githubUsername?.trim()) {
      throw new Error('GitHub username is required');
    }

    const prefix = `${githubUsername}/projects/`;
    const { maxKeys = 100, continuationToken } = options;

    try {
      const command = new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Prefix: prefix,
        MaxKeys: Math.min(maxKeys, 1000), // R2 limit
        ContinuationToken: continuationToken,
      });

      const response = await r2Client.send(command);
      
      if (!response.Contents) {
        return { projectIds: [], isTruncated: false };
      }

      const projectIds = response.Contents
        .map((obj) => obj.Key)
        .filter((key): key is string => !!key)
        .map((key) => key.replace(prefix, "").replace(".json", ""))
        .filter(id => id.length > 0); // Filter out invalid IDs

      return {
        projectIds,
        nextToken: response.NextContinuationToken,
        isTruncated: response.IsTruncated || false,
      };
    } catch (error) {
      handleR2Error(error, 'list projects');
    }
  },

  /**
   * Get project metadata without downloading full content
   */
  async getProjectMetadata(githubUsername: string, projectId: string): Promise<{
    size: number;
    lastModified: Date;
    etag: string;
  } | null> {
    if (!githubUsername?.trim()) {
      throw new Error('GitHub username is required');
    }
    if (!projectId?.trim()) {
      throw new Error('Project ID is required');
    }

    const key = `${githubUsername}/projects/${projectId}.json`;

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
      });

      const response = await r2Client.send(command);
      
      if (!response.ContentLength || !response.LastModified || !response.ETag) {
        return null;
      }

      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
      };
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return null;
      }
      handleR2Error(error, 'get project metadata');
    }
  },
};