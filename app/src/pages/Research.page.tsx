/**
 * Research Page - Editorial Research Listing
 *
 * A sophisticated research/blog listing with editorial styling,
 * refined filters, and elegant card presentation.
 */

import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { useParams, useSearchParams } from 'react-router-dom';
import { IconSearch } from '@tabler/icons-react';
import { Box, Container, Text, TextInput } from '@mantine/core';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { ResearchFilters } from '@/components/blog/ResearchFilters';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { getResearchItems } from '@/data/posts/postTransformers';
import { colors, spacing, typography } from '@/designTokens';

const mockAuthors = [
  { key: 'max-ghenis', name: 'Max Ghenis' },
  { key: 'nikhil-woodruff', name: 'Nikhil Woodruff' },
  { key: 'pavel-makarchuk', name: 'Pavel Makarchuk' },
  { key: 'vahid-ahmadi', name: 'Vahid Ahmadi' },
  { key: 'ben-ogorek', name: 'Ben Ogorek' },
];

function parseArrayParam(value: string | null, defaultValue: string[] = []): string[] {
  return value ? value.split(',') : defaultValue;
}

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

  const allItems = useMemo(() => getResearchItems(), []);
  const defaultLocations = useMemo(() => [countryId, 'global'], [countryId]);

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

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (selectedTypes.length > 0) {
      items = items.filter((item) => {
        const itemType = item.isApp ? 'interactive' : 'article';
        return selectedTypes.includes(itemType);
      });
    }

    if (selectedTopics.length > 0) {
      items = items.filter((item) => selectedTopics.some((topic) => item.tags.includes(topic)));
    }

    if (selectedLocations.length > 0) {
      items = items.filter((item) =>
        selectedLocations.some((location) => item.tags.includes(location))
      );
    }

    if (selectedAuthors.length > 0) {
      items = items.filter((item) =>
        selectedAuthors.some((author) => item.authors.includes(author))
      );
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(items, {
        keys: ['title', 'description'],
        threshold: 0.3,
      });
      items = fuse.search(searchQuery).map((result) => result.item);
    }

    return items;
  }, [allItems, selectedTypes, selectedTopics, selectedLocations, selectedAuthors, searchQuery]);

  const handleSearchSubmit = () => {
    // URL params are already synced via useEffect
  };

  return (
    <StaticPageLayout title="Research">
      {/* Hero Section */}
      <Box
        style={{
          backgroundColor: colors.background.editorial,
          borderBottom: `1px solid ${colors.border.light}`,
          paddingTop: spacing['5xl'],
          paddingBottom: spacing['4xl'],
        }}
      >
        <Container size="xl">
          <Box style={{ maxWidth: '700px' }}>
            {/* Label */}
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                letterSpacing: typography.letterSpacing.widest,
                textTransform: 'uppercase',
                color: colors.primary[600],
                marginBottom: spacing.lg,
              }}
            >
              Research & Analysis
            </Text>

            {/* Title */}
            <h1
              style={{
                fontFamily: typography.fontFamily.display,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 500,
                lineHeight: 1.2,
                color: colors.text.primary,
                margin: 0,
                marginBottom: spacing.lg,
              }}
            >
              Policy insights that drive change
            </h1>

            {/* Description */}
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.lg,
                lineHeight: 1.6,
                color: colors.text.secondary,
                marginBottom: spacing['2xl'],
              }}
            >
              Explore our research on tax and benefit policy, including technical
              reports, policy analyses, and interactive tools.
            </Text>

            {/* Search Input */}
            <TextInput
              placeholder="Search research..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit();
                }
              }}
              leftSection={<IconSearch size={18} color={colors.text.tertiary} />}
              styles={{
                root: {
                  maxWidth: '400px',
                },
                input: {
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.base,
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border.medium}`,
                  borderRadius: spacing.radius.lg,
                  padding: `${spacing.md} ${spacing.lg}`,
                  paddingLeft: spacing['3xl'],
                  height: 'auto',
                  transition: 'all 200ms ease',
                  '&:focus': {
                    borderColor: colors.primary[400],
                    boxShadow: `0 0 0 3px ${colors.primary[100]}`,
                  },
                },
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Container size="xl" style={{ paddingTop: spacing['3xl'], paddingBottom: spacing['5xl'] }}>
        <Box
          style={{
            display: 'flex',
            flexDirection: displayCategory === 'desktop' ? 'row' : 'column',
            gap: spacing['3xl'],
          }}
        >
          {/* Sidebar Filters */}
          <Box
            style={{
              flex: displayCategory === 'desktop' ? '0 0 260px' : '1',
              position: displayCategory === 'desktop' ? 'sticky' : 'static',
              top: displayCategory === 'desktop' ? '100px' : 'auto',
              alignSelf: 'flex-start',
              height: displayCategory === 'desktop' ? 'calc(100vh - 140px)' : 'auto',
              overflowY: displayCategory === 'desktop' ? 'auto' : 'visible',
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
              hideSearch
            />
          </Box>

          {/* Results */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            {/* Results Count */}
            <Box
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing['2xl'],
                paddingBottom: spacing.lg,
                borderBottom: `1px solid ${colors.border.light}`,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                }}
              >
                {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
              </Text>
            </Box>

            {filteredItems.length > 0 ? (
              <BlogPostGrid items={filteredItems} countryId={countryId} />
            ) : (
              <Box
                style={{
                  textAlign: 'center',
                  padding: spacing['5xl'],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.xl,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.lg,
                    color: colors.text.secondary,
                    marginBottom: spacing.sm,
                  }}
                >
                  No results found
                </Text>
                <Text
                  style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  Try adjusting your filters or search terms.
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </StaticPageLayout>
  );
}
