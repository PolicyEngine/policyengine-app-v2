import { describe, expect, it } from 'vitest';
import { buildChatUrl } from '@/utils/chatUrl';

describe('buildChatUrl', () => {
  it('targets the canonical UK chat path with encoded context', () => {
    const url = new URL(buildChatUrl({ scenarioContext: 'year=2026&country=uk' }));

    expect(url.origin).toBe('https://policyengine-uk-chat.vercel.app');
    expect(url.pathname).toBe('/uk/chat');
    expect(url.searchParams.get('scenario_context')).toBe('year=2026&country=uk');
    expect(url.searchParams.get('model_backend')).toBe('uk_python');
  });
});
