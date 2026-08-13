/**
 * Client for the PolicyEngine UK chat service (policyengine-uk-chat).
 *
 * The service exposes a public SSE endpoint (POST /chat/message) that
 * streams a typed event sequence per turn: text chunks, tool activity
 * (including the exact tool inputs, so the model-validated reform JSON
 * is visible), follow-up suggestions, and a terminal done/error event.
 *
 * We consume it through a same-origin proxy route (/api/uk-chat/...)
 * so no CORS coordination with the service deployment is needed. This
 * client is purely additive on top of the service's public contract —
 * nothing here changes or depends on service internals.
 */

export interface UkChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UkChatToolEvent {
  toolName: string;
  toolId: string;
  toolInput?: Record<string, any>;
}

export interface UkChatDone {
  content: string;
  sessionId: string | null;
}

export interface UkChatHandlers {
  onChunk?: (text: string) => void;
  onToolStart?: (event: UkChatToolEvent) => void;
  onToolUse?: (event: UkChatToolEvent) => void;
  onToolResult?: (event: { toolName: string; status: 'success' | 'error' }) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onDone?: (done: UkChatDone) => void;
  onError?: (message: string) => void;
}

export const UK_CHAT_PROXY_ENDPOINT = '/api/uk-chat/chat/message';

/**
 * The live service is UK-only today; the proxy route only exists in the
 * Next.js calculator build, so the Vite app keeps the keyword matcher.
 */
export function isUkChatEnabled(countryId: string): boolean {
  const killSwitch =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_UK_CHAT) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_UK_CHAT);
  return countryId === 'uk' && killSwitch !== 'off';
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
export async function streamUkChatTurn(
  { messages, sessionId }: { messages: UkChatMessage[]; sessionId?: string | null },
  handlers: UkChatHandlers,
  options: { signal?: AbortSignal; endpoint?: string } = {}
): Promise<void> {
  const response = await fetch(options.endpoint ?? UK_CHAT_PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, session_id: sessionId ?? null }),
    signal: options.signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`UK chat service responded ${response.status}`);
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

function dispatchFrame(frame: string, handlers: UkChatHandlers): void {
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
      handlers.onError?.(event.content || 'The UK chat service hit an error.');
      break;
    default:
      break;
  }
}
