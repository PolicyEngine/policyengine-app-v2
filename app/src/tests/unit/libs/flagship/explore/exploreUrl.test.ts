import { describe, expect, test } from 'vitest';
import { exploreMetric } from '@/libs/flagship/explore/exploreMetrics';
import { buildHref, exploreHref, readExploreView } from '@/libs/flagship/explore/exploreUrl';

describe('exploreUrl', () => {
  test('given no query then the view is poverty in the nation', () => {
    const view = readExploreView('');

    expect(view.metric.key).toBe('poverty');
    expect(view.region).toBe('us');
  });

  test('given a metric and a district then the view reads them', () => {
    const view = readExploreView('?metric=gini&region=congressional_district/OH-09');

    expect(view.metric.key).toBe('gini');
    expect(view.region).toBe('congressional_district/OH-09');
  });

  test('given an unknown metric or region then the defaults stand in', () => {
    const view = readExploreView('?metric=nope&region=../../etc');

    expect(view.metric.key).toBe('poverty');
    expect(view.region).toBe('us');
  });

  test('given the default view then the link has no query', () => {
    expect(exploreHref('us', { metric: exploreMetric('poverty'), region: 'us' })).toBe(
      '/us/explore'
    );
  });

  test('given a view then its link reads back as the same view', () => {
    const href = exploreHref('us', { metric: exploreMetric('child_poverty'), region: 'state/oh' });

    expect(href).toBe('/us/explore?metric=child_poverty&region=state/oh');
    expect(readExploreView(href.split('?')[1])).toMatchObject({ region: 'state/oh' });
  });

  test('given a program then Build opens with it as the search', () => {
    expect(buildHref('us', 'Child Tax Credit')).toBe('/us/build?q=Child%20Tax%20Credit');
    expect(buildHref('us')).toBe('/us/build');
  });
});

describe('isFullBleedPagePath', () => {
  test('given Explore then the page draws to the edges, and other pages do not', async () => {
    const { isFullBleedPagePath } = await import('@/libs/flagship/shellRoutes');

    expect(isFullBleedPagePath('/us/explore')).toBe(true);
    expect(isFullBleedPagePath('/us/explore?region=state/oh')).toBe(true);
    expect(isFullBleedPagePath('/us/build')).toBe(false);
  });
});
