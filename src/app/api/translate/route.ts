/**
 * QT Translator - DeepSeek Translation API Route
 * Server-side translation endpoint that uses lib/translator.ts functions
 * This endpoint handles the actual AI API calls for the client-side translator
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import { getSystemPrompt, type TranslateAction } from "@/lib/translator";
import { 
  translationRequestSchema, 
  validateRequestBody 
} from "@/lib/validations";

/**
 * Server-side translation function using DeepSeek AI
 * This mirrors the client-side translateText but runs on the server
 */
async function serverTranslateText(text: string, action: TranslateAction) {
  if (!text.trim()) {
    return { result: text, usage: undefined };
  }

  // Check if DeepSeek API key is configured
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Translation service not configured");
  }

  // Prepare system prompt based on action
  const systemPrompt = getSystemPrompt(action);
  
  // Configure generation parameters based on action
  const generationParams = {
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    prompt: text,
    temperature: action === "fix_spelling" ? 0.1 : 0.3,
    maxTokens: Math.min(text.length * 2 + 1000, 8000), // Dynamic max tokens
    topP: 0.9,
    frequencyPenalty: 0.1,
  };

  // Call DeepSeek API via Vercel AI SDK
  const result = await generateText(generationParams);

  // Log usage information for monitoring
  if (result.usage) {
    console.log("Translation usage:", result.usage);
  }

  // Log provider metadata for monitoring (if available)
  if (result.providerMetadata) {
    console.log("Provider metadata:", result.providerMetadata);
  }

  return {
    result: result.text,
    usage: result.usage ? { ...result.usage } : undefined,
  };
}

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
    const validation = await validateRequestBody(request, translationRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { text, action } = validation.data;

    // Use the server-side translation function
    const translationResult = await serverTranslateText(text, action as TranslateAction);

    return NextResponse.json({
      result: translationResult.result,
      usage: translationResult.usage,
    });

  } catch (error) {
    console.error("Translation API error:", error);
    
    // Handle specific DeepSeek API errors with more detail
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("api key") || errorMessage.includes("unauthorized")) {
        return NextResponse.json(
          { error: "Invalid or missing API key" },
          { status: 401 }
        );
      }
      
      if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a few moments." },
          { status: 429 }
        );
      }
      
      if (errorMessage.includes("quota") || errorMessage.includes("insufficient")) {
        return NextResponse.json(
          { error: "API quota exceeded. Please check your account balance." },
          { status: 429 }
        );
      }
      
      if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
        return NextResponse.json(
          { error: "Request timeout. Please try again." },
          { status: 503 }
        );
      }
      
      if (errorMessage.includes("content") || errorMessage.includes("safety")) {
        return NextResponse.json(
          { error: "Content rejected by safety filter" },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes("not configured")) {
        return NextResponse.json(
          { error: "Translation service not configured" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
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