import { z } from "zod";

/**
 * Shared validation schemas for API routes
 * Using Zod for type-safe validation and automatic TypeScript inference
 */

// Chapter validation schema
export const chapterSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  qtInput: z.string().optional(),
  viOutput: z.string().optional(),
  wordCount: z.number().int().min(0).optional(),
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
});

// Project metadata validation schema - metadata is required in Project type
export const projectMetadataSchema = z.object({
  description: z.string().optional(),
  chapters: z.array(chapterSchema).optional(),
  chapter: z.number().int().positive().optional(), // Backward compatibility
  progress: z.number().int().min(0).max(100).optional(),
  wordCount: z.number().int().min(0).optional(),
  status: z.enum(["in-progress", "completed"]).optional(),
  version: z.string().optional(),
});

// Project content validation schema
export const projectContentSchema = z.object({
  qtInput: z.string(),
  viOutput: z.string(),
});

// Full project validation schema - metadata is required
export const projectSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  content: projectContentSchema,
  metadata: projectMetadataSchema,
});

// Create project request schema
export const createProjectRequestSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  chapters: z.array(chapterSchema).optional(),
});

// Save project request schema
export const saveProjectRequestSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: projectContentSchema,
  createdAt: z.string().datetime().optional(),
  metadata: projectMetadataSchema.optional(),
});

// Translation request schema
export const translationRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  action: z.enum(["translate", "polish", "fix_spelling", "batch"]),
});

// Streaming translation request schema (smaller text limit)
export const streamingTranslationRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  action: z.enum(["translate", "polish", "fix_spelling"]),
});

// Batch translation request schema
export const batchTranslationRequestSchema = z.object({
  lines: z.array(z.string().max(10000)).min(1).max(100),
  action: z.enum(["translate", "polish", "fix_spelling"]),
});

// Load project query schema
export const loadProjectQuerySchema = z.object({
  projectId: z.string().min(1).max(100),
  metadata: z.enum(["true", "false"]).optional(),
});

// Delete project query schema  
export const deleteProjectQuerySchema = z.object({
  projectId: z.string().min(1).max(100),
});

// List projects query schema
export const listProjectsQuerySchema = z.object({
  maxKeys: z.coerce.number().int().min(1).max(50).default(20),
  continuationToken: z.string().optional(),
});

// Type inference for TypeScript
export type Chapter = z.infer<typeof chapterSchema>;
export type ProjectMetadata = z.infer<typeof projectMetadataSchema>;
export type ProjectContent = z.infer<typeof projectContentSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type SaveProjectRequest = z.infer<typeof saveProjectRequestSchema>;
export type TranslationRequest = z.infer<typeof translationRequestSchema>;
export type StreamingTranslationRequest = z.infer<typeof streamingTranslationRequestSchema>;
export type BatchTranslationRequest = z.infer<typeof batchTranslationRequestSchema>;
export type LoadProjectQuery = z.infer<typeof loadProjectQuerySchema>;
export type DeleteProjectQuery = z.infer<typeof deleteProjectQuerySchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/**
 * Utility function to handle Zod validation errors
 */
export function formatValidationError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? ` at ${issue.path.join(".")}` : "";
    return `${issue.message}${path}`;
  });
  
  return `Validation failed: ${issues.join(", ")}`;
}

/**
 * Middleware for validating request body with Zod
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json();
    const result = schema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatValidationError(error) };
    }
    return { success: false, error: "Invalid JSON in request body" };
  }
}

/**
 * Middleware for validating query parameters with Zod
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.parse(params);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatValidationError(error) };
    }
    return { success: false, error: "Invalid query parameters" };
  }
}