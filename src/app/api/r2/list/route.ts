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

    // Use email username or fallback to "user"
    const githubUsername = session.user.email?.split("@")[0] || "user";

    const projectIds = await r2Operations.listProjects(githubUsername);

    return NextResponse.json({ projects: projectIds });
  } catch (error: unknown) {
    console.error("R2 list error:", error);
    return NextResponse.json(
      { error: "Failed to list projects from R2" },
      { status: 500 }
    );
  }
}