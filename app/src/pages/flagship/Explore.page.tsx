import { useEffect, useMemo, useRef, useState } from 'react';
import ExploreMap from '@/components/flagship/explore/ExploreMap';
import MetricPills from '@/components/flagship/explore/MetricPills';
import PlaceCard from '@/components/flagship/explore/PlaceCard';
import RegionRanking from '@/components/flagship/explore/RegionRanking';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import WorkspaceLayout from '@/components/flagship/WorkspaceLayout';
import { Title } from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useExploreData } from '@/hooks/useExploreData';
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

  if (!allowed) {
    return null;
  }

  const error = baseline.error ?? states.error ?? districts.error;
  return (
    <WorkspaceLayout wide>
      <div
        style={{ width: '100%', maxWidth: 1240, margin: '0 auto', paddingBottom: spacing['4xl'] }}
      >
        {error ? (
          <ErrorState
            title="Could not load current law"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => Promise.all([baseline.refetch(), states.refetch(), districts.refetch()])}
          />
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
            onModel={(region, program) => {
              draftForRegion(countryId, region);
              nav.push(buildHref(countryId, program));
            }}
          />
        ) : (
          <SkeletonRegion
            label="Loading current law"
            style={{ display: 'grid', gap: spacing.lg, paddingTop: spacing.xl }}
          >
            <SkeletonLine width="40%" height={28} />
            <SkeletonLine width="70%" />
            <SkeletonLine height={420} />
          </SkeletonRegion>
        )}
      </div>
    </WorkspaceLayout>
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
  onModel: (region: string, program?: string) => void;
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
  const { receipt } = file;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, paddingTop: spacing.lg }}
    >
      <header>
        <nav
          aria-label="Place"
          style={{
            display: 'flex',
            gap: spacing.xs,
            minHeight: 20,
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {level !== 'nation' && (
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
        </nav>
        <Title order={1} style={{ letterSpacing: '-0.02em', margin: `${spacing.xs} 0` }}>
          {level === 'nation'
            ? 'Current law across the United States'
            : `Current law in ${placeName}`}
        </Title>
        <p style={{ margin: 0, color: colors.text.secondary }}>
          Before you change a policy, see where things stand. Pick a place, then model a change
          there.
        </p>
        {file.placeholder && (
          <p
            role="note"
            style={{
              margin: `${spacing.md} 0 0`,
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: spacing.radius.element,
              background: colors.background.tertiary,
              color: colors.text.warning,
              fontSize: typography.fontSize.sm,
            }}
          >
            Preview: the model figures on this page are placeholders, not model output. The Census
            figures are real.
          </p>
        )}
      </header>

      <MetricPills metrics={MAP_METRICS} value={metric.key} onChange={setMetric} />

      <div className="tw:grid tw:items-start tw:gap-6 tw:lg:grid-cols-[minmax(0,1fr)_340px]">
        <div style={{ minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
            <ExploreMap
              file={file}
              states={stateShapes}
              districts={districtShapes}
              metric={metric}
              region={region}
              onSelect={select}
              showDistricts={showDistricts}
              scale={scale}
            />
            <div
              style={{
                position: 'absolute',
                top: spacing.md,
                left: spacing.md,
                display: 'flex',
                gap: spacing.xs,
              }}
            >
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
          </div>
          <p
            style={{
              margin: `${spacing.sm} 0 0`,
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
            }}
          >
            Current law, {file.year} · {receipt.model} (bundle {receipt.bundle}) · Microcosm US 2024
            data
            {receipt.computed_at ? ` · computed ${receipt.computed_at}` : ''}
          </p>
          <div className="tw:max-lg:hidden">
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
        </div>
        <div className="tw:lg:sticky tw:lg:top-4">
          <PlaceCard
            file={file}
            region={region}
            metric={metric}
            onMetricChange={setMetric}
            onModel={(program) => onModel(region, program)}
          />
        </div>
        <div className="tw:lg:hidden">
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
      </div>
    </div>
  );
}
