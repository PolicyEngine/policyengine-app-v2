import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  askChatEndpoint,
  AskChatHandlers,
  streamAskChatTurn,
  toolActivityLabel,
} from '@/api/askChat';

function sseResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      frames.forEach((frame) => controller.enqueue(encoder.encode(frame)));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function collectingHandlers() {
  const events: Array<{ kind: string; payload: any }> = [];
  const handlers: AskChatHandlers = {
    onChunk: (text) => events.push({ kind: 'chunk', payload: text }),
    onToolStart: (event) => events.push({ kind: 'tool_start', payload: event }),
    onToolUse: (event) => events.push({ kind: 'tool_use', payload: event }),
    onToolResult: (event) => events.push({ kind: 'tool_result', payload: event }),
    onSuggestions: (suggestions) => events.push({ kind: 'suggestions', payload: suggestions }),
    onDone: (done) => events.push({ kind: 'done', payload: done }),
    onError: (message) => events.push({ kind: 'error', payload: message }),
  };
  return { events, handlers };
}

describe('streamAskChatTurn', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a full event stream then handlers fire in order with parsed payloads', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"type": "tool_start", "tool_name": "run_society_simulation", "tool_id": "t1"}\n\n',
            'data: {"type": "tool_use", "tool_name": "run_society_simulation", "tool_id": "t1", "tool_input": {"reform": {"gov.x": 1}}}\n\n',
            'data: {"type": "chunk", "content": "The reform "}\n\n',
            'data: {"type": "chunk", "content": "costs £2 billion."}\n\n',
            'data: {"type": "suggestions", "suggestions": ["What about poverty?"]}\n\n',
            'data: {"type": "done", "content": "The reform costs £2 billion.", "session_id": "s1"}\n\n',
          ])
        )
    );
    const { events, handlers } = collectingHandlers();

    // When
    await streamAskChatTurn({ messages: [{ role: 'user', content: 'cost?' }] }, handlers);

    // Then
    expect(events.map((e) => e.kind)).toEqual([
      'tool_start',
      'tool_use',
      'chunk',
      'chunk',
      'suggestions',
      'done',
    ]);
    expect(events[1].payload.toolInput.reform).toEqual({ 'gov.x': 1 });
    expect(events[5].payload).toEqual({ content: 'The reform costs £2 billion.', sessionId: 's1' });
  });

  test('given a frame split across network chunks then it still parses once complete', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"type": "chunk", "con',
            'tent": "hello"}\n\ndata: {"type": "done", "content": "hello", "session_id": null}\n\n',
          ])
        )
    );
    const { events, handlers } = collectingHandlers();

    // When
    await streamAskChatTurn({ messages: [{ role: 'user', content: 'hi' }] }, handlers);

    // Then
    expect(events).toEqual([
      { kind: 'chunk', payload: 'hello' },
      { kind: 'done', payload: { content: 'hello', sessionId: null } },
    ]);
  });

  test('given a non-2xx response then the call rejects so callers can fall back', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 }))
    );

    // When / Then
    await expect(
      streamAskChatTurn({ messages: [{ role: 'user', content: 'hi' }] }, {})
    ).rejects.toThrow('429');
  });
});

describe('toolActivityLabel', () => {
  test('given known tool names then friendly activity labels return', () => {
    expect(toolActivityLabel('run_society_simulation')).toBe('Running a society-wide simulation');
    expect(toolActivityLabel('compute_poverty_metrics')).toBe('Computing impacts');
    expect(toolActivityLabel('search_parameters')).toBe('Looking up the policy model');
    expect(toolActivityLabel('something_new')).toBe('Working');
  });
});

describe('askChatEndpoint', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('given uk then the UK proxy endpoint returns unless killed', () => {
    expect(askChatEndpoint('uk')).toBe('/api/uk-chat/chat/message');
    vi.stubEnv('NEXT_PUBLIC_UK_CHAT', 'off');
    expect(askChatEndpoint('uk')).toBeNull();
  });

  test('given us then the ask agent endpoint is opt-in', () => {
    expect(askChatEndpoint('us')).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_US_ASK', 'on');
    expect(askChatEndpoint('us')).toBe('/api/us-ask/chat/message');
  });

  test('given another country then no chat endpoint returns', () => {
    expect(askChatEndpoint('ca')).toBeNull();
  });
});
