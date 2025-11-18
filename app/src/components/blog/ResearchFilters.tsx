/**
 * ResearchFilters Component
 *
 * Sidebar filters for the Research page.
 * Includes search, topics, locations, and authors.
 * Filter menu extends to bottom of viewport with scroll in expanded section.
 */

import { useState, useRef, useEffect } from 'react';
import { Box, TextInput, Button, Checkbox, Text, Group, Stack } from '@mantine/core';
import { topicLabels, locationLabels, topicTags, locationTags } from '@/data/posts/postTransformers';

interface ResearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  selectedLocations: string[];
  onLocationsChange: (locations: string[]) => void;
  selectedAuthors: string[];
  onAuthorsChange: (authors: string[]) => void;
  availableAuthors: { key: string; name: string }[];
}

type ExpandedSection = 'topics' | 'locations' | 'authors' | null;

export function ResearchFilters({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedTopics,
  onTopicsChange,
  selectedLocations,
  onLocationsChange,
  selectedAuthors,
  onAuthorsChange,
  availableAuthors,
}: ResearchFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(400);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Calculate available height for the tag container
  useEffect(() => {
    const calculateHeight = () => {
      if (filterContainerRef.current) {
        const rect = filterContainerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topOffset = rect.top;
        const padding = 20; // Bottom padding
        const newHeight = viewportHeight - topOffset - padding;
        setAvailableHeight(Math.max(newHeight, 100)); // Minimum 100px
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    window.addEventListener('scroll', calculateHeight);

    return () => {
      window.removeEventListener('resize', calculateHeight);
      window.removeEventListener('scroll', calculateHeight);
    };
  }, []);

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleTopicToggle = (tag: string) => {
    if (selectedTopics.includes(tag)) {
      onTopicsChange(selectedTopics.filter((t) => t !== tag));
    } else {
      onTopicsChange([...selectedTopics, tag]);
    }
  };

  const handleLocationToggle = (tag: string) => {
    if (selectedLocations.includes(tag)) {
      onLocationsChange(selectedLocations.filter((t) => t !== tag));
    } else {
      onLocationsChange([...selectedLocations, tag]);
    }
  };

  const handleAuthorToggle = (key: string) => {
    if (selectedAuthors.includes(key)) {
      onAuthorsChange(selectedAuthors.filter((a) => a !== key));
    } else {
      onAuthorsChange([...selectedAuthors, key]);
    }
  };

  // Render the tags for a section
  const renderTopicTags = () => (
    <Stack gap={4}>
      {topicTags.map((tag) => (
        <Checkbox
          key={tag}
          label={topicLabels[tag] || tag}
          checked={selectedTopics.includes(tag)}
          onChange={() => handleTopicToggle(tag)}
          size="sm"
        />
      ))}
    </Stack>
  );

  const renderLocationTags = () => (
    <Stack gap={4}>
      {/* Show countries first, then states */}
      {locationTags
        .filter((tag) => !tag.includes('-'))
        .map((tag) => (
          <Checkbox
            key={tag}
            label={locationLabels[tag] || tag}
            checked={selectedLocations.includes(tag)}
            onChange={() => handleLocationToggle(tag)}
            size="sm"
          />
        ))}
      {/* States */}
      {locationTags
        .filter((tag) => tag.includes('-'))
        .map((tag) => (
          <Checkbox
            key={tag}
            label={locationLabels[tag] || tag}
            checked={selectedLocations.includes(tag)}
            onChange={() => handleLocationToggle(tag)}
            size="sm"
            ml="md"
          />
        ))}
    </Stack>
  );

  const renderAuthorTags = () => (
    <Stack gap={4}>
      {availableAuthors.map((author) => (
        <Checkbox
          key={author.key}
          label={author.name}
          checked={selectedAuthors.includes(author.key)}
          onChange={() => handleAuthorToggle(author.key)}
          size="sm"
        />
      ))}
    </Stack>
  );

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search - fixed at top */}
      <Box mb="lg" style={{ flexShrink: 0 }}>
        <TextInput
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearchSubmit();
            }
          }}
          mb="xs"
        />
        <Button fullWidth variant="outline" onClick={onSearchSubmit}>
          Search
        </Button>
      </Box>

      {/* Filter sections container - extends to bottom of viewport */}
      <Box
        ref={filterContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Important for flex child scrolling
          maxHeight: availableHeight,
          overflow: 'hidden',
        }}
      >
        {/* Topics Header */}
        <Group
          justify="space-between"
          onClick={() => toggleSection('topics')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          py="xs"
        >
          <Text fw={600} size="sm">
            Topic
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'topics' ? '−' : '+'}
          </Text>
        </Group>

        {/* Topics Content */}
        {expandedSection === 'topics' && (
          <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}>
            {renderTopicTags()}
          </Box>
        )}

        {/* Locations Header */}
        <Group
          justify="space-between"
          onClick={() => toggleSection('locations')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          py="xs"
        >
          <Text fw={600} size="sm">
            Location
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'locations' ? '−' : '+'}
          </Text>
        </Group>

        {/* Locations Content */}
        {expandedSection === 'locations' && (
          <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}>
            {renderLocationTags()}
          </Box>
        )}

        {/* Authors Header */}
        <Group
          justify="space-between"
          onClick={() => toggleSection('authors')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          py="xs"
        >
          <Text fw={600} size="sm">
            Author
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'authors' ? '−' : '+'}
          </Text>
        </Group>

        {/* Authors Content */}
        {expandedSection === 'authors' && (
          <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 8 }}>
            {renderAuthorTags()}
          </Box>
        )}
      </Box>
    </Box>
  );
}
