"use client";

import Link from "next/link";
import { Container, Group, Text } from "@/components/ui";
import OptimisedImage from "@/components/ui/OptimisedImage";
import { cn } from "@/lib/utils";
import { colors, spacing, typography } from "@/designTokens";
import {
  getResearchItems,
  type ResearchItem,
} from "@/data/posts/postTransformers";

const LEFT_COUNT = 2;
const RIGHT_COUNT = 3;
const TOTAL_ITEMS = LEFT_COUNT + RIGHT_COUNT;

function getItemImageUrl(item: ResearchItem): string {
  if (!item.image) {
    return "";
  }
  if (item.image.startsWith("http")) {
    return item.image;
  }
  return `/assets/posts/${item.image}`;
}

function formatItemDate(dateStr: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? `${dateStr}T12:00:00`
    : dateStr;
  return new Date(normalized).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getItemHref(item: ResearchItem, countryId: string): string {
  return item.isApp
    ? `/${item.countryId}/${item.slug}`
    : `/${countryId}/research/${item.slug}`;
}

// Apps are served via Vercel rewrites (reverse proxy), so they need a full
// document request — Next.js client navigation would hit a 404.
function CardLink({
  item,
  countryId,
  className,
  style,
  children,
}: {
  item: ResearchItem;
  countryId: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const href = getItemHref(item, countryId);
  if (item.isApp) {
    return (
      <a href={href} className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  PrimaryCard                                                        */
/* ------------------------------------------------------------------ */

interface PrimaryCardProps {
  item: ResearchItem;
  countryId: string;
  flex?: number;
}

function PrimaryCard({ item, countryId, flex }: PrimaryCardProps) {
  const imageUrl = getItemImageUrl(item);
  const date = formatItemDate(item.date);
  const cta = item.isApp ? "Open" : "Read more";

  return (
    <CardLink
      item={item}
      countryId={countryId}
      className="tw:block tw:no-underline tw:text-inherit tw:group"
      style={{ flex: flex ?? "none" }}
    >
      <div
        className={cn(
          "tw:flex tw:flex-col tw:h-full",
          "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
          "tw:transition-all tw:duration-300 tw:ease-out",
          "tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
          "tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none",
        )}
      >
        {imageUrl && (
          <div className="tw:min-h-[200px] tw:flex-1 tw:overflow-hidden tw:bg-gray-100">
            <OptimisedImage
              src={imageUrl}
              alt={item.title}
              width={640}
              className="tw:w-full tw:h-full tw:object-cover tw:block tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="tw:p-2xl tw:shrink-0">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-sm">
            {date}
          </p>

          <p className="tw:text-2xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-md">
            {item.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-relaxed tw:line-clamp-3">
            {item.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-lg tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            {cta} &rarr;
          </p>
        </div>
      </div>
    </CardLink>
  );
}

/* ------------------------------------------------------------------ */
/*  SecondaryCard                                                      */
/* ------------------------------------------------------------------ */

interface SecondaryCardProps {
  item: ResearchItem;
  countryId: string;
}

function SecondaryCard({ item, countryId }: SecondaryCardProps) {
  const imageUrl = getItemImageUrl(item);
  const date = formatItemDate(item.date);
  const cta = item.isApp ? "Open" : "Read";

  return (
    <CardLink
      item={item}
      countryId={countryId}
      className="tw:block tw:no-underline tw:text-inherit tw:h-full tw:group"
    >
      <div
        className={cn(
          "tw:flex tw:flex-col tw:h-full",
          "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
          "tw:transition-all tw:duration-300 tw:ease-out",
          "tw:hover:shadow-[0_6px_24px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
          "tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none",
        )}
      >
        {imageUrl && (
          <div className="tw:h-[180px] tw:overflow-hidden tw:bg-gray-100 tw:shrink-0">
            <OptimisedImage
              src={imageUrl}
              alt={item.title}
              width={640}
              className="tw:w-full tw:h-full tw:object-cover tw:block tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:flex-1 tw:p-lg">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-xs">
            {date}
          </p>

          <p className="tw:text-base tw:font-semibold tw:leading-snug tw:text-gray-900 tw:line-clamp-2 tw:mb-sm">
            {item.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-normal tw:line-clamp-2 tw:flex-1">
            {item.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-md tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            {cta} &rarr;
          </p>
        </div>
      </div>
    </CardLink>
  );
}

/* ------------------------------------------------------------------ */
/*  HomeBlogPreview                                                    */
/* ------------------------------------------------------------------ */

export default function HomeBlogPreview({ countryId }: { countryId: string }) {
  // Merged research feed: posts + apps with displayWithResearch, newest-first.
  // Filter by country tag so /us shows US-relevant items and /uk shows UK.
  const relevantItems = getResearchItems()
    .filter(
      (item) => item.tags.includes(countryId) || item.tags.includes("global"),
    )
    .slice(0, TOTAL_ITEMS);

  if (relevantItems.length === 0) {
    return null;
  }

  const leftItems = relevantItems.slice(0, LEFT_COUNT);
  const rightItems = relevantItems.slice(LEFT_COUNT, TOTAL_ITEMS);

  return (
    <div
      style={{
        backgroundColor: colors.gray[50],
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
      }}
    >
      <Container size="xl">
        {/* Section header */}
        <Group
          justify="space-between"
          align="baseline"
          style={{ marginBottom: spacing["3xl"] }}
        >
          <Text
            fw={typography.fontWeight.bold}
            style={{
              fontSize: typography.fontSize["3xl"],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Expert policy analysis
          </Text>

          <Link
            href={`/${countryId}/research`}
            style={{
              textDecoration: "none",
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all research &rarr;
          </Link>
        </Group>

        {/* Two-column layout: 2 left (stacked), 3 right (stacked) */}
        <div
          className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2"
          style={{ gap: spacing["2xl"] }}
        >
          {/* Left column: 2 items stacked, filling equal height */}
          <div className="tw:flex tw:flex-col" style={{ gap: spacing["2xl"] }}>
            {leftItems.map((item) => (
              <PrimaryCard
                key={`${item.isApp ? "app" : "post"}-${item.slug}`}
                item={item}
                countryId={countryId}
                flex={1}
              />
            ))}
          </div>

          {/* Right column: 3 smaller items stacked */}
          <div className="tw:flex tw:flex-col" style={{ gap: spacing["2xl"] }}>
            {rightItems.map((item) => (
              <SecondaryCard
                key={`${item.isApp ? "app" : "post"}-${item.slug}`}
                item={item}
                countryId={countryId}
              />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
