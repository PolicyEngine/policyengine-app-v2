import { useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import { Button, Checkbox, Input, Stack, Text } from '@/components/ui';
import {
  getLocationTags,
  getTopicLabel,
  getTopicTags,
  locationLabels,
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
}

type ExpandedSection = 'type' | 'topics' | 'locations' | 'authors' | null;

const typeOptions = [
  { value: 'article', label: 'Article' },
  { value: 'interactive', label: 'Interactive' },
];

/** Shared styles for a collapsible section header */
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'background-color 0.12s ease',
  userSelect: 'none',
};

/** A single filter section with animated expand/collapse */
function FilterSection({
  label,
  isExpanded,
  onToggle,
  count,
  children,
  maxHeight,
}: {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
  maxHeight: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${isExpanded ? colors.primary[200] : colors.border.light}`,
        backgroundColor: isExpanded ? 'rgba(230, 255, 250, 0.3)' : colors.white,
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        style={sectionHeaderStyle}
        onClick={onToggle}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = colors.gray[50];
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text
            fw={typography.fontWeight.semibold}
            size="sm"
            style={{ color: isExpanded ? colors.primary[700] : colors.secondary[800] }}
          >
            {label}
          </Text>
          {count > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: colors.primary[500],
                color: colors.white,
                fontSize: '11px',
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.primary,
                padding: '0 6px',
              }}
            >
              {count}
            </span>
          )}
        </div>
        <IconChevronDown
          size={16}
          color={isExpanded ? colors.primary[600] : colors.text.tertiary}
          style={{
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        style={{
          maxHeight: isExpanded ? `${Math.min(height, maxHeight)}px` : '0px',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          overflow: isExpanded ? 'auto' : 'hidden',
        }}
      >
        <div ref={contentRef} style={{ padding: '4px 12px 12px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Styled checkbox row — entire row is clickable */
function CheckboxRow({
  id,
  label,
  checked,
  onChange,
  indented,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  indented?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 8px',
        borderRadius: '8px',
        marginLeft: indented ? '16px' : 0,
        transition: 'background-color 0.1s ease',
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.gray[50];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Checkbox
        id={id}
        checked={checked}
        tabIndex={-1}
        onCheckedChange={onChange}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      />
      <span
        style={{
          fontSize: '13.5px',
          fontFamily: typography.fontFamily.primary,
          color: checked ? colors.primary[700] : colors.secondary[700],
          fontWeight: checked ? typography.fontWeight.semibold : typography.fontWeight.normal,
          transition: 'color 0.1s ease',
          flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

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

  function toggleItem(item: string, selected: string[], onChange: (items: string[]) => void) {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  }

  const handleTopicToggle = (tag: string) => toggleItem(tag, selectedTopics, onTopicsChange);
  const handleLocationToggle = (tag: string) =>
    toggleItem(tag, selectedLocations, onLocationsChange);
  const handleAuthorToggle = (key: string) => toggleItem(key, selectedAuthors, onAuthorsChange);
  const handleTypeToggle = (type: string) => toggleItem(type, selectedTypes, onTypesChange);

  return (
    <div className="tw:flex tw:flex-col tw:h-full">
      {/* Search */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ position: 'relative' }}>
          <IconSearch
            size={16}
            color={colors.text.tertiary}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit();
              }
            }}
            style={{
              paddingLeft: '36px',
              borderRadius: '10px',
              border: `1px solid ${colors.border.light}`,
              fontSize: '14px',
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={onSearchSubmit}
          className="tw:w-full"
          style={{
            marginTop: spacing.sm,
            borderRadius: '10px',
            fontWeight: typography.fontWeight.medium,
          }}
        >
          Search
        </Button>
      </div>

      {/* Filter sections */}
      <div
        ref={filterContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
          maxHeight: availableHeight,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <FilterSection
          label="Type"
          isExpanded={expandedSection === 'type'}
          onToggle={() => toggleSection('type')}
          count={selectedTypes.length}
          maxHeight={availableHeight - 16}
        >
          <Stack gap="xs">
            {typeOptions.map((option) => (
              <CheckboxRow
                key={option.value}
                id={`type-${option.value}`}
                label={option.label}
                checked={selectedTypes.includes(option.value)}
                onChange={() => handleTypeToggle(option.value)}
              />
            ))}
          </Stack>
        </FilterSection>

        <FilterSection
          label="Topic"
          isExpanded={expandedSection === 'topics'}
          onToggle={() => toggleSection('topics')}
          count={selectedTopics.length}
          maxHeight={availableHeight - 16}
        >
          <Stack gap="xs">
            {getTopicTags().map((tag) => (
              <CheckboxRow
                key={tag}
                id={`topic-${tag}`}
                label={getTopicLabel(tag, countryId)}
                checked={selectedTopics.includes(tag)}
                onChange={() => handleTopicToggle(tag)}
              />
            ))}
          </Stack>
        </FilterSection>

        <FilterSection
          label="Location"
          isExpanded={expandedSection === 'locations'}
          onToggle={() => toggleSection('locations')}
          count={selectedLocations.length}
          maxHeight={availableHeight - 16}
        >
          <Stack gap="xs">
            {getLocationTags()
              .filter((tag) => !tag.startsWith('us-'))
              .map((tag) => (
                <div key={tag}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <CheckboxRow
                        id={`location-${tag}`}
                        label={locationLabels[tag] || tag}
                        checked={selectedLocations.includes(tag)}
                        onChange={() => handleLocationToggle(tag)}
                      />
                    </div>
                    {tag === 'us' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUsStatesExpanded(!usStatesExpanded);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: colors.primary[600],
                          fontWeight: typography.fontWeight.medium,
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {usStatesExpanded ? 'Hide states' : 'Show states'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {usStatesExpanded &&
              getLocationTags()
                .filter((tag) => tag.startsWith('us-'))
                .map((tag) => (
                  <CheckboxRow
                    key={tag}
                    id={`location-${tag}`}
                    label={locationLabels[tag] || tag}
                    checked={selectedLocations.includes(tag)}
                    onChange={() => handleLocationToggle(tag)}
                    indented
                  />
                ))}
          </Stack>
        </FilterSection>

        <FilterSection
          label="Author"
          isExpanded={expandedSection === 'authors'}
          onToggle={() => toggleSection('authors')}
          count={selectedAuthors.length}
          maxHeight={availableHeight - 16}
        >
          <Stack gap="xs">
            {availableAuthors.map((author) => (
              <CheckboxRow
                key={author.key}
                id={`author-${author.key}`}
                label={author.name}
                checked={selectedAuthors.includes(author.key)}
                onChange={() => handleAuthorToggle(author.key)}
              />
            ))}
          </Stack>
        </FilterSection>
      </div>
    </div>
  );
}
