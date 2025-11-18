import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const metadataOnly = searchParams.get("metadata") === "true";

    if (!projectId?.trim()) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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

      return NextResponse.json(project);
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId?.trim()) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

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