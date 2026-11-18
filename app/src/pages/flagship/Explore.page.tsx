import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import MeasureSentence from '@/components/flagship/explore/MeasureSentence';
import PlaceMargin from '@/components/flagship/explore/PlaceMargin';
import type { ReliefPin } from '@/components/flagship/explore/ReliefModel';
import Skyline, { type SkylineRow } from '@/components/flagship/explore/Skyline';
import { ErrorState, SkeletonLine, SkeletonRegion } from '@/components/flagship/states';
import { Title } from '@/components/ui';
import { useAppLocation } from '@/contexts/LocationContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useExploreData, type MapShape } from '@/hooks/useExploreData';
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
  statesCombined,
  type BaselineFile,
  type BaselineMetricKey,
} from '@/libs/flagship/explore/baselineData';
import { draftForRegion } from '@/libs/flagship/explore/buildHandoff';
import { exploreMetric, isShownAt } from '@/libs/flagship/explore/exploreMetrics';
import { buildHref, exploreHref, readExploreView } from '@/libs/flagship/explore/exploreUrl';
import type { ReformLever } from '@/libs/flagship/explore/reformLevers';
import { reliefScale } from '@/libs/flagship/explore/reliefScale';

// The model brings three.js with it, so it loads apart from the page.
const ReliefModel = lazy(() => import('@/components/flagship/explore/ReliefModel'));

const linkButton = {
  border: 0,
  background: 'none',
  padding: 0,
  color: colors.text.link,
  fontSize: typography.fontSize.sm,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
} as const;

/** Wide enough for the margin column to stand beside the model. */
// The theme's `lg` breakpoint (75rem), so script and the `tw:lg:` classes agree.
const WIDE_QUERY = '(min-width: 75rem)';
const MARGIN_WIDTH = 348;

/** The region the page shows for a link: a district link shows its state. */
function shownRegion(file: BaselineFile, region: string): string {
  const code = stateCodeOf(region);
  const state = code ? stateRegion(code) : NATION_REGION;
  return file.regions[state] ? state : NATION_REGION;
}

/**
 * Explore: current law before any reform. A relief model of the United
 * States, where each state stands as tall as one measure (poverty,
 * income, inequality, taxes, benefits), with the place's figures and
 * the rules that change them, each a way into Build. The figures come
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

  const { baseline, states } = useExploreData(countryId, EXPLORE_YEAR);
  // Build's search file and variables load meanwhile, so Build opens ready.
  useV3SearchFileInBackground();
  useV3VariablesInBackground();

  if (!allowed) {
    return null;
  }

  const error = baseline.error ?? states.error;
  return (
    <div className="tw:lg:h-full">
      {error ? (
        <div style={{ padding: spacing['2xl'] }}>
          <ErrorState
            title="Could not load current law"
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => Promise.all([baseline.refetch(), states.refetch()])}
          />
        </div>
      ) : baseline.data && states.data ? (
        <ExploreView
          file={baseline.data}
          stateShapes={states.data}
          metricKey={view.metric.key}
          region={shownRegion(baseline.data, view.region)}
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
          onModel={(region, lever) => {
            draftForRegion(countryId, region);
            nav.push(buildHref(countryId, lever?.search));
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
  stateShapes: MapShape[];
  metricKey: BaselineMetricKey;
  /** "us" or "state/oh". */
  region: string;
  /** A metric change replaces the history entry; a place change adds one, so Back goes back out. */
  onNavigate: (next: { metric: BaselineMetricKey; region: string }, replace?: boolean) => void;
  /** Opens Build for the place, at a rule when one is given. */
  onModel: (region: string, lever?: ReformLever) => void;
}

function ExploreView({
  file,
  stateShapes,
  metricKey,
  region,
  onNavigate,
  onModel,
}: ExploreViewProps) {
  const metric = exploreMetric(metricKey);
  const wide = useMediaQuery(WIDE_QUERY);
  const [hot, setHot] = useState<string | null>(null);
  // A measure without state values shows the nation only.
  const statesShown = isShownAt(metric, 'state');
  const place = statesShown ? region : NATION_REGION;
  const level = regionLevel(place) === 'state' ? 'state' : 'nation';
  const selected = stateCodeOf(place);

  // Every state's value, highest first, and the scale they share.
  const { ranked, scale } = useMemo(() => {
    const rows = statesShown
      ? regionsAt(file, 'state')
          .map((name) => ({
            region: name,
            name: file.regions[name].label,
            value: file.regions[name].metrics[metric.key],
          }))
          .filter((row): row is { region: string; name: string; value: number } => {
            return row.value !== undefined;
          })
          .sort((a, b) => b.value - a.value)
      : [];
    return { ranked: rows, scale: reliefScale(rows.map((row) => row.value)) };
  }, [file, metric.key, statesShown]);

  const positions = useMemo(
    () =>
      Object.fromEntries(
        ranked.map((row) => [stateCodeOf(row.region) as string, scale.position(row.value)])
      ),
    [ranked, scale]
  );
  const skyline: SkylineRow[] = useMemo(
    () =>
      ranked.map((row) => ({
        code: stateCodeOf(row.region) as string,
        name: row.name,
        value: metric.format(row.value),
        position: scale.position(row.value),
      })),
    [ranked, scale, metric]
  );

  // The states come from another dataset than the nation, so the figure
  // a state stands beside is the states combined, where they combine.
  const combined =
    statesShown && metric.combine ? statesCombined(file, metric.key, metric.combine) : undefined;
  const national = file.regions[NATION_REGION]?.metrics[metric.key];
  const comparison =
    combined !== undefined
      ? { value: combined, label: 'All states' }
      : national !== undefined
        ? { value: national, label: 'United States' }
        : undefined;
  const value = level === 'state' ? file.regions[place]?.metrics[metric.key] : comparison?.value;
  const shown = isShownAt(metric, level) && value !== undefined;

  const select = (next: string) => onNavigate({ metric: metric.key, region: next });
  const setMetric = (key: BaselineMetricKey) => onNavigate({ metric: key, region }, true);
  const selectState = (code: string | null) => {
    if (!statesShown) {
      return;
    }
    select(code && code !== selected ? stateRegion(code) : NATION_REGION);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && level !== 'nation') {
        select(NATION_REGION);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // The labels on the model: the chosen state, or the three highest, and the one under the pointer.
  const pins: ReliefPin[] = useMemo(() => {
    // A phone has no room for three labels: it shows the chosen state's only.
    const codes = selected ? [selected] : wide ? skyline.slice(0, 3).map((row) => row.code) : [];
    return [...new Set([...codes, ...(hot ? [hot] : [])])]
      .map((code) => skyline.find((row) => row.code === code))
      .filter((row): row is SkylineRow => !!row)
      .map((row) => ({ code: row.code, name: row.name, value: row.value }));
  }, [selected, hot, skyline, wide]);

  const placeName = file.regions[place]?.label ?? place;
  const statement = (
    <header style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <nav
        aria-label="Place"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.xs,
          minHeight: 22,
          fontSize: typography.fontSize.sm,
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
            <span aria-hidden>/</span>
            <span aria-current="page">{placeName}</span>
          </>
        )}
        {file.placeholder && (
          <span
            role="note"
            style={{
              marginLeft: spacing.sm,
              padding: '0 6px',
              borderRadius: 999,
              border: `1px solid ${colors.warning}`,
              color: colors.text.warning,
              fontSize: typography.fontSize.xs,
              whiteSpace: 'nowrap',
            }}
          >
            Placeholder figures
            <span className="tw:sr-only">
              : the model figures are placeholders, not model output. The Census figures are real.
            </span>
          </span>
        )}
      </nav>
      <Title
        order={1}
        style={{
          margin: `0 0 ${spacing.xs}`,
          fontSize: 'clamp(34px, 4.2vw, 58px)',
          lineHeight: 1,
          letterSpacing: '-0.035em',
        }}
      >
        {level === 'nation' ? 'United States' : placeName}
      </Title>
      <MeasureSentence
        metric={metric}
        value={shown ? metric.format(value) : undefined}
        onChange={setMetric}
      />
      <p
        style={{
          margin: `${spacing.xs} 0 0`,
          maxWidth: '60ch',
          fontSize: typography.fontSize.xs,
          lineHeight: 1.5,
          color: colors.text.secondary,
        }}
      >
        {level === 'nation' && combined !== undefined ? 'All states combined. ' : ''}
        PolicyEngine model, current law.
        {metric.caveat && (
          <span role="note" style={{ display: 'block', color: colors.text.warning }}>
            {metric.caveat}
          </span>
        )}
      </p>
    </header>
  );

  return (
    <div
      className="tw:flex tw:flex-col tw:lg:relative tw:lg:block tw:lg:h-full tw:lg:overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${colors.gray[50]} 0%, ${colors.gray[100]} 70%)`,
      }}
    >
      <div
        className="tw:p-lg tw:lg:absolute tw:lg:top-xl tw:lg:left-xl tw:lg:z-10 tw:lg:p-0"
        style={{ maxWidth: wide ? `min(640px, calc(100% - ${MARGIN_WIDTH + 80}px))` : undefined }}
      >
        {statement}
      </div>

      <div className="tw:relative tw:h-[42vh] tw:lg:absolute tw:lg:inset-0 tw:lg:h-auto">
        <Suspense fallback={null}>
          <ReliefModel
            shapes={stateShapes}
            positions={positions}
            flat={!statesShown}
            selected={selected}
            hot={hot}
            pins={pins}
            clearRight={wide ? MARGIN_WIDTH : 0}
            compact={!wide}
            onHover={setHot}
            onSelect={selectState}
          />
        </Suspense>
        {!statesShown && (
          <p
            role="note"
            style={{
              position: 'absolute',
              left: wide ? `calc((100% - ${MARGIN_WIDTH}px) / 2)` : '50%',
              top: '56%',
              transform: 'translate(-50%, -50%)',
              width: 'min(400px, 80%)',
              margin: 0,
              textAlign: 'center',
              fontSize: typography.fontSize.sm,
              lineHeight: 1.5,
              color: colors.text.secondary,
            }}
          >
            <strong style={{ display: 'block', color: colors.gray[900] }}>
              No state values for this measure yet
            </strong>
            {metric.hiddenReason}
          </p>
        )}
      </div>

      {statesShown && skyline.length > 0 && (
        <div
          className="tw:px-lg tw:lg:absolute tw:lg:bottom-lg tw:lg:left-xl tw:lg:z-10 tw:lg:px-0"
          style={{ right: wide ? MARGIN_WIDTH + 12 : undefined }}
        >
          <Skyline
            rows={skyline}
            caption={`Every state, from the highest (${skyline[0].value}) to the lowest (${skyline[skyline.length - 1].value})`}
            selected={selected}
            hot={hot}
            onHover={setHot}
            onSelect={selectState}
          />
        </div>
      )}

      <div
        className="tw:p-lg tw:lg:absolute tw:lg:top-0 tw:lg:right-0 tw:lg:bottom-0 tw:lg:z-10 tw:lg:overflow-y-auto tw:lg:p-xl"
        style={{
          width: wide ? MARGIN_WIDTH : undefined,
          background: wide
            ? `linear-gradient(90deg, transparent 0, ${colors.gray[50]}E6 26px)`
            : undefined,
        }}
      >
        <PlaceMargin
          file={file}
          region={place}
          level={level}
          metric={metric}
          value={shown ? value : undefined}
          comparison={comparison}
          ranked={ranked}
          scale={scale}
          onMetricChange={setMetric}
          onModel={(lever) => onModel(place, lever)}
        />
      </div>
    </div>
  );
}
