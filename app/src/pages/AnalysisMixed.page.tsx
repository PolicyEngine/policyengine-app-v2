/**
 * Analysis Mixed Page
 *
 * Demo page showing all tools and articles mixed in a single grid.
 * Nearly identical to Research.page.tsx but includes ALL apps (not just displayWithResearch).
 * Adds a "Type" filter to filter between tools and articles.
 */

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Text } from '@mantine/core';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { ResearchFilters } from '@/components/blog/ResearchFilters';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { apps } from '@/data/apps/appTransformers';
import { posts } from '@/data/posts/postTransformers';
import { colors, spacing } from '@/designTokens';
import type { ResearchItem } from '@/types/blog';

// Mock authors for now - in production, import from authors.json
const mockAuthors = [
  { key: 'max-ghenis', name: 'Max Ghenis' },
  { key: 'nikhil-woodruff', name: 'Nikhil Woodruff' },
  { key: 'pavel-makarchuk', name: 'Pavel Makarchuk' },
  { key: 'vahid-ahmadi', name: 'Vahid Ahmadi' },
  { key: 'ben-ogorek', name: 'Ben Ogorek' },
  { key: 'ziming-hua', name: 'Ziming Hua' },
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

/**
 * Get ALL items (posts + ALL apps) mixed together, sorted by date
 */
function getAllMixedItems(): ResearchItem[] {
  // Convert posts to ResearchItem format
  const postItems: ResearchItem[] = posts.map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    authors: post.authors,
    tags: post.tags,
    image: post.image,
    slug: post.slug,
    isApp: false,
    countryId: post.tags.find((tag) => ['us', 'uk', 'ca', 'ng'].includes(tag)) || 'us',
  }));

  // Get ALL apps (not just displayWithResearch) and convert to ResearchItem format
  const appItems: ResearchItem[] = apps.map((app) => ({
    title: app.title,
    description: app.description,
    date: app.date || '1970-01-01', // fallback for sorting
    authors: app.authors || [],
    tags: app.tags,
    image: app.image || '',
    slug: app.slug,
    isApp: true,
    countryId: app.countryId,
  }));

  // Combine and sort by date (newest first)
  return [...postItems, ...appItems].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function AnalysisMixedPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const displayCategory = useDisplayCategory();

  // Get all items (posts + ALL apps)
  const allItems = useMemo(() => getAllMixedItems(), []);

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

    // Filter by type (article = post, interactive = app/tool)
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

  // Handle search submit (just triggers the useEffect via state change)
  const handleSearchSubmit = () => {
    // URL params are already synced via useEffect
    // This function exists for the search button/enter key
  };

  return (
    <StaticPageLayout title="Analysis: Tools mixed with articles">
      <HeroSection
        title="Tools mixed with articles"
        description="All tools and articles displayed in a unified grid, sorted by date. Use the 'Type' filter to show only tools or only articles."
      />

      {/* Content */}
      <Container size="xl" py="xl">
        <Box
          style={{
            display: 'flex',
            flexDirection: displayCategory === 'desktop' ? 'row' : 'column',
            gap: spacing.xl,
          }}
        >
          {/* Sidebar Filters */}
          <Box
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
          </Box>

          {/* Results */}
          <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Text size="sm" c="dimmed" mb="md">
              {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
            </Text>

            {filteredItems.length > 0 ? (
              <BlogPostGrid items={filteredItems} countryId={countryId} />
            ) : (
              <Box
                style={{
                  textAlign: 'center',
                  padding: spacing['3xl'],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.md,
                }}
              >
                <Text c="dimmed">No results found. Try adjusting your filters.</Text>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </StaticPageLayout>
  );
}
