import { useEffect, useMemo, useRef, useState } from 'react';
import ExploreMap from '@/components/flagship/explore/ExploreMap';
import MapLegend from '@/components/flagship/explore/MapLegend';
import MetricPills from '@/components/flagship/explore/MetricPills';
import PlaceCard from '@/components/flagship/explore/PlaceCard';
import RegionRanking from '@/components/flagship/explore/RegionRanking';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { Title } from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useExploreData } from '@/hooks/useExploreData';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useV3SearchFileInBackground } from '@/hooks/useV3SearchCatalog';
import { useV3VariablesInBackground } from '@/hooks/useV3Variables';
import { isExploreEnabled } from '@/libs/featureFlags';
import {
  EXPLORE_YEAR,
  NATION_REGION,
  regionLevel,
  regionsAt,
  stateCodeOf,
  stateRegion,
  type BaselineFile,
  type BaselineMetricKey,
} from '@/libs/flagship/explore/baselineData';
import { draftForRegion } from '@/libs/flagship/explore/buildHandoff';
import { levelScale } from '@/libs/flagship/explore/colorScale';
import { exploreMetric, MAP_METRICS } from '@/libs/flagship/explore/exploreMetrics';
import { buildHref, exploreHref, readExploreView } from '@/libs/flagship/explore/exploreUrl';

const linkButton = {
  border: 0,
  background: 'none',
  padding: 0,
  color: colors.text.link,
  fontSize: typography.fontSize.sm,
  cursor: 'pointer',
} as const;

/** Wide enough for the card to float beside the map. */
const WIDE_QUERY = '(min-width: 1024px)';
const PANEL_WIDTH = 360;

const mapButton = {
  border: `1px solid ${colors.border.light}`,
  background: 'rgba(255, 255, 255, 0.92)',
  padding: `${spacing.xs} ${spacing.sm}`,
  borderRadius: spacing.radius.element,
  color: colors.gray[700],
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  cursor: 'pointer',
} as const;

/**
 * Explore: current law before any reform. A map of the United States
 * colored by one measure (poverty, child poverty, median income,
 * inequality), down to states and congressional districts, with a card
 * for the chosen place and a way into Build for it. The figures come
 * from one static file; nothing here starts a simulation.
 */
export default function ExplorePage() {
  const countryId = useCurrentCountry();
  const nav = useAppNavigate();
  const { search } = useAppLocation();
  const view = readExploreView(search);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const redirected = useRef(false);

  // The flag can live in localStorage, so it is read after mount. With it
  // off, Build stands in, once.
  useEffect(() => {
    const enabled = isExploreEnabled(countryId);
    setAllowed(enabled);
    if (!enabled && !redirected.current) {
      redirected.current = true;
      nav.replace(`/${countryId}/build`);
    }
  }, [countryId, nav]);

  const { baseline, states, districts } = useExploreData(countryId, EXPLORE_YEAR);
  // Build's search file and variables load meanwhile, so Build opens ready.
  useV3SearchFileInBackground();
  useV3VariablesInBackground();

  if (!allowed) {
    return null;
  }

  const error = baseline.error ?? states.error ?? districts.error;
  return (
    <div className="tw:lg:h-full">
      {error ? (
        <div style={{ padding: spacing['2xl'] }}>
          <ErrorState
            title="Could not load current law"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => Promise.all([baseline.refetch(), states.refetch(), districts.refetch()])}
          />
        </div>
      ) : baseline.data && states.data && districts.data ? (
        <ExploreView
          file={baseline.data}
          stateShapes={states.data}
          districtShapes={districts.data}
          metricKey={view.metric.key}
          region={baseline.data.regions[view.region] ? view.region : NATION_REGION}
          onNavigate={(next, replace) => {
            const href = exploreHref(countryId, {
              metric: exploreMetric(next.metric),
              region: next.region,
            });
            if (replace) {
              nav.replace(href);
            } else {
              nav.push(href);
            }
          }}
          onModel={(region) => {
            draftForRegion(countryId, region);
            nav.push(buildHref(countryId));
          }}
        />
      ) : (
        <SkeletonRegion
          label="Loading current law"
          style={{ display: 'grid', gap: spacing.lg, padding: spacing['2xl'] }}
        >
          <SkeletonLine width="40%" height={28} />
          <SkeletonLine width="70%" />
          <SkeletonLine height={420} />
        </SkeletonRegion>
      )}
    </div>
  );
}

interface ExploreViewProps {
  file: BaselineFile;
  stateShapes: NonNullable<ReturnType<typeof useExploreData>['states']['data']>;
  districtShapes: NonNullable<ReturnType<typeof useExploreData>['districts']['data']>;
  metricKey: BaselineMetricKey;
  region: string;
  /** A metric change replaces the history entry; a place change adds one, so Back goes back out. */
  onNavigate: (next: { metric: BaselineMetricKey; region: string }, replace?: boolean) => void;
  onModel: (region: string) => void;
}

function ExploreView({
  file,
  stateShapes,
  districtShapes,
  metricKey,
  region,
  onNavigate,
  onModel,
}: ExploreViewProps) {
  const metric = exploreMetric(metricKey);
  const level = regionLevel(region);
  const stateCode = stateCodeOf(region);
  const [showDistricts, setShowDistricts] = useState(false);
  const districtMode = level !== 'nation' || showDistricts;
  const scale = useMemo(
    () => levelScale(file, metric.key, districtMode ? 'district' : 'state'),
    [file, metric.key, districtMode]
  );

  const select = (next: string) => onNavigate({ metric: metric.key, region: next });
  const setMetric = (key: BaselineMetricKey) => onNavigate({ metric: key, region }, true);
  const up = () =>
    select(level === 'district' && stateCode ? stateRegion(stateCode) : NATION_REGION);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && level !== 'nation') {
        up();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const stateName = stateCode ? file.regions[stateRegion(stateCode)]?.label : null;
  const placeName = file.regions[region]?.label ?? region;
  const rankRegions =
    level !== 'nation'
      ? regionsAt(file, 'district', stateCode)
      : regionsAt(file, showDistricts ? 'district' : 'state');
  const rankTitle =
    level !== 'nation'
      ? `${stateName} districts, highest to lowest`
      : `${showDistricts ? 'Congressional districts' : 'States'}, highest to lowest`;
  const wide = useMediaQuery(WIDE_QUERY);
  // The free part of the map: on a wide screen the title strip floats
  // along the top and the card on the right; on a phone both sit outside
  // the map.
  const inset = wide
    ? { top: 96, right: PANEL_WIDTH + 40, bottom: 72, left: 24 }
    : { top: 12, right: 12, bottom: 12, left: 12 };

  return (
    <div className="tw:flex tw:flex-col tw:lg:block tw:lg:relative tw:lg:h-full">
      <header
        className="tw:flex tw:flex-col tw:gap-md tw:p-lg tw:lg:absolute tw:lg:top-lg tw:lg:left-lg tw:lg:z-10 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:lg:gap-lg tw:lg:rounded-lg tw:lg:bg-white/90 tw:lg:px-lg tw:lg:py-sm tw:lg:shadow-sm tw:lg:backdrop-blur"
        style={{ right: wide ? PANEL_WIDTH + 40 : undefined }}
      >
        <div style={{ minWidth: 0 }}>
          <nav
            aria-label="Place"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            {level === 'nation' ? (
              <span>Current law, {file.year}</span>
            ) : (
              <>
                <button type="button" style={linkButton} onClick={() => select(NATION_REGION)}>
                  United States
                </button>
                <span aria-hidden>›</span>
                {level === 'district' && stateCode ? (
                  <>
                    <button
                      type="button"
                      style={linkButton}
                      onClick={() => select(stateRegion(stateCode))}
                    >
                      {stateName}
                    </button>
                    <span aria-hidden>›</span>
                    <span aria-current="page">{placeName}</span>
                  </>
                ) : (
                  <span aria-current="page">{stateName}</span>
                )}
              </>
            )}
            {file.placeholder && (
              <span
                role="note"
                title="The model figures are placeholders, not model output. The Census figures are real."
                style={{
                  marginLeft: spacing.xs,
                  padding: '0 6px',
                  borderRadius: 999,
                  border: `1px solid ${colors.warning}`,
                  color: colors.text.warning,
                  whiteSpace: 'nowrap',
                }}
              >
                Placeholder figures
                <span className="tw:sr-only">
                  : the model figures are placeholders, not model output. The Census figures are
                  real.
                </span>
              </span>
            )}
          </nav>
          <Title
            order={1}
            style={{
              letterSpacing: '-0.01em',
              margin: '2px 0 0',
              fontSize: typography.fontSize.xl,
              whiteSpace: wide ? 'nowrap' : undefined,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {level === 'nation'
              ? 'Where things stand across the United States'
              : `Where things stand in ${placeName}`}
          </Title>
        </div>
        <MetricPills metrics={MAP_METRICS} value={metric.key} onChange={setMetric} />
      </header>

      <div className="tw:relative tw:aspect-[8/5] tw:lg:absolute tw:lg:inset-0 tw:lg:aspect-auto">
        <ExploreMap
          file={file}
          states={stateShapes}
          districts={districtShapes}
          metric={metric}
          region={region}
          onSelect={select}
          showDistricts={showDistricts}
          scale={scale}
          inset={inset}
        />
      </div>

      <div className="tw:flex tw:items-end tw:gap-sm tw:px-lg tw:pt-sm tw:lg:absolute tw:lg:bottom-lg tw:lg:left-lg tw:lg:z-10 tw:lg:p-0">
        <MapLegend
          label={`${metric.label} · ${districtMode ? 'districts' : 'states'}`}
          min={metric.format(scale.min)}
          max={metric.format(scale.max)}
        />
        {level !== 'nation' ? (
          <button type="button" style={mapButton} onClick={() => select(NATION_REGION)}>
            ← United States
          </button>
        ) : (
          <button
            type="button"
            style={mapButton}
            aria-pressed={showDistricts}
            onClick={() => setShowDistricts((on) => !on)}
          >
            {showDistricts ? 'Show states' : 'Show districts'}
          </button>
        )}
      </div>
      <aside
        aria-label="Chosen place"
        className="tw:flex tw:flex-col tw:gap-md tw:p-lg tw:lg:absolute tw:lg:top-lg tw:lg:right-lg tw:lg:bottom-lg tw:lg:z-10 tw:lg:overflow-y-auto tw:lg:p-0"
        style={{ width: wide ? PANEL_WIDTH : undefined }}
      >
        <PlaceCard
          file={file}
          region={region}
          metric={metric}
          onMetricChange={setMetric}
          onModel={() => onModel(region)}
        />
        <div
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            padding: `0 ${spacing.xl} ${spacing.lg}`,
            background: colors.white,
          }}
        >
          <RegionRanking
            file={file}
            regions={rankRegions}
            metric={metric}
            scale={scale}
            title={rankTitle}
            selected={region}
            onSelect={select}
          />
        </div>
      </aside>
    </div>
  );
}
