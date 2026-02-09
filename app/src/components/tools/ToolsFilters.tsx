/**
 * ToolsFilters Component
 *
 * Sidebar filters for the Tools page.
 * Simplified version of ResearchFilters with search and tag filtering.
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Checkbox, Group, Stack, Text, TextInput } from '@mantine/core';

interface ToolsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: { value: string; label: string; count: number }[];
}

type ExpandedSection = 'tags' | null;

export function ToolsFilters({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedTags,
  onTagsChange,
  availableTags,
}: ToolsFiltersProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('tags');
  const [availableHeight, setAvailableHeight] = useState<number>(400);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateHeight = () => {
      if (filterContainerRef.current) {
        const rect = filterContainerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topOffset = rect.top;
        const padding = 20;
        const newHeight = viewportHeight - topOffset - padding;
        setAvailableHeight(Math.max(newHeight, 100));
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

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search */}
      <Box mb="lg" style={{ flexShrink: 0 }}>
        <TextInput
          placeholder="Search tools..."
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

      {/* Filter sections */}
      <Box
        ref={filterContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: availableHeight,
          overflow: 'hidden',
        }}
      >
        {/* Tags header */}
        <Group
          justify="space-between"
          onClick={() => toggleSection('tags')}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          py="xs"
        >
          <Text fw={600} size="sm">
            Topic
          </Text>
          <Text size="sm" c="dimmed">
            {expandedSection === 'tags' ? '−' : '+'}
          </Text>
        </Group>

        {/* Tags content */}
        {expandedSection === 'tags' && (
          <Box
            style={{
              overflowY: 'auto',
              minHeight: 0,
              maxHeight: availableHeight - 16,
              paddingBottom: 8,
            }}
          >
            <Stack gap={4}>
              {availableTags.map((tag) => (
                <Checkbox
                  key={tag.value}
                  label={`${tag.label} (${tag.count})`}
                  checked={selectedTags.includes(tag.value)}
                  onChange={() => handleTagToggle(tag.value)}
                  size="sm"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
