import type Anthropic from '@anthropic-ai/sdk';

/**
 * The Ask agent's tool loop, shared by the streaming chat route and the
 * offline evaluation so both exercise exactly the same agent. It calls
 * the model, runs every requested tool, returns all results in one user
 * message, and repeats until the model answers or the tool budget runs
 * out, at which point tools are switched off so the turn always ends in
 * prose.
 */

export type AskAgentEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface AskAgentUsage {
  modelCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface AskAgentToolCall {
  id: string;
  name: string;
  input: unknown;
  output: string;
  isError: boolean;
}

export type AskAgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_start'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; name: string; output: string; isError: boolean };

export interface AskAgentToolOutcome {
  output: string;
  isError: boolean;
}

export interface AskAgentLoopOptions {
  client: Pick<Anthropic, 'beta'>;
  model: string;
  system: string;
  tools: Anthropic.Beta.BetaToolUnion[];
  messages: Anthropic.Beta.BetaMessageParam[];
  executeTool: (name: string, input: unknown) => AskAgentToolOutcome | Promise<AskAgentToolOutcome>;
  onEvent?: (event: AskAgentEvent) => void;
  signal?: AbortSignal;
  /** Model calls allowed to request tools before the answer is forced. */
  maxToolTurns?: number;
  maxTokens?: number;
  /** Omitted means the model's own default effort. */
  effort?: AskAgentEffort;
  /** Cache the tools, system prompt, and growing history across calls. */
  cachePrompt?: boolean;
  /** Let the API retry on a server-chosen model when this one declines. */
  fallbacks?: boolean;
}

export type AskAgentStopReason = 'answered' | 'tool_budget' | 'refusal' | 'aborted';

export interface AskAgentResult {
  finalText: string;
  stopReason: AskAgentStopReason;
  usage: AskAgentUsage;
  toolCalls: AskAgentToolCall[];
}

const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

function emptyUsage(): AskAgentUsage {
  return {
    modelCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return (
    !!signal?.aborted ||
    (error instanceof Error && (error.name === 'AbortError' || error.name === 'APIUserAbortError'))
  );
}

export async function runAskAgentLoop({
  client,
  model,
  system,
  tools,
  messages,
  executeTool,
  onEvent,
  signal,
  maxToolTurns = 10,
  maxTokens = 16000,
  effort,
  cachePrompt = false,
  fallbacks = false,
}: AskAgentLoopOptions): Promise<AskAgentResult> {
  const conversation = [...messages];
  const usage = emptyUsage();
  const toolCalls: AskAgentToolCall[] = [];
  let finalText = '';

  const result = (stopReason: AskAgentStopReason): AskAgentResult => ({
    finalText,
    stopReason,
    usage,
    toolCalls,
  });

  for (let turn = 0; ; turn++) {
    if (signal?.aborted) {
      return result('aborted');
    }
    const forceAnswer = turn >= maxToolTurns;
    let message: Anthropic.Beta.BetaMessage;
    try {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: maxTokens,
          system,
          tools,
          messages: conversation,
          ...(forceAnswer ? { tool_choice: { type: 'none' as const } } : {}),
          ...(effort ? { output_config: { effort } } : {}),
          ...(cachePrompt ? { cache_control: { type: 'ephemeral' as const } } : {}),
          ...(fallbacks ? { fallbacks: 'default' as const, betas: [FALLBACK_BETA] } : {}),
        },
        { signal }
      );
      stream.on('text', (delta) => onEvent?.({ type: 'text', delta }));
      message = await stream.finalMessage();
    } catch (error) {
      if (isAbort(error, signal)) {
        return result('aborted');
      }
      throw error;
    }

    usage.modelCalls += 1;
    usage.inputTokens += message.usage.input_tokens;
    usage.outputTokens += message.usage.output_tokens;
    usage.cacheReadTokens += message.usage.cache_read_input_tokens ?? 0;
    usage.cacheWriteTokens += message.usage.cache_creation_input_tokens ?? 0;

    if (message.stop_reason === 'refusal') {
      return result('refusal');
    }

    finalText = message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
    const toolUses = message.content.filter(
      (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === 'tool_use'
    );
    if (toolUses.length === 0) {
      return result('answered');
    }
    if (forceAnswer) {
      return result('tool_budget');
    }

    // Thinking and tool-use blocks must go back unchanged, so the whole
    // assistant message is appended; the history only ever grows.
    conversation.push({ role: 'assistant', content: message.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      onEvent?.({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input });
      const { output, isError } = await executeTool(toolUse.name, toolUse.input);
      toolCalls.push({ id: toolUse.id, name: toolUse.name, input: toolUse.input, output, isError });
      onEvent?.({ type: 'tool_result', id: toolUse.id, name: toolUse.name, output, isError });
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: output,
        is_error: isError,
      });
    }
    // Every result goes back in one message; splitting them teaches the
    // model to stop calling tools in parallel.
    conversation.push({ role: 'user', content: results });
  }
}
