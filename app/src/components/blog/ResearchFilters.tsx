/**
 * ResearchFilters - Editorial Filter Sidebar
 *
 * Refined filter controls with elegant accordion sections
 * and sophisticated styling.
 */

import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { Box, Checkbox, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  getTopicLabel,
  locationLabels,
  locationTags,
  topicTags,
} from '@/data/posts/postTransformers';
import { colors, spacing, typography } from '@/designTokens';

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
  hideSearch?: boolean;
}

type ExpandedSection = 'type' | 'topics' | 'locations' | 'authors' | null;

const typeOptions = [
  { value: 'article', label: 'Article' },
  { value: 'interactive', label: 'Interactive' },
];

export function ResearchFilters({
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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('type');
  const [usStatesExpanded, setUsStatesExpanded] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number>(400);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateHeight = () => {
      if (filterContainerRef.current) {
        const rect = filterContainerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const topOffset = rect.top;
        const padding = 40;
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

  // Separate countries from US states
  const countries = locationTags.filter((tag) => !tag.startsWith('us-'));
  const usStates = locationTags.filter((tag) => tag.startsWith('us-'));

  return (
    <Box
      ref={filterContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: availableHeight,
      }}
    >
      {/* Section Label */}
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          letterSpacing: typography.letterSpacing.widest,
          textTransform: 'uppercase',
          color: colors.text.tertiary,
          marginBottom: spacing.lg,
        }}
      >
        Filter By
      </Text>

      {/* Type Section */}
      <FilterSection
        title="Type"
        isExpanded={expandedSection === 'type'}
        onToggle={() => toggleSection('type')}
        count={selectedTypes.length}
      >
        <Stack gap={spacing.sm}>
          {typeOptions.map((option) => (
            <FilterCheckbox
              key={option.value}
              label={option.label}
              checked={selectedTypes.includes(option.value)}
              onChange={() => handleTypeToggle(option.value)}
            />
          ))}
        </Stack>
      </FilterSection>

      {/* Topics Section */}
      <FilterSection
        title="Topic"
        isExpanded={expandedSection === 'topics'}
        onToggle={() => toggleSection('topics')}
        count={selectedTopics.length}
      >
        <Stack gap={spacing.sm}>
          {topicTags.map((tag) => (
            <FilterCheckbox
              key={tag}
              label={getTopicLabel(tag, countryId)}
              checked={selectedTopics.includes(tag)}
              onChange={() => handleTopicToggle(tag)}
            />
          ))}
        </Stack>
      </FilterSection>

      {/* Locations Section */}
      <FilterSection
        title="Location"
        isExpanded={expandedSection === 'locations'}
        onToggle={() => toggleSection('locations')}
        count={selectedLocations.length}
      >
        <Stack gap={spacing.sm}>
          {countries.map((tag) => (
            <Box key={tag}>
              {tag === 'us' ? (
                <Box style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <FilterCheckbox
                    label={locationLabels[tag] || tag}
                    checked={selectedLocations.includes(tag)}
                    onChange={() => handleLocationToggle(tag)}
                  />
                  <UnstyledButton
                    onClick={() => setUsStatesExpanded(!usStatesExpanded)}
                    style={{
                      fontFamily: typography.fontFamily.primary,
                      fontSize: typography.fontSize.xs,
                      color: colors.primary[600],
                      padding: `2px ${spacing.sm}`,
                      borderRadius: spacing.radius.sm,
                      backgroundColor: colors.primary[50],
                    }}
                  >
                    {usStatesExpanded ? 'Hide states' : 'Show states'}
                  </UnstyledButton>
                </Box>
              ) : (
                <FilterCheckbox
                  label={locationLabels[tag] || tag}
                  checked={selectedLocations.includes(tag)}
                  onChange={() => handleLocationToggle(tag)}
                />
              )}
            </Box>
          ))}
          {usStatesExpanded && (
            <Box style={{ paddingLeft: spacing.lg, borderLeft: `2px solid ${colors.border.light}` }}>
              <Stack gap={spacing.sm}>
                {usStates.map((tag) => (
                  <FilterCheckbox
                    key={tag}
                    label={locationLabels[tag] || tag}
                    checked={selectedLocations.includes(tag)}
                    onChange={() => handleLocationToggle(tag)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </FilterSection>

      {/* Authors Section */}
      <FilterSection
        title="Author"
        isExpanded={expandedSection === 'authors'}
        onToggle={() => toggleSection('authors')}
        count={selectedAuthors.length}
      >
        <Stack gap={spacing.sm}>
          {availableAuthors.map((author) => (
            <FilterCheckbox
              key={author.key}
              label={author.name}
              checked={selectedAuthors.includes(author.key)}
              onChange={() => handleAuthorToggle(author.key)}
            />
          ))}
        </Stack>
      </FilterSection>
    </Box>
  );
}

// Filter Section Component
function FilterSection({
  title,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        borderBottom: `1px solid ${colors.border.light}`,
        paddingBottom: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <UnstyledButton
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: `${spacing.sm} 0`,
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {title}
          </Text>
          {count > 0 && (
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.white,
                backgroundColor: colors.primary[600],
                padding: `1px ${spacing.sm}`,
                borderRadius: spacing.radius.full,
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {count}
            </Text>
          )}
        </Box>
        <IconChevronDown
          size={16}
          color={colors.text.tertiary}
          style={{
            transition: 'transform 200ms ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </UnstyledButton>

      {isExpanded && (
        <Box
          style={{
            paddingTop: spacing.sm,
            maxHeight: '250px',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

// Filter Checkbox Component
function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <Checkbox
      label={label}
      checked={checked}
      onChange={onChange}
      size="sm"
      styles={{
        root: {
          cursor: 'pointer',
        },
        input: {
          cursor: 'pointer',
          borderColor: colors.border.medium,
          '&:checked': {
            backgroundColor: colors.primary[600],
            borderColor: colors.primary[600],
          },
        },
        label: {
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          cursor: 'pointer',
        },
      }}
    />
  );
}
