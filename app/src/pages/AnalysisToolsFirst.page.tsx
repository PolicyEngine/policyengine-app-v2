/**
 * Analysis Tools First Page
 *
 * Demo page showing tools in a dedicated section at the top,
 * followed by articles in a separate section below.
 * Filters apply to both sections.
 */

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Group, Text, UnstyledButton } from '@mantine/core';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { ResearchFilters } from '@/components/blog/ResearchFilters';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { ToolsGrid } from '@/components/tools/ToolsGrid';
import { apps } from '@/data/apps/appTransformers';
import { posts } from '@/data/posts/postTransformers';
import { colors, spacing, typography } from '@/designTokens';
import type { App } from '@/types/apps';
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

export default function AnalysisToolsFirstPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const displayCategory = useDisplayCategory();

  // Get all apps (location filtering applied later, same as articles)
  const allApps = useMemo(() => apps, []);

  // Get all posts as ResearchItem
  const allPosts = useMemo(
    () =>
      posts.map((post) => ({
        title: post.title,
        description: post.description,
        date: post.date,
        authors: post.authors,
        tags: post.tags,
        image: post.image,
        slug: post.slug,
        isApp: false,
        countryId: post.tags.find((tag) => ['us', 'uk', 'ca', 'ng'].includes(tag)) || 'us',
      })) as ResearchItem[],
    []
  );

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

  // Filter tools (same filtering logic as articles)
  const filteredTools = useMemo(() => {
    // If type filter is set and doesn't include 'interactive', hide all tools
    if (selectedTypes.length > 0 && !selectedTypes.includes('interactive')) {
      return [];
    }

    let items: App[] = allApps;

    // Filter by topics
    if (selectedTopics.length > 0) {
      items = items.filter((app) => selectedTopics.some((topic) => app.tags.includes(topic)));
    }

    // Filter by locations (check countryId or tags for location match)
    if (selectedLocations.length > 0) {
      items = items.filter(
        (app) =>
          selectedLocations.includes(app.countryId) ||
          selectedLocations.some((location) => app.tags.includes(location))
      );
    }

    // Filter by authors
    if (selectedAuthors.length > 0) {
      items = items.filter((app) =>
        selectedAuthors.some((author) => app.authors?.includes(author))
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
  }, [allApps, selectedTypes, selectedTopics, selectedLocations, selectedAuthors, searchQuery]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    // If type filter is set and doesn't include 'article', hide all articles
    if (selectedTypes.length > 0 && !selectedTypes.includes('article')) {
      return [];
    }

    let items = allPosts;

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
  }, [allPosts, selectedTypes, selectedTopics, selectedLocations, selectedAuthors, searchQuery]);

  // Handle search submit
  const handleSearchSubmit = () => {
    // URL params are already synced via useEffect
  };

  // Section collapse state
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [articlesExpanded, setArticlesExpanded] = useState(true);

  const totalResults = filteredTools.length + filteredArticles.length;

  return (
    <StaticPageLayout title="Analysis: Tools first">
      <HeroSection
        title="Tools first"
        description="Tools displayed in a dedicated section at the top, followed by articles below. Both sections respect the same filters."
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
              {totalResults} {totalResults === 1 ? 'result' : 'results'} ({filteredTools.length}{' '}
              {filteredTools.length === 1 ? 'tool' : 'tools'}, {filteredArticles.length}{' '}
              {filteredArticles.length === 1 ? 'article' : 'articles'})
            </Text>

            {/* Tools Section */}
            {filteredTools.length > 0 && (
              <Box mb={spacing['3xl']}>
                <UnstyledButton
                  onClick={() => setToolsExpanded(!toolsExpanded)}
                  style={{ width: '100%' }}
                >
                  <Group
                    justify="space-between"
                    style={{
                      marginBottom: toolsExpanded ? spacing.lg : 0,
                      paddingBottom: spacing.sm,
                      borderBottom: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <Text
                      fw={typography.fontWeight.bold}
                      style={{
                        fontSize: typography.fontSize['2xl'],
                        color: colors.primary[800],
                        fontFamily: typography.fontFamily.primary,
                      }}
                    >
                      Tools
                    </Text>
                    <Text
                      style={{
                        fontSize: typography.fontSize.xl,
                        color: colors.gray[500],
                        fontFamily: typography.fontFamily.primary,
                      }}
                    >
                      {toolsExpanded ? '−' : '+'}
                    </Text>
                  </Group>
                </UnstyledButton>
                {toolsExpanded && <ToolsGrid apps={filteredTools} />}
              </Box>
            )}

            {/* Articles Section */}
            {filteredArticles.length > 0 && (
              <Box>
                <UnstyledButton
                  onClick={() => setArticlesExpanded(!articlesExpanded)}
                  style={{ width: '100%' }}
                >
                  <Group
                    justify="space-between"
                    style={{
                      marginBottom: articlesExpanded ? spacing.lg : 0,
                      paddingBottom: spacing.sm,
                      borderBottom: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <Text
                      fw={typography.fontWeight.bold}
                      style={{
                        fontSize: typography.fontSize['2xl'],
                        color: colors.primary[800],
                        fontFamily: typography.fontFamily.primary,
                      }}
                    >
                      Articles
                    </Text>
                    <Text
                      style={{
                        fontSize: typography.fontSize.xl,
                        color: colors.gray[500],
                        fontFamily: typography.fontFamily.primary,
                      }}
                    >
                      {articlesExpanded ? '−' : '+'}
                    </Text>
                  </Group>
                </UnstyledButton>
                {articlesExpanded && (
                  <BlogPostGrid items={filteredArticles} countryId={countryId} />
                )}
              </Box>
            )}

            {/* No results */}
            {totalResults === 0 && (
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
