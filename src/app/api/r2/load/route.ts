import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";
import { 
  loadProjectQuerySchema, 
  deleteProjectQuerySchema,
  validateQueryParams 
} from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(req.url);
    const validation = validateQueryParams(searchParams, loadProjectQuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { projectId, metadata } = validation.data;
    const metadataOnly = metadata === "true";

    // Use email as username (more reliable)
    const githubUsername = session.user.email.split("@")[0];

    if (metadataOnly) {
      // Return only metadata for quick checks
      const metadata = await r2Operations.getProjectMetadata(githubUsername, projectId);
      
      if (!metadata) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ metadata });
    } else {
      // Return full project data
      const project = await r2Operations.loadProject(githubUsername, projectId);

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        project,
      });
    }
  } catch (error: unknown) {
    console.error("R2 load error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes('required')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Rate limit') || errorMessage.includes('SlowDown')) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load from cloud storage" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(req.url);
    const validation = validateQueryParams(searchParams, deleteProjectQuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    // Use email as username (more reliable)
    const githubUsername = session.user.email.split("@")[0];

    await r2Operations.deleteProject(githubUsername, projectId);

    return NextResponse.json({ 
      success: true, 
      deletedProjectId: projectId 
    });
  } catch (error: unknown) {
    console.error("R2 delete error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes('required')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    if (errorMessage.includes('Rate limit') || errorMessage.includes('SlowDown')) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete from cloud storage" },
      { status: 500 }
    );
  }
}