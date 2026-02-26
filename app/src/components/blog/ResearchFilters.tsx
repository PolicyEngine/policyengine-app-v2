/**
 * ResearchFilters Component
 *
 * Sidebar filters for the Research page.
 * Includes search, topics, locations, and authors.
 * Filter menu extends to bottom of viewport with scroll in expanded section.
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Checkbox, Group, Stack, Text, TextInput } from '@mantine/core';
import {
  getLocationTags,
  getTopicLabel,
  getTopicTags,
  locationLabels,
} from '@/data/posts/postTransformers';

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
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  availableAuthors: { key: string; name: string }[];
  countryId?: string;
}

type ExpandedSection = 'type' | 'topics' | 'locations' | 'authors' | null;

const typeOptions = [
  { value: 'article', label: 'Article' },
  { value: 'interactive', label: 'Interactive' },
];

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
  selectedTypes,
  onTypesChange,
  availableAuthors,
  countryId = 'us',
}: ResearchFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [usStatesExpanded, setUsStatesExpanded] = useState(false);
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

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  // Render type options
  const renderTypeOptions = () => (
    <Stack gap={4}>
      {typeOptions.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={selectedTypes.includes(option.value)}
          onChange={() => handleTypeToggle(option.value)}
          size="sm"
        />
      ))}
    </Stack>
  );

  // Render the tags for a section
  const renderTopicTags = () => (
    <Stack gap={4}>
      {getTopicTags().map((tag) => (
        <Checkbox
          key={tag}
          label={getTopicLabel(tag, countryId)}
          checked={selectedTopics.includes(tag)}
          onChange={() => handleTopicToggle(tag)}
          size="sm"
        />
      ))}
    </Stack>
  );

  const renderLocationTags = () => {
    // Separate countries from US states
    const allLocationTags = getLocationTags();
    const countries = allLocationTags.filter((tag) => !tag.startsWith('us-'));
    const usStates = allLocationTags.filter((tag) => tag.startsWith('us-'));

    return (
      <Stack gap={4}>
        {/* Show countries */}
        {countries.map((tag) => (
          <Box key={tag}>
            {tag === 'us' ? (
              // US with expandable +/-
              <Checkbox
                label={
                  <span>
                    {locationLabels[tag] || tag}
                    <Text
                      component="span"
                      size="sm"
                      c="dimmed"
                      style={{ cursor: 'pointer', userSelect: 'none', marginLeft: 12 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUsStatesExpanded(!usStatesExpanded);
                      }}
                    >
                      {usStatesExpanded ? '−' : '+'}
                    </Text>
                  </span>
                }
                checked={selectedLocations.includes(tag)}
                onChange={() => handleLocationToggle(tag)}
                size="sm"
              />
            ) : (
              <Checkbox
                label={locationLabels[tag] || tag}
                checked={selectedLocations.includes(tag)}
                onChange={() => handleLocationToggle(tag)}
                size="sm"
              />
            )}
          </Box>
        ))}
        {/* US States - only show when expanded */}
        {usStatesExpanded &&
          usStates.map((tag) => (
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
  };

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
        {/* Type Header */}
        <Group
          justify="space-between"
          onClick={() => toggleSection('type')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          py="xs"
        >
          <Text fw={600} size="sm">
            Type
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'type' ? '−' : '+'}
          </Text>
        </Group>

        {/* Type Content */}
        {expandedSection === 'type' && (
          <Box
            style={{
              overflowY: 'auto',
              minHeight: 0,
              maxHeight: availableHeight - 16,
              paddingBottom: 8,
            }}
          >
            {renderTypeOptions()}
          </Box>
        )}

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
          <Box
            style={{
              overflowY: 'auto',
              minHeight: 0,
              maxHeight: availableHeight - 16,
              paddingBottom: 8,
            }}
          >
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
          <Box
            style={{
              overflowY: 'auto',
              minHeight: 0,
              maxHeight: availableHeight - 16,
              paddingBottom: 8,
            }}
          >
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
          <Box
            style={{
              overflowY: 'auto',
              minHeight: 0,
              maxHeight: availableHeight - 16,
              paddingBottom: 8,
            }}
          >
            {renderAuthorTags()}
          </Box>
        )}
      </Box>
    </Box>
  );
}
