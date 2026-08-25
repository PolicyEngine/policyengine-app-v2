/**
 * Client for the flagship Ask chat services.
 *
 * Both country services stream the same typed SSE event sequence per
 * turn — text chunks, tool activity (including exact tool inputs, so
 * model-validated reform JSON is visible to the chat→draft bridge),
 * follow-up suggestions, and a terminal done/error event:
 *
 * - UK: the policyengine-uk-chat service, consumed through a
 *   same-origin proxy route (purely additive over its public contract).
 * - US: the in-repo ask agent route (Claude + parameter-search tools
 *   over live policyengine-us metadata).
 */

export interface AskChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskChatToolEvent {
  toolName: string;
  toolId: string;
  toolInput?: Record<string, any>;
}

export interface AskChatDone {
  content: string;
  sessionId: string | null;
}

export interface AskChatHandlers {
  onChunk?: (text: string) => void;
  onToolStart?: (event: AskChatToolEvent) => void;
  onToolUse?: (event: AskChatToolEvent) => void;
  onToolResult?: (event: { toolName: string; status: 'success' | 'error' }) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onDone?: (done: AskChatDone) => void;
  onError?: (message: string) => void;
}

export const UK_CHAT_PROXY_ENDPOINT = '/api/uk-chat/chat/message';
export const US_ASK_ENDPOINT = '/api/us-ask/chat/message';

/**
 * The chat endpoint for a country, or null when Ask should use the
 * keyword matcher. UK is on by default (live service); US is opt-in
 * (NEXT_PUBLIC_US_ASK=on) because its route needs a server-side
 * ANTHROPIC_API_KEY. Both routes only exist in the Next.js build, so
 * the Vite app keeps the keyword matcher either way.
 *
 * Env reads must be static member expressions — Next.js inlines
 * process.env.NEXT_PUBLIC_* into the client bundle textually, so a
 * dynamic process.env[name] lookup is always undefined in the browser.
 */
export function askChatEndpoint(countryId: string): string | null {
  if (countryId === 'uk') {
    const flag =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_UK_CHAT) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UK_CHAT);
    return flag === 'off' ? null : UK_CHAT_PROXY_ENDPOINT;
  }
  if (countryId === 'us') {
    const flag =
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_US_ASK) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_US_ASK);
    return flag === 'on' ? US_ASK_ENDPOINT : null;
  }
  return null;
}

/** Human-readable activity line for the in-flight tool indicator. */
export function toolActivityLabel(toolName: string): string {
  if (toolName === 'run_society_simulation') {
    return 'Running a society-wide simulation';
  }
  if (toolName === 'run_household_simulation') {
    return 'Simulating an example household';
  }
  if (toolName.startsWith('compute_') || toolName === 'aggregate_result') {
    return 'Computing impacts';
  }
  if (
    toolName.startsWith('search_') ||
    toolName.startsWith('list_') ||
    toolName.startsWith('get_')
  ) {
    return 'Looking up the policy model';
  }
  if (toolName.startsWith('validate_')) {
    return 'Validating against the model';
  }
  if (toolName === 'generate_chart') {
    return 'Preparing results';
  }
  return 'Working';
}

/**
 * Streams one chat turn, invoking handlers as SSE events arrive.
 * Resolves when the stream closes; rejects on transport failure
 * (service unreachable, non-2xx) so callers can fall back.
 */
export async function streamAskChatTurn(
  { messages, sessionId }: { messages: AskChatMessage[]; sessionId?: string | null },
  handlers: AskChatHandlers,
  options: { signal?: AbortSignal; endpoint?: string } = {}
): Promise<void> {
  const response = await fetch(options.endpoint ?? UK_CHAT_PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, session_id: sessionId ?? null }),
    signal: options.signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Ask chat service responded ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      dispatchFrame(buffer.slice(0, boundary), handlers);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) {
    dispatchFrame(buffer, handlers);
  }
}

function dispatchFrame(frame: string, handlers: AskChatHandlers): void {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');
  if (!data) {
    return;
  }
  let event: any;
  try {
    event = JSON.parse(data);
  } catch {
    return;
  }
  switch (event.type) {
    case 'chunk':
      handlers.onChunk?.(event.content ?? '');
      break;
    case 'tool_start':
      handlers.onToolStart?.({ toolName: event.tool_name, toolId: event.tool_id });
      break;
    case 'tool_use':
      handlers.onToolUse?.({
        toolName: event.tool_name,
        toolId: event.tool_id,
        toolInput: event.tool_input,
      });
      break;
    case 'tool_result':
      handlers.onToolResult?.({ toolName: event.tool_name, status: event.status });
      break;
    case 'suggestions':
      handlers.onSuggestions?.(event.suggestions ?? []);
      break;
    case 'done':
      handlers.onDone?.({ content: event.content ?? '', sessionId: event.session_id ?? null });
      break;
    case 'error':
      handlers.onError?.(event.content || 'The chat service hit an error.');
      break;
    default:
      break;
  }
}
