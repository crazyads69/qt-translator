/**
 * QT Translator - DeepSeek AI Integration via Vercel AI SDK
 * Handles translation, polishing, and spell checking of QT output to Vietnamese
 */

export type TranslateAction = "translate" | "polish" | "fix_spelling" | "batch";

export interface TranslateRequest {
  text: string;
  action: TranslateAction;
  stream?: boolean;
}

export interface TranslateResponse {
  result: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  reasoningText?: string; // For DeepSeek reasoning models
  error?: string;
}

export interface StreamChunk {
  type: 'text' | 'reasoning' | 'error' | 'done';
  content: string;
  usage?: TranslateResponse['usage'];
}

/**
 * Get system prompt for different translation actions
 */
function getSystemPrompt(action: TranslateAction): string {
  switch (action) {
    case "translate":
      return `You are a professional Chinese-to-Vietnamese translator specializing in Quick Translator (QT) output refinement.

Your task is to convert messy QT machine translation output into natural, fluent Vietnamese text while preserving the original meaning and context.

Key Guidelines:
1. Fix word order and grammar issues typical of QT output
2. Convert inappropriate Sino-Vietnamese (Hán Việt) words to modern Vietnamese equivalents when it improves naturalness
3. Maintain the original tone and style (formal, casual, literary, dialogue, narrative, etc.)
4. Preserve character names, places, cultural references, and proper nouns exactly as they appear
5. Ensure natural flow and readability suitable for Vietnamese literature
6. Keep paragraph structure and line breaks intact
7. Handle dialogue tags, quotation marks, and formatting consistently
8. Maintain emotional tone and register appropriate to the context

Return ONLY the translated Vietnamese text without any explanations, notes, or commentary.`;

    case "polish":
      return `You are a Vietnamese text editor specializing in refining translated literary content.

Your task is to polish and improve existing Vietnamese text to make it more natural, elegant, and readable while preserving the original meaning and style.

Key Guidelines:
1. Improve sentence flow and rhythm for better readability
2. Remove awkward phrasing and unnatural word choices while keeping the exact meaning
3. Enhance natural feel without changing the writing style or register
4. Fix minor grammar issues and improve word choice where appropriate
5. Maintain the original tone, voice, and emotional register
6. Preserve all proper nouns, character names, and technical terms exactly
7. Keep the same paragraph structure and formatting
8. Ensure consistency in dialogue tags and narrative voice
9. Make minimal changes - only improve what sounds unnatural

Return ONLY the polished Vietnamese text without any explanations, notes, or commentary.`;

    case "fix_spelling":
      return `You are a Vietnamese proofreader focused on correcting spelling, tone marks, and basic grammar errors.

Your task is to fix typos, incorrect tone marks (dấu thanh), and basic grammatical mistakes in Vietnamese text while making minimal changes.

Key Guidelines:
1. Correct spelling errors and obvious typos
2. Fix Vietnamese tone marks (dấu sắc, huyền, hỏi, ngã, nặng) when incorrectly placed
3. Fix basic grammar mistakes (subject-verb agreement, word order)
4. Preserve the original style, register, and structure completely
5. Keep all proper nouns, character names, and places unchanged unless obviously misspelled
6. Maintain paragraph breaks, formatting, and punctuation
7. Only make necessary corrections - do not rephrase or improve style
8. Preserve dialogue formatting and quotation marks

Return ONLY the corrected Vietnamese text without any explanations, notes, or commentary.`;

    case "batch":
      return `You are a professional Chinese-to-Vietnamese translator for batch processing of Quick Translator (QT) output.

Your task is to translate multiple lines/segments efficiently while maintaining consistency across the entire batch.

Key Guidelines:
1. Process each line/segment independently but maintain consistency
2. Follow the same translation principles as individual translation
3. Preserve formatting, line breaks, and structure exactly
4. Maintain character name consistency across all segments
5. Handle dialogue and narrative consistently throughout
6. Apply the same tone and style choices across the entire batch
7. Fix QT-specific issues uniformly across all segments

Return ONLY the translated Vietnamese text without any explanations, notes, or commentary.`;

    default:
      throw new Error(`Unknown translation action: ${action}`);
  }
}

/**
 * Translate text using DeepSeek API via Vercel AI SDK
 */
export const translateText = async (
  text: string,
  action: TranslateAction,
  options: { stream?: boolean } = {}
): Promise<string> => {
  if (!text.trim()) {
    return text;
  }

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        action,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Translation failed: ${response.statusText}`;
      
      // Log specific error types for debugging
      if (response.status === 401) {
        console.error("Authentication error:", errorMessage);
      } else if (response.status === 429) {
        console.error("Rate limit error:", errorMessage);
      } else if (response.status >= 500) {
        console.error("Server error:", errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    const data: TranslateResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Log usage information for monitoring
    if (data.usage) {
      console.debug(`Translation usage - Prompt: ${data.usage.promptTokens}, Completion: ${data.usage.completionTokens}, Total: ${data.usage.totalTokens}`);
    }

    return data.result || text; // Fallback to original text
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text on error to prevent data loss
    return text;
  }
};

/**
 * Stream translation with real-time updates
 */
export const streamTranslate = async (
  text: string,
  action: TranslateAction,
  onChunk: (chunk: StreamChunk) => void
): Promise<string> => {
  if (!text.trim()) {
    return text;
  }

  try {
    const response = await fetch("/api/translate/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        action,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data: StreamChunk = JSON.parse(line.replace(/^data: /, ''));
            
            if (data.type === 'text') {
              result += data.content;
            }
            
            onChunk(data);
            
            if (data.type === 'done') {
              return result;
            }
          } catch {
            // Ignore malformed JSON chunks
          }
        }
      }
    }

    return result || text;
  } catch (error) {
    console.error("Stream translation error:", error);
    onChunk({ type: 'error', content: error instanceof Error ? error.message : 'Stream failed' });
    return text;
  }
};

/**
 * Batch translate multiple lines with progress tracking
 * Uses the dedicated batch API endpoint for better performance
 */
export const batchTranslate = async (
  lines: string[],
  action: TranslateAction,
  onProgress?: (current: number, total: number, currentLine?: string) => void
): Promise<string[]> => {
  if (lines.length === 0) {
    return [];
  }

  // For small batches, use individual API calls
  if (lines.length <= 5) {
    return batchTranslateIndividual(lines, action, onProgress);
  }

  try {
    const response = await fetch("/api/translate/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lines,
        action,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Batch translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log usage information
    if (data.usage) {
      console.debug(`Batch translation usage - Lines: ${data.processedLines}/${data.totalLines}, Tokens: ${data.usage.totalTokens}`);
    }

    return data.results || lines; // Fallback to original lines
  } catch (error) {
    console.error("Batch translation error:", error);
    // Fallback to individual translation
    return batchTranslateIndividual(lines, action, onProgress);
  }
};

/**
 * Fallback batch translation using individual API calls
 */
const batchTranslateIndividual = async (
  lines: string[],
  action: TranslateAction,
  onProgress?: (current: number, total: number, currentLine?: string) => void
): Promise<string[]> => {
  const results: string[] = [];
  const totalLines = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      results.push(line);
      if (onProgress) {
        onProgress(i + 1, totalLines, line);
      }
      continue;
    }

    try {
      const result = await translateText(line, action);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, totalLines, result);
      }
    } catch (error) {
      console.error(`Failed to translate line ${i + 1}:`, error);
      results.push(line); // Keep original on error
      
      if (onProgress) {
        onProgress(i + 1, totalLines, line);
      }
    }
    
    // Small delay to prevent rate limiting
    if (i < lines.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Chunk large text for processing
 */
export const chunkText = (text: string, maxChunkSize: number = 2000): string[] => {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/([.!?。！？])\s*/);
  let currentChunk = "";

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || "");
    
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is too long, force split
        chunks.push(sentence);
      }
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Translate large text with automatic chunking
 */
export const translateLargeText = async (
  text: string,
  action: TranslateAction,
  onProgress?: (current: number, total: number) => void
): Promise<string> => {
  const chunks = chunkText(text);
  
  if (chunks.length === 1) {
    return translateText(text, action);
  }

  const results: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const result = await translateText(chunks[i], action);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, chunks.length);
    }
  }

  return results.join(" ");
};

/**
 * Server-side batch translation function
 * This runs on the server and directly calls the AI SDK
 */
export const serverBatchTranslate = async (
  lines: string[],
  action: TranslateAction,
  onProgress?: (current: number, total: number) => void
): Promise<{ results: string[], totalUsage?: { promptTokens: number, completionTokens: number, totalTokens: number } }> => {
  // Dynamic imports for server-side only dependencies
  const { deepseek } = await import('@ai-sdk/deepseek');
  const { generateText } = await import('ai');

  const results: string[] = [];
  const totalLines = lines.length;
  const totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      results.push(line);
      if (onProgress) {
        onProgress(i + 1, totalLines);
      }
      continue;
    }

    try {
      // Use the same logic as the main translate route
      const systemPrompt = getSystemPrompt(action);
      
      const generationParams = {
        model: deepseek("deepseek-chat"),
        system: systemPrompt,
        prompt: line,
        temperature: action === "fix_spelling" ? 0.1 : 0.3,
        maxTokens: Math.min(line.length * 2 + 500, 4000),
        topP: 0.9,
        frequencyPenalty: 0.1,
      };

      const result = await generateText(generationParams);
      results.push(result.text);
      
      // Accumulate usage statistics
      if (result.usage) {
        totalUsage.promptTokens += (result.usage as { promptTokens?: number }).promptTokens || 0;
        totalUsage.completionTokens += (result.usage as { completionTokens?: number }).completionTokens || 0;
        totalUsage.totalTokens += (result.usage as { totalTokens?: number }).totalTokens || 0;
      }
      
      if (onProgress) {
        onProgress(i + 1, totalLines);
      }
    } catch (error) {
      console.error(`Failed to translate line ${i + 1}:`, error);
      results.push(line); // Keep original on error
      
      if (onProgress) {
        onProgress(i + 1, totalLines);
      }
    }
    
    // Small delay to prevent rate limiting
    if (i < lines.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { results, totalUsage };
};

export { getSystemPrompt };