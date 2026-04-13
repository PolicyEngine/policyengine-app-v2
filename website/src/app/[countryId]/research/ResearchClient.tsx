"use client";

/**
 * Research Page Client Component
 *
 * Main research/blog listing page with filtering and search.
 * Displays both blog posts and apps with displayWithResearch: true.
 *
 * Ported from app/src/pages/Research.page.tsx with minimal changes:
 *   - react-router Link -> next/link
 *   - @/designTokens -> @policyengine/design-system/tokens
 *   - useCurrentCountry() -> countryId prop
 *   - useSearchParams from react-router -> from next/navigation
 *   - Uses shadcn Input, Checkbox, Button from @/components/ui
 *   - Uses shared HeroSection component
 *   - Uses OptimisedImage for blog post images
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import {
  IconArrowRight,
  IconChevronDown,
  IconSearch,
} from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import {
  Button,
  Checkbox,
  Container,
  Input,
  Spinner,
  Stack,
  Text,
} from "@/components/ui";
import OptimisedImage from "@/components/ui/OptimisedImage";
import HeroSection from "@/components/static/HeroSection";
import { useDisplayCategory } from "@/components/blog/useDisplayCategory";
import {
  getLocationTags,
  getResearchItems,
  getTopicLabel,
  getTopicTags,
  locationLabels,
  topicLabels,
  type ResearchItem,
} from "@/data/posts/postTransformers";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

/* ─── Constants ─── */

const mockAuthors = [
  { key: "max-ghenis", name: "Max Ghenis" },
  { key: "nikhil-woodruff", name: "Nikhil Woodruff" },
  { key: "pavel-makarchuk", name: "Pavel Makarchuk" },
  { key: "vahid-ahmadi", name: "Vahid Ahmadi" },
  { key: "ben-ogorek", name: "Ben Ogorek" },
];

const typeOptions = [
  { value: "article", label: "Article" },
  { value: "interactive", label: "Interactive" },
];

type ExpandedSection = "type" | "topics" | "locations" | "authors" | null;

/* ─── Helpers ─── */

function parseArrayParam(
  value: string | null,
  defaultValue: string[] = [],
): string[] {
  return value ? value.split(",") : defaultValue;
}

function buildFilterParams(
  filters: {
    search: string;
    types: string[];
    topics: string[];
    locations: string[];
    authors: string[];
  },
  defaultLocations: string[],
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.types.length) {
    params.set("types", filters.types.join(","));
  }
  if (filters.topics.length) {
    params.set("topics", filters.topics.join(","));
  }
  // Only set locations if different from default
  const sortedDefault = [...defaultLocations].sort().join(",");
  const sortedCurrent = [...filters.locations].sort().join(",");
  if (sortedCurrent !== sortedDefault) {
    params.set("locations", filters.locations.join(","));
  }
  if (filters.authors.length) {
    params.set("authors", filters.authors.join(","));
  }

  return params;
}

/* ─── BlogPostCard ─── */

function BlogPostCard({
  item,
  countryId,
}: {
  item: ResearchItem;
  countryId: string;
}) {
  const link = item.isApp
    ? `/${item.countryId}/${item.slug}`
    : `/${countryId}/research/${item.slug}`;

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const displayTags = item.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .slice(0, 3)
    .map((tag) => topicLabels[tag] || locationLabels[tag] || tag);

  // Apps may be served via Vercel rewrites (reverse proxy), so use a plain
  // <a> to force a full server request instead of client-side routing.
  const cardClassName = "tw:no-underline tw:text-inherit tw:group";
  const cardContent = (
      <div className="tw:flex tw:flex-col tw:h-full tw:rounded-xl tw:overflow-hidden tw:bg-white tw:transition-all tw:duration-300 tw:ease-out tw:border tw:border-gray-200 tw:hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] tw:hover:border-gray-300 tw:hover:-translate-y-0.5">
        {/* Image */}
        <div className="tw:relative tw:h-[260px] tw:overflow-hidden tw:bg-gray-100">
          {item.image && (
            <OptimisedImage
              src={
                item.image.startsWith("http")
                  ? item.image
                  : `/assets/posts/${item.image}`
              }
              alt={item.title}
              width={640}
              className="tw:w-full tw:h-full tw:object-cover tw:transition-transform tw:duration-500 tw:ease-out tw:group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          {/* Gradient overlay at bottom of image for depth */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.04))",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            padding: "16px 18px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tags + Date row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "11px",
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              color: colors.gray[500],
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {displayTags.map((tag, i) => (
                <span
                  key={tag}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  {tag}
                  {i < displayTags.length - 1 && (
                    <span
                      style={{
                        margin: "0 8px",
                        color: colors.gray[400],
                        fontSize: "9px",
                      }}
                    >
                      &#9679;
                    </span>
                  )}
                </span>
              ))}
            </div>
            <span style={{ flexShrink: 0 }}>{formattedDate}</span>
          </div>

          {/* Title */}
          <p
            style={{
              fontWeight: typography.fontWeight.semibold,
              fontSize: "15.5px",
              lineHeight: "1.4",
              color: colors.secondary[900],
              marginBottom: "8px",
              fontFamily: typography.fontFamily.primary,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              letterSpacing: "-0.01em",
            }}
          >
            {item.title}
          </p>

          {/* Description */}
          <Text
            size="sm"
            style={{
              color: colors.text.secondary,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.6",
            }}
          >
            {item.description}
          </Text>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "4px",
              marginTop: "12px",
              color: colors.primary[600],
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              fontSize: "13.5px",
            }}
            className="tw:transition-all tw:duration-200 tw:group-hover:gap-2"
          >
            <span>{item.isApp ? "Open" : "Read more"}</span>
            <IconArrowRight
              size={15}
              className="tw:transition-transform tw:duration-200 tw:group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
  );

  if (item.isApp) {
    return <a href={link} className={cardClassName}>{cardContent}</a>;
  }
  return <Link href={link} className={cardClassName}>{cardContent}</Link>;
}

/* ─── BlogPostGrid ─── */

function itemKey(item: ResearchItem) {
  return `${item.isApp ? "app" : "post"}-${item.slug}`;
}

function BlogPostGrid({
  items,
  countryId,
}: {
  items: ResearchItem[];
  countryId: string;
}) {
  const prevKeysRef = useRef<Set<string>>(new Set());
  const [newKeys, setNewKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentKeys = new Set(items.map(itemKey));
    const prevKeys = prevKeysRef.current;

    // Keys that are new (not in previous set)
    const entering = new Set<string>();
    currentKeys.forEach((k) => {
      if (!prevKeys.has(k)) {
        entering.add(k);
      }
    });

    setNewKeys(entering);
    prevKeysRef.current = currentKeys;

    // Clear the "new" status after animations complete
    if (entering.size > 0) {
      const timer = setTimeout(() => setNewKeys(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [items]);

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-4">
        {items.map((item, i) => {
          const key = itemKey(item);
          const isNew = newKeys.has(key);
          const newIndex = isNew
            ? items.filter((it, j) => j <= i && newKeys.has(itemKey(it)))
                .length - 1
            : 0;

          return (
            <div
              key={key}
              style={
                isNew
                  ? {
                      animation:
                        "cardEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1) both",
                      animationDelay: `${Math.min(newIndex * 40, 300)}ms`,
                    }
                  : undefined
              }
            >
              <BlogPostCard item={item} countryId={countryId} />
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

/* ─── FilterSection ─── */

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "background-color 0.12s ease",
  userSelect: "none",
};

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
        borderRadius: "12px",
        border: `1px solid ${isExpanded ? colors.primary[200] : colors.border.light}`,
        backgroundColor: isExpanded ? "rgba(230, 255, 250, 0.3)" : colors.white,
        transition: "border-color 0.2s ease, background-color 0.2s ease",
        overflow: "hidden",
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
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Text
            fw={typography.fontWeight.semibold}
            size="sm"
            style={{
              color: isExpanded
                ? colors.primary[700]
                : colors.secondary[800],
            }}
          >
            {label}
          </Text>
          {count > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                borderRadius: "10px",
                backgroundColor: colors.primary[600],
                color: colors.white,
                fontSize: "11px",
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.primary,
                padding: "0 6px",
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
            transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      <div
        style={{
          maxHeight: isExpanded
            ? `${Math.min(height, maxHeight)}px`
            : "0px",
          opacity: isExpanded ? 1 : 0,
          transition:
            "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          overflow: isExpanded ? "auto" : "hidden",
        }}
      >
        <div ref={contentRef} style={{ padding: "4px 12px 12px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── CheckboxRow ─── */

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
  const labelId = `${id}-label`;

  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "6px 8px",
        borderRadius: "8px",
        marginLeft: indented ? "16px" : 0,
        transition: "background-color 0.1s ease",
        cursor: "pointer",
        background: "transparent",
        width: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.gray[50];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <Checkbox
        id={id}
        checked={checked}
        aria-labelledby={labelId}
        onCheckedChange={() => onChange()}
      />
      <span
        id={labelId}
        style={{
          fontSize: "13.5px",
          fontFamily: typography.fontFamily.primary,
          color: checked ? colors.primary[700] : colors.secondary[700],
          fontWeight: checked
            ? typography.fontWeight.semibold
            : typography.fontWeight.normal,
          transition: "color 0.1s ease",
          flex: 1,
        }}
      >
        {label}
      </span>
    </label>
  );
}

/* ─── ResearchFilters ─── */

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

function ResearchFilters({
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
  countryId = "us",
}: ResearchFiltersProps) {
  const [expandedSection, setExpandedSection] =
    useState<ExpandedSection>(null);
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
    window.addEventListener("resize", calculateHeight);
    window.addEventListener("scroll", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
      window.removeEventListener("scroll", calculateHeight);
    };
  }, []);

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  function toggleItem(
    item: string,
    selected: string[],
    onChangeCallback: (items: string[]) => void,
  ) {
    if (selected.includes(item)) {
      onChangeCallback(selected.filter((s) => s !== item));
    } else {
      onChangeCallback([...selected, item]);
    }
  }

  const handleTopicToggle = (tag: string) =>
    toggleItem(tag, selectedTopics, onTopicsChange);
  const handleLocationToggle = (tag: string) =>
    toggleItem(tag, selectedLocations, onLocationsChange);
  const handleAuthorToggle = (key: string) =>
    toggleItem(key, selectedAuthors, onAuthorsChange);
  const handleTypeToggle = (type: string) =>
    toggleItem(type, selectedTypes, onTypesChange);

  return (
    <div className="tw:flex tw:flex-col tw:h-full">
      {/* Search */}
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ position: "relative" }}>
          <IconSearch
            size={16}
            color={colors.text.tertiary}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit();
              }
            }}
            style={{
              paddingLeft: "36px",
              borderRadius: "10px",
              border: `1px solid ${colors.border.light}`,
              fontSize: "14px",
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={onSearchSubmit}
          className="tw:w-full"
          style={{
            marginTop: spacing.sm,
            borderRadius: "10px",
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
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flex: 1,
          maxHeight: availableHeight,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <FilterSection
          label="Type"
          isExpanded={expandedSection === "type"}
          onToggle={() => toggleSection("type")}
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
          isExpanded={expandedSection === "topics"}
          onToggle={() => toggleSection("topics")}
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
          isExpanded={expandedSection === "locations"}
          onToggle={() => toggleSection("locations")}
          count={selectedLocations.length}
          maxHeight={availableHeight - 16}
        >
          <Stack gap="xs">
            {getLocationTags()
              .filter((tag) => !tag.startsWith("us-"))
              .map((tag) => (
                <div key={tag}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <CheckboxRow
                        id={`location-${tag}`}
                        label={locationLabels[tag] || tag}
                        checked={selectedLocations.includes(tag)}
                        onChange={() => handleLocationToggle(tag)}
                      />
                    </div>
                    {tag === "us" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUsStatesExpanded(!usStatesExpanded);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: colors.primary[600],
                          fontWeight: typography.fontWeight.medium,
                          transition: "background-color 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            colors.primary[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "transparent";
                        }}
                      >
                        {usStatesExpanded ? "Hide states" : "Show states"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {usStatesExpanded &&
              getLocationTags()
                .filter((tag) => tag.startsWith("us-"))
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
          isExpanded={expandedSection === "authors"}
          onToggle={() => toggleSection("authors")}
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

/* ─── Main Client Component ─── */

export default function ResearchClient({
  countryId,
}: {
  countryId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const displayCategory = useDisplayCategory();

  // Get all research items
  const allItems = useMemo(() => getResearchItems(), []);

  // Default locations based on country
  const defaultLocations = useMemo(
    () => [countryId, "global"],
    [countryId],
  );

  // Filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() =>
    parseArrayParam(searchParams.get("types")),
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() =>
    parseArrayParam(searchParams.get("topics")),
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() =>
    parseArrayParam(searchParams.get("locations"), defaultLocations),
  );
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(() =>
    parseArrayParam(searchParams.get("authors")),
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
      defaultLocations,
    );
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    searchQuery,
    defaultLocations,
    pathname,
    router,
  ]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by type
    if (selectedTypes.length > 0) {
      items = items.filter((item) => {
        const itemType = item.isApp ? "interactive" : "article";
        return selectedTypes.includes(itemType);
      });
    }

    // Filter by topics
    if (selectedTopics.length > 0) {
      items = items.filter((item) =>
        selectedTopics.some((topic) => item.tags.includes(topic)),
      );
    }

    // Filter by locations
    if (selectedLocations.length > 0) {
      items = items.filter((item) =>
        selectedLocations.some((location) => item.tags.includes(location)),
      );
    }

    // Filter by authors
    if (selectedAuthors.length > 0) {
      items = items.filter((item) =>
        selectedAuthors.some((author) => item.authors.includes(author)),
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const fuse = new Fuse(items, {
        keys: ["title", "description"],
        threshold: 0.3,
      });
      items = fuse.search(searchQuery).map((result) => result.item);
    }

    return items;
  }, [
    allItems,
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    searchQuery,
  ]);

  // Infinite scroll - show 8 items initially, load 8 more as user scrolls
  const { visibleCount, sentinelRef, hasMore, reset } = useInfiniteScroll({
    totalCount: filteredItems.length,
    initialCount: 8,
    incrementCount: 8,
  });

  // Reset infinite scroll when filters change
  useEffect(() => {
    reset();
  }, [
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    searchQuery,
    reset,
  ]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  // Handle search submit (just triggers the useEffect via state change)
  const handleSearchSubmit = useCallback(() => {
    // URL params are already synced via useEffect
    // This function exists for the search button/enter key
  }, []);

  return (
    <>
      <HeroSection
        title="Research and analysis"
        description="Explore our research on tax and benefit policy, including technical reports, policy analyses, and interactive tools."
      />

      {/* Content */}
      <Container size="xl" className="tw:py-xl">
        <div
          style={{
            display: "flex",
            flexDirection:
              displayCategory === "desktop" ? "row" : "column",
            gap: spacing.xl,
          }}
        >
          {/* Sidebar Filters */}
          <div
            style={{
              flex:
                displayCategory === "desktop" ? "0 0 250px" : "1",
              position:
                displayCategory === "desktop" ? "sticky" : "static",
              top:
                displayCategory === "desktop" ? "100px" : "auto",
              alignSelf: "flex-start",
              height:
                displayCategory === "desktop"
                  ? "calc(100vh - 120px)"
                  : "auto",
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
          </div>

          {/* Results */}
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <Text
              size="sm"
              className="tw:mb-md"
              style={{ color: colors.gray[500] }}
            >
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "result" : "results"}
            </Text>

            {filteredItems.length > 0 ? (
              <>
                <BlogPostGrid
                  items={visibleItems}
                  countryId={countryId}
                />

                {/* Sentinel element for infinite scroll */}
                {hasMore && (
                  <div
                    ref={sentinelRef}
                    className="tw:flex tw:justify-center"
                    style={{ padding: spacing.xl }}
                  >
                    <Spinner size="sm" />
                  </div>
                )}
              </>
            ) : (
              <div
                className="tw:text-center"
                style={{
                  padding: spacing["3xl"],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.container,
                }}
              >
                <Text style={{ color: colors.gray[500] }}>
                  No results found. Try adjusting your filters.
                </Text>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
