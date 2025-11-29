import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { r2Operations } from "@/lib/r2";
import { 
  listProjectsQuerySchema,
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
    const validation = validateQueryParams(searchParams, listProjectsQuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { maxKeys, continuationToken } = validation.data;

    // Use email as username (more reliable)
    const githubUsername = session.user.email.split("@")[0];

    const result = await r2Operations.listProjects(githubUsername, {
      maxKeys,
      continuationToken,
    });

    return NextResponse.json({
      projects: result.projectIds,
      nextToken: result.nextToken,
      isTruncated: result.isTruncated,
      totalReturned: result.projectIds.length,
    });
  } catch (error: unknown) {
    console.error("R2 list error:", error);
    
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
      { error: "Failed to list projects from cloud storage" },
      { status: 500 }
    );
  }
}