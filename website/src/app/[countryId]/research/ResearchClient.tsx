"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { useDisplayCategory } from "@/components/blog/useDisplayCategory";
import {
  getResearchItems,
  getTopicTags,
  getTopicLabel,
  getLocationTags,
  locationLabels,
  topicLabels,
  type ResearchItem,
} from "@/data/posts/postTransformers";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

/* ─── helpers ─── */

function parseArrayParam(
  value: string | null,
  defaultValue: string[] = [],
): string[] {
  return value ? value.split(",") : defaultValue;
}

/* ─── BlogPostCard ─── */

function BlogPostCard({
  item,
  countryId,
}: {
  item: ResearchItem;
  countryId: string;
}) {
  const link = `/${countryId}/research/${item.slug}`;

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const displayTags = item.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .slice(0, 3)
    .map((tag) => topicLabels[tag] || locationLabels[tag] || tag);

  return (
    <Link
      href={link}
      style={{ textDecoration: "none", color: "inherit" }}
      className="group"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: spacing.radius.feature,
          overflow: "hidden",
          backgroundColor: colors.white,
          border: `1px solid ${colors.gray[200]}`,
          transition: "all 0.3s ease-out",
        }}
      >
        {/* Image */}
        {item.image && (
          <div
            style={{
              position: "relative",
              height: "260px",
              overflow: "hidden",
              backgroundColor: colors.gray[100],
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                item.image.startsWith("http")
                  ? item.image
                  : `/assets/posts/${item.image}`
              }
              alt={item.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: `${spacing.lg} ${spacing.lg}`,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Tags + Date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.sm,
              fontSize: typography.fontSize.xs,
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
                        margin: `0 ${spacing.sm}`,
                        color: colors.gray[400],
                        fontSize: "9px",
                      }}
                    >
                      &bull;
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
              fontSize: typography.fontSize.base,
              lineHeight: "1.4",
              color: colors.secondary[900],
              marginBottom: spacing.sm,
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
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: "1.6",
              fontFamily: typography.fontFamily.body,
            }}
          >
            {item.description}
          </p>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: spacing.xs,
              marginTop: spacing.md,
              color: colors.primary[600],
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.sm,
            }}
          >
            <span>Read more</span>
            <IconArrowRight size={15} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── FilterSection ─── */

function FilterSection({
  label,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded, children]);

  return (
    <div
      style={{
        borderRadius: spacing.radius.feature,
        border: `1px solid ${isExpanded ? colors.primary[200] : colors.border.light}`,
        backgroundColor: isExpanded ? colors.primary[50] : colors.white,
        transition: "border-color 0.2s ease, background-color 0.2s ease",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: spacing.radius.feature,
          cursor: "pointer",
          background: "transparent",
          border: "none",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span
            style={{
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
              color: isExpanded ? colors.primary[700] : colors.secondary[800],
            }}
          >
            {label}
          </span>
          {count > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                borderRadius: spacing.radius.feature,
                backgroundColor: colors.primary[500],
                color: colors.white,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
                fontFamily: typography.fontFamily.primary,
                padding: `0 ${spacing.xs}`,
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
          maxHeight: isExpanded ? `${height}px` : "0px",
          opacity: isExpanded ? 1 : 0,
          transition:
            "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div ref={contentRef} style={{ padding: `${spacing.xs} ${spacing.md} ${spacing.md}` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── CheckboxRow ─── */

function CheckboxRow({
  label,
  checked,
  onChange,
  indented,
}: {
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
        display: "flex",
        alignItems: "center",
        gap: spacing.sm,
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: spacing.radius.container,
        marginLeft: indented ? spacing.lg : 0,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        width: "100%",
        textAlign: "left",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        style={{ accentColor: colors.primary[500] }}
      />
      <span
        style={{
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
          color: checked ? colors.primary[700] : colors.secondary[700],
          fontWeight: checked
            ? typography.fontWeight.semibold
            : typography.fontWeight.normal,
          flex: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ─── main client component ─── */

const typeOptions = [
  { value: "article", label: "Article" },
  { value: "interactive", label: "Interactive" },
];

const AUTHORS = [
  { key: "max-ghenis", name: "Max Ghenis" },
  { key: "nikhil-woodruff", name: "Nikhil Woodruff" },
  { key: "pavel-makarchuk", name: "Pavel Makarchuk" },
  { key: "vahid-ahmadi", name: "Vahid Ahmadi" },
  { key: "ben-ogorek", name: "Ben Ogorek" },
];

type ExpandedSection = "type" | "topics" | "locations" | "authors" | null;

export default function ResearchClient({ countryId }: { countryId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const allItems = useMemo(() => getResearchItems(), []);
  const defaultLocations = useMemo(() => [countryId, "global"], [countryId]);

  // Filter state
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
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [usStatesExpanded, setUsStatesExpanded] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedTypes.length) params.set("types", selectedTypes.join(","));
    if (selectedTopics.length) params.set("topics", selectedTopics.join(","));
    const sortedDefault = [...defaultLocations].sort().join(",");
    const sortedCurrent = [...selectedLocations].sort().join(",");
    if (sortedCurrent !== sortedDefault) {
      params.set("locations", selectedLocations.join(","));
    }
    if (selectedAuthors.length) {
      params.set("authors", selectedAuthors.join(","));
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [
    searchQuery,
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    defaultLocations,
    pathname,
    router,
  ]);

  // Memoize Fuse instance — only re-create when the full item list changes
  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ["title", "description"],
        threshold: 0.3,
      }),
    [allItems],
  );

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = allItems;

    if (selectedTypes.length > 0) {
      items = items.filter((item) => {
        const itemType = item.isApp ? "interactive" : "article";
        return selectedTypes.includes(itemType);
      });
    }
    if (selectedTopics.length > 0) {
      items = items.filter((item) =>
        selectedTopics.some((topic) => item.tags.includes(topic)),
      );
    }
    if (selectedLocations.length > 0) {
      items = items.filter((item) =>
        selectedLocations.some((loc) => item.tags.includes(loc)),
      );
    }
    if (selectedAuthors.length > 0) {
      items = items.filter((item) =>
        selectedAuthors.some((author) => item.authors.includes(author)),
      );
    }
    if (searchQuery.trim()) {
      items = fuse.search(searchQuery).map((r) => r.item);
    }
    return items;
  }, [
    allItems,
    fuse,
    selectedTypes,
    selectedTopics,
    selectedLocations,
    selectedAuthors,
    searchQuery,
  ]);

  const { visibleCount, sentinelRef, hasMore, reset } = useInfiniteScroll({
    totalCount: filteredItems.length,
    initialCount: 8,
    incrementCount: 8,
  });

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

  function toggleItem(
    item: string,
    selected: string[],
    onChange: (items: string[]) => void,
  ) {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  }

  const displayCategory = useDisplayCategory();
  const isDesktop = displayCategory === "desktop";

  return (
    <>
      {/* Hero */}
      <div
        style={{
          padding: `${spacing["4xl"]} ${spacing["2xl"]}`,
          background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: typography.fontSize["4xl"],
            fontWeight: typography.fontWeight.bold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.inverse,
            marginBottom: spacing.sm,
          }}
        >
          Research and analysis
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.body,
            color: colors.text.inverse,
            opacity: 0.8,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Explore our research on tax and benefit policy, including technical
          reports, policy analyses, and interactive tools.
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: spacing.xl,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            gap: spacing.xl,
          }}
        >
          {/* Sidebar filters */}
          <div
            style={{
              flex: isDesktop ? "0 0 250px" : "1",
              position: isDesktop ? "sticky" : "static",
              top: isDesktop ? "100px" : "auto",
              alignSelf: "flex-start",
            }}
          >
            {/* Search */}
            <div style={{ marginBottom: spacing.lg }}>
              <div style={{ position: "relative" }}>
                <IconSearch
                  size={16}
                  color={colors.text.tertiary}
                  style={{
                    position: "absolute",
                    left: spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: spacing["3xl"],
                    paddingRight: spacing.md,
                    paddingTop: spacing.sm,
                    paddingBottom: spacing.sm,
                    borderRadius: spacing.radius.feature,
                    border: `1px solid ${colors.border.light}`,
                    fontSize: typography.fontSize.sm,
                    fontFamily: typography.fontFamily.primary,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Filter sections */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm,
              }}
            >
              <FilterSection
                label="Type"
                isExpanded={expandedSection === "type"}
                onToggle={() =>
                  setExpandedSection(expandedSection === "type" ? null : "type")
                }
                count={selectedTypes.length}
              >
                {typeOptions.map((opt) => (
                  <CheckboxRow
                    key={opt.value}
                    label={opt.label}
                    checked={selectedTypes.includes(opt.value)}
                    onChange={() =>
                      toggleItem(opt.value, selectedTypes, setSelectedTypes)
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection
                label="Topic"
                isExpanded={expandedSection === "topics"}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === "topics" ? null : "topics",
                  )
                }
                count={selectedTopics.length}
              >
                {getTopicTags().map((tag) => (
                  <CheckboxRow
                    key={tag}
                    label={getTopicLabel(tag, countryId)}
                    checked={selectedTopics.includes(tag)}
                    onChange={() =>
                      toggleItem(tag, selectedTopics, setSelectedTopics)
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection
                label="Location"
                isExpanded={expandedSection === "locations"}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === "locations" ? null : "locations",
                  )
                }
                count={selectedLocations.length}
              >
                {getLocationTags()
                  .filter((tag) => !tag.startsWith("us-"))
                  .map((tag) => (
                    <div key={tag}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <CheckboxRow
                            label={locationLabels[tag] || tag}
                            checked={selectedLocations.includes(tag)}
                            onChange={() =>
                              toggleItem(
                                tag,
                                selectedLocations,
                                setSelectedLocations,
                              )
                            }
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
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: spacing.radius.element,
                              fontSize: typography.fontSize.xs,
                              color: colors.primary[600],
                              fontWeight: typography.fontWeight.medium,
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
                        label={locationLabels[tag] || tag}
                        checked={selectedLocations.includes(tag)}
                        onChange={() =>
                          toggleItem(
                            tag,
                            selectedLocations,
                            setSelectedLocations,
                          )
                        }
                        indented
                      />
                    ))}
              </FilterSection>

              <FilterSection
                label="Author"
                isExpanded={expandedSection === "authors"}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === "authors" ? null : "authors",
                  )
                }
                count={selectedAuthors.length}
              >
                {AUTHORS.map((author) => (
                  <CheckboxRow
                    key={author.key}
                    label={author.name}
                    checked={selectedAuthors.includes(author.key)}
                    onChange={() =>
                      toggleItem(
                        author.key,
                        selectedAuthors,
                        setSelectedAuthors,
                      )
                    }
                  />
                ))}
              </FilterSection>
            </div>
          </div>

          {/* Results */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.gray[500],
                marginBottom: spacing.md,
                fontFamily: typography.fontFamily.body,
              }}
            >
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "result" : "results"}
            </p>

            {filteredItems.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: spacing.lg,
                  }}
                >
                  {visibleItems.map((item) => (
                    <BlogPostCard
                      key={`${item.isApp ? "app" : "post"}-${item.slug}`}
                      item={item}
                      countryId={countryId}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div
                    ref={sentinelRef}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: spacing.xl,
                      color: colors.gray[400],
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    Loading more...
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: spacing["3xl"],
                  backgroundColor: colors.gray[50],
                  borderRadius: spacing.radius.feature,
                }}
              >
                <p
                  style={{
                    color: colors.gray[500],
                    fontFamily: typography.fontFamily.body,
                  }}
                >
                  No results found. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
