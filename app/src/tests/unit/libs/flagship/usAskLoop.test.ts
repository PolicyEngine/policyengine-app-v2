import { describe, expect, test, vi } from 'vitest';
import { runAskAgentLoop, type AskAgentEvent } from '@/libs/flagship/usAskLoop';
import {
  createScriptedClient,
  textReply,
  toolReply,
} from '@/tests/fixtures/libs/flagship/usAskLoopMocks';

const baseOptions = {
  model: 'claude-opus-5-5',
  system: 'You draft reforms.',
  tools: [],
  messages: [{ role: 'user' as const, content: 'Raise the CTC to $5,000' }],
};

describe('runAskAgentLoop', () => {
  test('given tool calls then every result returns in one message and the answer follows', async () => {
    const { client, requests } = createScriptedClient([
      toolReply([
        { id: 't1', name: 'search_parameters', input: { query: 'ctc' } },
        { id: 't2', name: 'get_parameter', input: { path: 'gov.irs.credits.ctc' } },
      ]),
      textReply('Validated.'),
    ]);
    const executeTool = vi.fn((name: string) => ({ output: `${name} done`, isError: false }));
    const events: AskAgentEvent[] = [];

    const result = await runAskAgentLoop({
      ...baseOptions,
      client,
      executeTool,
      onEvent: (event) => events.push(event),
    });

    expect(result.stopReason).toBe('answered');
    expect(result.finalText).toBe('Validated.');
    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(result.toolCalls.map((call) => call.name)).toEqual([
      'search_parameters',
      'get_parameter',
    ]);
    const followUp = requests[1].params.messages;
    expect(followUp).toHaveLength(3);
    expect(followUp[2].content.map((block: any) => block.tool_use_id)).toEqual(['t1', 't2']);
    expect(events.filter((event) => event.type === 'tool_result')).toHaveLength(2);
    expect(events.at(-1)).toEqual({ type: 'text', delta: 'Validated.' });
  });

  test('given several model calls then usage adds up across them', async () => {
    const { client } = createScriptedClient([
      {
        ...toolReply([{ id: 't1', name: 'x', input: {} }]),
        usage: { input_tokens: 50, output_tokens: 5, cache_read_input_tokens: 40 },
      },
      {
        ...textReply('Done'),
        usage: { input_tokens: 60, output_tokens: 7, cache_creation_input_tokens: 30 },
      },
    ]);

    const result = await runAskAgentLoop({
      ...baseOptions,
      client,
      executeTool: () => ({ output: '{}', isError: false }),
    });

    expect(result.usage).toEqual({
      modelCalls: 2,
      inputTokens: 110,
      outputTokens: 12,
      cacheReadTokens: 40,
      cacheWriteTokens: 30,
    });
  });

  test('given the tool budget is spent then tools are switched off and the turn ends', async () => {
    const { client, requests } = createScriptedClient([
      toolReply([{ id: 't1', name: 'x', input: {} }]),
      toolReply([{ id: 't2', name: 'x', input: {} }]),
      toolReply([{ id: 't3', name: 'x', input: {} }], 'Here is what I found.'),
    ]);

    const result = await runAskAgentLoop({
      ...baseOptions,
      client,
      maxToolTurns: 2,
      executeTool: () => ({ output: '{}', isError: false }),
    });

    expect(requests).toHaveLength(3);
    expect(requests[0].params.tool_choice).toBeUndefined();
    expect(requests[2].params.tool_choice).toEqual({ type: 'none' });
    expect(result.stopReason).toBe('tool_budget');
    expect(result.finalText).toBe('Here is what I found.');
  });

  test('given a refusal then the loop stops without running tools', async () => {
    const { client } = createScriptedClient([{ content: [], stopReason: 'refusal' }]);
    const executeTool = vi.fn();

    const result = await runAskAgentLoop({ ...baseOptions, client, executeTool });

    expect(result.stopReason).toBe('refusal');
    expect(executeTool).not.toHaveBeenCalled();
  });

  test('given the request is aborted then the loop reports it instead of throwing', async () => {
    const { client } = createScriptedClient([textReply('never read')]);
    const controller = new AbortController();
    controller.abort();

    const result = await runAskAgentLoop({
      ...baseOptions,
      client,
      signal: controller.signal,
      executeTool: vi.fn(),
    });

    expect(result.stopReason).toBe('aborted');
  });

  test('given effort, caching and fallbacks then the request carries them', async () => {
    const { client, requests } = createScriptedClient([textReply('ok')]);

    await runAskAgentLoop({
      ...baseOptions,
      client,
      effort: 'medium',
      cachePrompt: true,
      fallbacks: true,
      executeTool: vi.fn(),
    });

    expect(requests[0].params).toMatchObject({
      output_config: { effort: 'medium' },
      cache_control: { type: 'ephemeral' },
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
    });
  });

  test('given no options then the request sends none of them', async () => {
    const { client, requests } = createScriptedClient([textReply('ok')]);

    await runAskAgentLoop({ ...baseOptions, client, executeTool: vi.fn() });

    expect(requests[0].params).not.toHaveProperty('output_config');
    expect(requests[0].params).not.toHaveProperty('cache_control');
    expect(requests[0].params).not.toHaveProperty('fallbacks');
  });
});
