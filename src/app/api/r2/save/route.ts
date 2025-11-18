import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await req.json();

    if (!project.id || !project.title) {
      return NextResponse.json(
        { error: "Project ID and title are required" },
        { status: 400 }
      );
    }

    // Use email username or fallback to "user"
    const githubUsername = session.user.email?.split("@")[0] || "user";

    await r2Operations.saveProject(githubUsername, {
      ...project,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("R2 save error:", error);
    return NextResponse.json(
      { error: "Failed to save to R2" },
      { status: 500 }
    );
  }
}