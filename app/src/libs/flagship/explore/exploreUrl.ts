import { NATION_REGION, regionLevel } from './baselineData';
import { DEFAULT_METRIC, exploreMetric, type ExploreMetric } from './exploreMetrics';

export interface ExploreView {
  metric: ExploreMetric;
  /** "us", "state/oh" or "congressional_district/OH-09". */
  region: string;
}

const REGION_PATTERN = /^(us|state\/[a-z]{2}|congressional_district\/[A-Z]{2}-\d{2})$/;

/** The view a link names: `?metric=child_poverty&region=state/oh`. */
export function readExploreView(search: string): ExploreView {
  const params = new URLSearchParams(search);
  const region = params.get('region') ?? '';
  return {
    metric: exploreMetric(params.get('metric')),
    region: REGION_PATTERN.test(region) ? region : NATION_REGION,
  };
}

/** The Explore path for a view; the default parts stay out of the link. */
export function exploreHref(countryId: string, view: ExploreView): string {
  const params = new URLSearchParams();
  if (view.metric.key !== DEFAULT_METRIC.key) {
    params.set('metric', view.metric.key);
  }
  if (regionLevel(view.region) !== 'nation') {
    params.set('region', view.region);
  }
  const query = params.toString().replace(/%2F/g, '/');
  return `/${countryId}/explore${query ? `?${query}` : ''}`;
}

/** The Build path, with a search term for the parameter search when one is given. */
export function buildHref(countryId: string, search?: string): string {
  return `/${countryId}/build${search ? `?q=${encodeURIComponent(search)}` : ''}`;
}
