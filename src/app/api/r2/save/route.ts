import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations, type Project } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    
    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    // Validate required project fields
    const requiredFields = ['id', 'title', 'content'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Project ${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate content structure
    if (!body.content.qtInput && !body.content.viOutput) {
      return NextResponse.json(
        { error: "Project must have either QT input or Vietnamese output" },
        { status: 400 }
      );
    }

    // Use email as username (more reliable than name)
    const githubUsername = session.user.email.split("@")[0];
    
    // Ensure timestamps exist
    const project: Project = {
      ...body,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...body.metadata,
        // Calculate word count for tracking
        wordCount: (body.content.qtInput?.split(/\s+/).length || 0) + 
                   (body.content.viOutput?.split(/\s+/).length || 0)
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