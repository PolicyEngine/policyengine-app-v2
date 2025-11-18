/**
 * Research Page
 *
 * Main research/blog listing page with filtering and search.
 * Displays both blog posts and apps with displayWithResearch: true.
 */

import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Text } from '@mantine/core';
import Fuse from 'fuse.js';
import { colors, spacing } from '@/designTokens';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import { BlogPostGrid } from '@/components/blog/BlogPostGrid';
import { ResearchFilters } from '@/components/blog/ResearchFilters';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import {
  getResearchItems,
} from '@/data/posts/postTransformers';

// Mock authors for now - in production, import from authors.json
const mockAuthors = [
  { key: 'max-ghenis', name: 'Max Ghenis' },
  { key: 'nikhil-woodruff', name: 'Nikhil Woodruff' },
  { key: 'pavel-makarchuk', name: 'Pavel Makarchuk' },
  { key: 'vahid-ahmadi', name: 'Vahid Ahmadi' },
  { key: 'ben-ogorek', name: 'Ben Ogorek' },
];

export default function ResearchPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const displayCategory = useDisplayCategory();

  // Get all research items
  const allItems = useMemo(() => getResearchItems(), []);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => {
    const topics = searchParams.get('topics');
    return topics ? topics.split(',') : [];
  });
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    const locations = searchParams.get('locations');
    return locations ? locations.split(',') : [countryId, 'global'];
  });
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(() => {
    const authors = searchParams.get('authors');
    return authors ? authors.split(',') : [];
  });

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by topics
    if (selectedTopics.length > 0) {
      items = items.filter((item) =>
        selectedTopics.some((topic) => item.tags.includes(topic))
      );
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
  }, [allItems, selectedTopics, selectedLocations, selectedAuthors, searchQuery]);

  // Update URL params
  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedTopics.length) params.set('topics', selectedTopics.join(','));
    if (selectedLocations.length) params.set('locations', selectedLocations.join(','));
    if (selectedAuthors.length) params.set('authors', selectedAuthors.join(','));
    setSearchParams(params);
  };

  return (
    <StaticPageLayout title="Research">
      <HeroSection
        title="Research and analysis"
        description="Explore our research on tax and benefit policy, including technical reports, policy analyses, and interactive tools."
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
            }}
          >
            <ResearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              selectedTopics={selectedTopics}
              onTopicsChange={setSelectedTopics}
              selectedLocations={selectedLocations}
              onLocationsChange={setSelectedLocations}
              selectedAuthors={selectedAuthors}
              onAuthorsChange={setSelectedAuthors}
              availableAuthors={mockAuthors}
            />
          </Box>

          {/* Results */}
          <Box style={{ flex: 1 }}>
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
