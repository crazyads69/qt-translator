import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";
import { 
  saveProjectRequestSchema, 
  validateRequestBody,
  type Project 
} from "@/lib/validations";

export async function POST(req: NextRequest) {
  let requestData: unknown = null;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body with Zod
    const validation = await validateRequestBody(req, saveProjectRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const requestBody = validation.data;
    requestData = requestBody;

    // Use email as username (more reliable than name)
    const githubUsername = session.user.email.split("@")[0];
    
    // Ensure timestamps exist
    const project: Project = {
      id: requestBody.id,
      title: requestBody.title,
      content: requestBody.content,
      createdAt: requestBody.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        description: requestBody.metadata?.description || "",
        chapters: requestBody.metadata?.chapters || [],
        progress: requestBody.metadata?.progress || 0,
        wordCount: (requestBody.content.qtInput?.split(/\s+/).filter(Boolean).length || 0) + 
                   (requestBody.content.viOutput?.split(/\s+/).filter(Boolean).length || 0),
        status: requestBody.metadata?.status || "in-progress",
        version: requestBody.metadata?.version || "1.0",
        ...requestBody.metadata
      }
    };

    await r2Operations.saveProject(githubUsername, project);

    return NextResponse.json({ 
      success: true, 
      projectId: project.id,
      updatedAt: project.updatedAt 
    });
  } catch (error: unknown) {
    console.error("R2 save error:", error);
    console.error("Request data:", JSON.stringify(requestData, null, 2));
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return specific error messages for client handling
    if (errorMessage.includes('required')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    if (errorMessage.includes('Rate limit') || errorMessage.includes('SlowDown')) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    if (errorMessage.includes('Access denied')) {
      return NextResponse.json(
        { error: "Access denied to cloud storage" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save to cloud storage" },
      { status: 500 }
    );
  }
}