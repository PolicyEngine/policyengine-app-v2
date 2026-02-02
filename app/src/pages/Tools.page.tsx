/**
 * Tools & Interactives Page
 *
 * Landing page displaying all interactive tools from apps.json.
 * Filters by current country. Features prominent tools at top.
 * Follows Research.page.tsx layout pattern.
 */

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Text } from '@mantine/core';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { FeaturedToolCard } from '@/components/tools/FeaturedToolCard';
import { ToolsFilters } from '@/components/tools/ToolsFilters';
import { ToolsGrid } from '@/components/tools/ToolsGrid';

import '@/components/tools/visuals'; // Register CSS visuals

import { apps } from '@/data/apps/appTransformers';
import { colors, spacing } from '@/designTokens';

/** Tags that represent countries/locations rather than topics */
const COUNTRY_TAGS = new Set(['us', 'uk', 'ca', 'ng', 'global']);

/** Tags to exclude from the filter sidebar */
const EXCLUDED_TAGS = new Set<string>([]);

/** Human-readable labels for topic tags */
const TAG_LABELS: Record<string, string> = {
  policy: 'Policy',
  healthcare: 'Healthcare',
  reconciliation: 'Reconciliation',
  interactives: 'Interactives',
  tracker: 'Tracker',
  scotland: 'Scotland',
};

function parseArrayParam(value: string | null): string[] {
  return value ? value.split(',') : [];
}

export default function ToolsPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const displayCategory = useDisplayCategory();

  // All apps for current country
  const countryApps = useMemo(() => apps.filter((app) => app.countryId === countryId), [countryId]);

  // Featured app (newest by date if multiple are marked featured)
  const featuredApp = useMemo(() => {
    const candidates = countryApps.filter((app) => app.isFeatured === true);
    if (candidates.length === 0) {
      return null;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }
    return candidates.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })[0];
  }, [countryApps]);

  // Non-featured apps for the grid (exclude the featured one)
  const gridApps = useMemo(
    () => (featuredApp ? countryApps.filter((app) => app.slug !== featuredApp.slug) : countryApps),
    [countryApps, featuredApp]
  );

  // Derive available topic tags from the apps for this country
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const app of countryApps) {
      for (const tag of app.tags) {
        if (!COUNTRY_TAGS.has(tag) && !EXCLUDED_TAGS.has(tag)) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }
    return Array.from(tagCounts.entries())
      .map(([value, count]) => ({
        value,
        label: TAG_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [countryApps]);

  // Filter state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    parseArrayParam(searchParams.get('tags'))
  );

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (selectedTags.length) {
      params.set('tags', selectedTags.join(','));
    }
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedTags, setSearchParams]);

  // Filter apps
  const filteredApps = useMemo(() => {
    let items = gridApps;

    // Filter by tags
    if (selectedTags.length > 0) {
      items = items.filter((app) => selectedTags.some((tag) => app.tags.includes(tag)));
    }

    // Fuzzy search
    if (searchQuery.trim()) {
      const fuse = new Fuse(items, {
        keys: ['title', 'description'],
        threshold: 0.3,
      });
      items = fuse.search(searchQuery).map((result) => result.item);
    }

    return items;
  }, [gridApps, selectedTags, searchQuery]);

  const handleSearchSubmit = () => {
    // URL params already synced via useEffect
  };

  return (
    <StaticPageLayout title="Tools & interactives">
      <HeroSection
        title="Tools & interactives"
        description="Free, open-source calculators, dashboards, and interactive visualizations. Explore the impact of tax and benefit policy on households and communities."
      />

      <Container size="xl" py="xl">
        {/* Featured tool */}
        {featuredApp && <FeaturedToolCard app={featuredApp} />}

        {/* Sidebar + grid layout */}
        <Box
          style={{
            display: 'flex',
            flexDirection: displayCategory === 'desktop' ? 'row' : 'column',
            gap: spacing.xl,
          }}
        >
          {/* Sidebar */}
          <Box
            style={{
              flex: displayCategory === 'desktop' ? '0 0 250px' : '1',
              position: displayCategory === 'desktop' ? 'sticky' : 'static',
              top: displayCategory === 'desktop' ? '100px' : 'auto',
              alignSelf: 'flex-start',
              height: displayCategory === 'desktop' ? 'calc(100vh - 120px)' : 'auto',
            }}
          >
            <ToolsFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              availableTags={availableTags}
            />
          </Box>

          {/* Results */}
          <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Text size="sm" c="dimmed" mb="md">
              {filteredApps.length} {filteredApps.length === 1 ? 'tool' : 'tools'}
            </Text>

            {filteredApps.length > 0 ? (
              <ToolsGrid apps={filteredApps} />
            ) : (
              <Box
                style={{
                  textAlign: 'center',
                  padding: spacing['3xl'],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.md,
                }}
              >
                <Text c="dimmed">No tools found. Try adjusting your filters.</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </StaticPageLayout>
  );
}
