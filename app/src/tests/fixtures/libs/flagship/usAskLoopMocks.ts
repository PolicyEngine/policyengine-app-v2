import type Anthropic from '@anthropic-ai/sdk';

type ScriptedBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown };

export interface ScriptedReply {
  content: ScriptedBlock[];
  stopReason?: string;
  usage?: Partial<{
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
  }>;
}

export const textReply = (text: string): ScriptedReply => ({
  content: [{ type: 'text', text }],
  stopReason: 'end_turn',
  usage: { input_tokens: 100, output_tokens: 20 },
});

export const toolReply = (
  calls: Array<{ id: string; name: string; input: unknown }>,
  text = ''
): ScriptedReply => ({
  content: [
    ...(text ? [{ type: 'text' as const, text }] : []),
    ...calls.map((call) => ({ type: 'tool_use' as const, ...call })),
  ],
  stopReason: 'tool_use',
  usage: { input_tokens: 100, output_tokens: 30 },
});

/**
 * A stand-in for the SDK client: each stream call returns the next
 * scripted reply, emits its text through 'text' listeners, and records
 * the request so tests can inspect what the loop sent.
 */
export function createScriptedClient(replies: ScriptedReply[]) {
  const requests: Array<{ params: any; options: any }> = [];
  let index = 0;
  const client = {
    beta: {
      messages: {
        stream(params: any, options: any) {
          requests.push({ params: structuredClone(params), options });
          const reply = replies[Math.min(index++, replies.length - 1)];
          const listeners: Array<(delta: string) => void> = [];
          return {
            on(event: string, listener: (delta: string) => void) {
              if (event === 'text') {
                listeners.push(listener);
              }
              return this;
            },
            async finalMessage() {
              if (options?.signal?.aborted) {
                const error = new Error('Request was aborted.');
                error.name = 'APIUserAbortError';
                throw error;
              }
              for (const block of reply.content) {
                if (block.type === 'text') {
                  listeners.forEach((listener) => listener(block.text));
                }
              }
              return {
                content: reply.content,
                stop_reason: reply.stopReason ?? 'end_turn',
                usage: {
                  input_tokens: 0,
                  output_tokens: 0,
                  cache_read_input_tokens: 0,
                  cache_creation_input_tokens: 0,
                  ...reply.usage,
                },
              };
            },
          };
        },
      },
    },
  };
  return { client: client as unknown as Pick<Anthropic, 'beta'>, requests };
}
