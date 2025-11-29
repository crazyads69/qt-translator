import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations, Project } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, chapter } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    }

    // Use email as username (more reliable)
    const githubUsername = session.user.email.split("@")[0];

    const project: Project = {
      id: uuidv4(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        qtInput: "",
        viOutput: "",
      },
      metadata: {
        chapter: chapter ? parseInt(chapter) : undefined,
        progress: 0,
        wordCount: 0,
        status: "in-progress",
        version: "1.0",
      },
    };

    await r2Operations.saveProject(githubUsername, project);

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    console.error("Create project error:", error);
    
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
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}