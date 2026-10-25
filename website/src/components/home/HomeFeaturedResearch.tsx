import { colors, spacing } from "@/designTokens";
import {
  getFeaturedResearch,
  type FeaturedResearchItem,
} from "@/lib/featuredResearch";
import { homeCardClassName } from "./homeCardClassName";
import HomeSectionHeading from "./HomeSectionHeading";

// Each item is a separate zone, so its card is a plain <a>.
function ResearchCard({ item }: { item: FeaturedResearchItem }) {
  return (
    <a href={item.href} className={homeCardClassName}>
      <div className="tw:flex tw:flex-col tw:h-full">
        <div className="tw:relative tw:overflow-hidden tw:aspect-[16/9] tw:bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="tw:absolute tw:inset-0 tw:w-full tw:h-full tw:object-cover"
          />
        </div>
        <div className="tw:flex tw:flex-col tw:flex-1 tw:p-3xl">
          <p className="tw:text-2xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-md">
            {item.title}
          </p>
          <p className="tw:text-base tw:text-text-secondary tw:leading-relaxed tw:flex-1">
            {item.description}
          </p>
          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-lg tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            Explore &rarr;
          </p>
        </div>
      </div>
    </a>
  );
}

/** Interactive research pinned to the homepage (the US tracker and OBBBA explorer). */
export default function HomeFeaturedResearch({
  countryId,
}: {
  countryId: string;
}) {
  const items = getFeaturedResearch(countryId);
  if (items.length === 0) return null;

  return (
    <section
      style={{
        backgroundColor: colors.white,
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
      }}
    >
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: `0 ${spacing.xl}`,
        }}
      >
        <HomeSectionHeading title="Featured research" />
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2xl">
          {items.map((item) => (
            <ResearchCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
