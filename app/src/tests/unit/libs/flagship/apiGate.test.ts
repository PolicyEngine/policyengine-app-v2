import { afterEach, describe, expect, test, vi } from 'vitest';
import { isAskChatEnabled } from '@/libs/flagship/apiGate';

describe('isAskChatEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('given no chat flags then both chats stay off', () => {
    vi.stubEnv('NEXT_PUBLIC_US_ASK', '');
    vi.stubEnv('NEXT_PUBLIC_UK_CHAT', '');

    expect(isAskChatEnabled('us')).toBe(false);
    expect(isAskChatEnabled('uk')).toBe(false);
  });

  test('given a chat flag set to on then only that country is on', () => {
    vi.stubEnv('NEXT_PUBLIC_UK_CHAT', 'on');
    vi.stubEnv('NEXT_PUBLIC_US_ASK', 'off');

    expect(isAskChatEnabled('uk')).toBe(true);
    expect(isAskChatEnabled('us')).toBe(false);
  });
});
