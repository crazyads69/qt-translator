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

    // Parse request body directly (it contains full project object)
    const body = await req.json();
    requestData = body;
    
    if (!body.projectId || !body.project) {
      return NextResponse.json(
        { error: "Missing projectId or project data" },
        { status: 400 }
      );
    }

    const project = body.project;
    const projectId = body.projectId;

    // Use email as username (more reliable than name)
    const githubUsername = session.user.email.split("@")[0];
    
    // Ensure timestamps and required fields exist
    const updatedProject: Project = {
      ...project,
      id: projectId,
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString(),
      content: project.content || { qtInput: "", viOutput: "" },
      metadata: project.metadata || {}
    };

    await r2Operations.saveProject(githubUsername, updatedProject);

    return NextResponse.json({ 
      success: true, 
      projectId: updatedProject.id,
      updatedAt: updatedProject.updatedAt 
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