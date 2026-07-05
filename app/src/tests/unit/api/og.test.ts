import { describe, expect, test, vi } from 'vitest';

import {
  MOCK_APP_WITH_IMAGE,
  MOCK_APP_WITHOUT_IMAGE,
  MOCK_POST,
  MOCK_POST_WITHOUT_IMAGE,
} from '@/tests/fixtures/middleware/ogMocks';

vi.mock('../../../../src/data/posts/posts.json', () => ({
  default: [MOCK_POST, MOCK_POST_WITHOUT_IMAGE],
}));

vi.mock('../../../../src/data/apps/apps.json', () => ({
  default: [MOCK_APP_WITH_IMAGE, MOCK_APP_WITHOUT_IMAGE],
}));

import ogHandler from '../../../../api/og';

describe('app/api/og', () => {
  test('escapes reflected url content in og html', async () => {
    const request = new Request(
      'https://policyengine.org/api/og?path=/us%22%20onmouseover%3D%22alert(1)'
    );

    const response = await ogHandler(request);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('https://policyengine.org/us&quot; onmouseover=&quot;alert(1)');
    expect(html).not.toContain('onmouseover="alert(1)');
  });
});
