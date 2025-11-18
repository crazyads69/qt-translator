import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Use email username or fallback to "user"
    const githubUsername = session.user.email?.split("@")[0] || "user";

    const project = await r2Operations.loadProject(githubUsername, projectId);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("R2 load error:", error);
    return NextResponse.json(
      { error: "Failed to load from R2" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Use email username or fallback to "user"
    const githubUsername = session.user.email?.split("@")[0] || "user";

    await r2Operations.deleteProject(githubUsername, projectId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("R2 delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete from R2" },
      { status: 500 }
    );
  }
}