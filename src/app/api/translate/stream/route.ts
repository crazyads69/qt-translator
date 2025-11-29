/**
 * QT Translator - DeepSeek Streaming Translation API Route
 * Server-side streaming endpoint that uses lib/translator.ts functions
 * This endpoint handles streaming AI API calls for real-time translation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { getSystemPrompt, type TranslateAction } from "@/lib/translator";
import { 
  streamingTranslationRequestSchema, 
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
    const validation = await validateRequestBody(request, streamingTranslationRequestSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { text, action } = validation.data;

    // Check if DeepSeek API key is configured
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY not configured");
      return NextResponse.json(
        { error: "Translation service not configured" },
        { status: 500 }
      );
    }

    // Prepare system prompt based on action
    const systemPrompt = getSystemPrompt(action as TranslateAction);

    // Stream text using DeepSeek API via Vercel AI SDK
    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      prompt: text,
      temperature: action === "fix_spelling" ? 0.1 : 0.3,
      maxOutputTokens: Math.min(text.length * 2 + 1000, 4000),
    });

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = JSON.stringify({
              type: 'text',
              content: chunk,
            });
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
          }

          // Send final usage data if available
          const finalResult = await result;
          if (finalResult.usage) {
            const usageData = JSON.stringify({
              type: 'done',
              content: '',
              usage: finalResult.usage,
            });
            controller.enqueue(new TextEncoder().encode(`data: ${usageData}\n\n`));
          } else {
            const doneData = JSON.stringify({
              type: 'done',
              content: '',
            });
            controller.enqueue(new TextEncoder().encode(`data: ${doneData}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            type: 'error',
            content: error instanceof Error ? error.message : 'Stream failed',
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Streaming API error:", error);
    
    // Handle specific errors
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
    }

    return NextResponse.json(
      { error: "Streaming failed. Please try again." },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for streaming translation." },
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