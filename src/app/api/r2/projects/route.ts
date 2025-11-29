import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations, Project } from "@/lib/r2";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const maxKeys = Math.min(parseInt(searchParams.get("maxKeys") || "20"), 50);
    const continuationToken = searchParams.get("continuationToken") || undefined;

    // Use email as username (more reliable)
    const githubUsername = session.user.email.split("@")[0];

    // Get list of project IDs
    const listResult = await r2Operations.listProjects(githubUsername, {
      maxKeys,
      continuationToken,
    });

    // Load full project details for each project
    const projects: Project[] = [];
    for (const projectId of listResult.projectIds) {
      try {
        const project = await r2Operations.loadProject(githubUsername, projectId);
        if (project) {
          projects.push(project);
        }
      } catch (error) {
        console.warn(`Failed to load project ${projectId}:`, error);
        // Continue with other projects even if one fails
      }
    }

    // Sort projects by updatedAt (latest first)
    projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      projects,
      nextToken: listResult.nextToken,
      isTruncated: listResult.isTruncated,
      totalReturned: projects.length,
    });
  } catch (error: unknown) {
    console.error("R2 projects list error:", error);
    
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
      { error: "Failed to load projects from cloud storage" },
      { status: 500 }
    );
  }
}