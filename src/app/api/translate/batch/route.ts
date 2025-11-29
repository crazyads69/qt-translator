/**
 * QT Translator - Batch Translation API Route
 * Handles batch translation requests using the translator library
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { serverBatchTranslate, type TranslateAction } from "@/lib/translator";
import { 
  batchTranslationRequestSchema, 
  validateRequestBody 
} from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body with Zod
    const validation = await validateRequestBody(request, batchTranslationRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { lines, action } = validation.data;

    // Check if DeepSeek API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "Translation service not configured" },
        { status: 500 }
      );
    }

    // Process batch translation
    const batchResult = await serverBatchTranslate(lines, action as TranslateAction);

    return NextResponse.json({
      results: batchResult.results,
      totalLines: lines.length,
      processedLines: batchResult.results.length,
      usage: batchResult.totalUsage,
    });

  } catch (error) {
    console.error("Batch translation API error:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Invalid or missing API key" },
          { status: 401 }
        );
      }
      
      if (errorMessage.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a few moments." },
          { status: 429 }
        );
      }
      
      if (errorMessage.includes("quota")) {
        return NextResponse.json(
          { error: "API quota exceeded. Please check your account balance." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Batch translation failed. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for batch translation." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}