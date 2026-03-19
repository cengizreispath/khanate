import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';

export const runtime = 'edge';
export const maxDuration = 30;

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  context?: {
    worldId?: string;
    envId?: string;
    projectId?: string;
    agentId?: string;
  };
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json() as ChatRequest;

    // Build system prompt with context
    const systemPrompt = `Sen Khanate Dashboard'da çalışan bir AI asistansın.
${context?.worldId ? `\nDünya: ${context.worldId}` : ''}
${context?.envId ? `\nOrtam: ${context.envId}` : ''}
${context?.projectId ? `\nProje: ${context.projectId}` : ''}
${context?.agentId ? `\nAgent: ${context.agentId}` : ''}

Kullanıcıya yardımcı ol. Türkçe cevap ver. Kısa ve öz ol.`;

    // Convert to UIMessage format for the SDK
    const uiMessages: UIMessage[] = messages.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      parts: [{ type: 'text' as const, text: m.content }],
    }));

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(uiMessages);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: modelMessages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
