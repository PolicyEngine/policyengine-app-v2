/**
 * Research Page
 *
 * Main research/blog listing page with filtering and search.
 * Displays both blog posts and apps with displayWithResearch: true.
 */

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useParams, useSearchParams } from 'react-router-dom';
import { Container, Spinner, Text } from '@/components/ui';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { ResearchFilters } from '@/components/blog/ResearchFilters';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { getResearchItems } from '@/data/posts/postTransformers';
import { colors, spacing } from '@/designTokens';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

// Mock authors for now - in production, import from authors.json
const mockAuthors = [
  { key: 'max-ghenis', name: 'Max Ghenis' },
  { key: 'nikhil-woodruff', name: 'Nikhil Woodruff' },
  { key: 'pavel-makarchuk', name: 'Pavel Makarchuk' },
  { key: 'vahid-ahmadi', name: 'Vahid Ahmadi' },
  { key: 'ben-ogorek', name: 'Ben Ogorek' },
];

// Helper to parse comma-separated URL param into array
function parseArrayParam(value: string | null, defaultValue: string[] = []): string[] {
  return value ? value.split(',') : defaultValue;
}

// Helper to build URL params from filter state
function buildFilterParams(
  filters: {
    search: string;
    types: string[];
    topics: string[];
    locations: string[];
    authors: string[];
  },
  defaultLocations: string[]
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.types.length) {
    params.set('types', filters.types.join(','));
  }
  if (filters.topics.length) {
    params.set('topics', filters.topics.join(','));
  }
  // Only set locations if different from default
  const sortedDefault = [...defaultLocations].sort().join(',');
  const sortedCurrent = [...filters.locations].sort().join(',');
  if (sortedCurrent !== sortedDefault) {
    params.set('locations', filters.locations.join(','));
  }
  if (filters.authors.length) {
    params.set('authors', filters.authors.join(','));
  }

  return params;
}

export default function ResearchPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const displayCategory = useDisplayCategory();

  // Get all research items
  const allItems = useMemo(() => getResearchItems(), []);

  // Default locations based on country
  const defaultLocations = useMemo(() => [countryId, 'global'], [countryId]);

  // Filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    parseArrayParam(searchParams.get('types'))
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() =>
    parseArrayParam(searchParams.get('topics'))
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() =>
    parseArrayParam(searchParams.get('locations'), defaultLocations)
  );
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(() =>
    parseArrayParam(searchParams.get('authors'))
  );

  // Sync URL params when filters change
  useEffect(() => {
    const params = buildFilterParams(
      {
        search: searchQuery,
        types: selectedTypes,
        topics: selectedTopics,
        locations: selectedLocations,
        authors: selectedAuthors,
      },
      defaultLocations
    );
    setSearchParams(params, { replace: true });
  }, [
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    searchQuery,
    defaultLocations,
    setSearchParams,
  ]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by type
    if (selectedTypes.length > 0) {
      items = items.filter((item) => {
        const itemType = item.isApp ? 'interactive' : 'article';
        return selectedTypes.includes(itemType);
      });
    }

    // Filter by topics
    if (selectedTopics.length > 0) {
      items = items.filter((item) => selectedTopics.some((topic) => item.tags.includes(topic)));
    }

    // Filter by locations
    if (selectedLocations.length > 0) {
      items = items.filter((item) =>
        selectedLocations.some((location) => item.tags.includes(location))
      );
    }

    // Filter by authors
    if (selectedAuthors.length > 0) {
      items = items.filter((item) =>
        selectedAuthors.some((author) => item.authors.includes(author))
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const fuse = new Fuse(items, {
        keys: ['title', 'description'],
        threshold: 0.3,
      });
      items = fuse.search(searchQuery).map((result) => result.item);
    }

    return items;
  }, [allItems, selectedTypes, selectedTopics, selectedLocations, selectedAuthors, searchQuery]);

  // Infinite scroll - show 8 items initially, load 8 more as user scrolls
  const { visibleCount, sentinelRef, hasMore, reset } = useInfiniteScroll({
    totalCount: filteredItems.length,
    initialCount: 8,
    incrementCount: 8,
  });

  // Reset infinite scroll when filters change
  useEffect(() => {
    reset();
  }, [selectedTypes, selectedTopics, selectedLocations, selectedAuthors, searchQuery, reset]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );

  // Handle search submit (just triggers the useEffect via state change)
  const handleSearchSubmit = () => {
    // URL params are already synced via useEffect
    // This function exists for the search button/enter key
  };

  return (
    <StaticPageLayout title="Research">
      <HeroSection
        title="Research and analysis"
        description="Explore our research on tax and benefit policy, including technical reports, policy analyses, and interactive tools."
      />

      {/* Content */}
      <Container size="xl" className="tw:py-xl">
        <div
          style={{
            display: 'flex',
            flexDirection: displayCategory === 'desktop' ? 'row' : 'column',
            gap: spacing.xl,
          }}
        >
          {/* Sidebar Filters */}
          <div
            style={{
              flex: displayCategory === 'desktop' ? '0 0 250px' : '1',
              position: displayCategory === 'desktop' ? 'sticky' : 'static',
              top: displayCategory === 'desktop' ? '100px' : 'auto',
              alignSelf: 'flex-start',
              height: displayCategory === 'desktop' ? 'calc(100vh - 120px)' : 'auto',
            }}
          >
            <ResearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              selectedTopics={selectedTopics}
              onTopicsChange={setSelectedTopics}
              selectedLocations={selectedLocations}
              onLocationsChange={setSelectedLocations}
              selectedAuthors={selectedAuthors}
              onAuthorsChange={setSelectedAuthors}
              availableAuthors={mockAuthors}
              countryId={countryId}
            />
          </div>

          {/* Results */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Text size="sm" className="tw:mb-md" style={{ color: colors.gray[500] }}>
              {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
            </Text>

            {filteredItems.length > 0 ? (
              <>
                <BlogPostGrid items={visibleItems} countryId={countryId} />

                {/* Sentinel element for infinite scroll */}
                {hasMore && (
                  <div
                    ref={sentinelRef}
                    className="tw:flex tw:justify-center"
                    style={{ padding: spacing.xl }}
                  >
                    <Spinner size="sm" />
                  </div>
                )}
              </>
            ) : (
              <div
                className="tw:text-center"
                style={{
                  padding: spacing['3xl'],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.container,
                }}
              >
                <Text style={{ color: colors.gray[500] }}>No results found. Try adjusting your filters.</Text>
              </div>
            )}
          </div>
        </div>
      </Container>
    </StaticPageLayout>
  );
}
