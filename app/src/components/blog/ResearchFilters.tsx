/**
 * ResearchFilters Component
 *
 * Sidebar filters for the Research page.
 * Includes search, topics, locations, and authors.
 */

import { useState } from 'react';
import { Box, TextInput, Button, Checkbox, Text, Collapse, Group, Stack } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
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

  return (
    <Box>
      {/* Search */}
      <Box mb="lg">
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
        <Button
          fullWidth
          variant="outline"
          onClick={onSearchSubmit}
        >
          Search
        </Button>
      </Box>

      {/* Topics Filter */}
      <Box mb="md">
        <Group
          justify="space-between"
          onClick={() => toggleSection('topics')}
          style={{ cursor: 'pointer' }}
          mb="xs"
        >
          <Text fw={600} size="sm">
            Topic
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'topics' ? '−' : '+'}
          </Text>
        </Group>
        <Collapse in={expandedSection === 'topics'}>
          <Box style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Stack gap="xs">
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
          </Box>
        </Collapse>
      </Box>

      {/* Locations Filter */}
      <Box mb="md">
        <Group
          justify="space-between"
          onClick={() => toggleSection('locations')}
          style={{ cursor: 'pointer' }}
          mb="xs"
        >
          <Text fw={600} size="sm">
            Location
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'locations' ? '−' : '+'}
          </Text>
        </Group>
        <Collapse in={expandedSection === 'locations'}>
          <Box style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Stack gap="xs">
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
          </Box>
        </Collapse>
      </Box>

      {/* Authors Filter */}
      <Box mb="md">
        <Group
          justify="space-between"
          onClick={() => toggleSection('authors')}
          style={{ cursor: 'pointer' }}
          mb="xs"
        >
          <Text fw={600} size="sm">
            Author
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'authors' ? '−' : '+'}
          </Text>
        </Group>
        <Collapse in={expandedSection === 'authors'}>
          <Box style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            <Stack gap="xs">
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
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}
