import { Fragment } from "react";
import type { OrganizationWithUse } from "@/data/organizations";

const externalLinkProps = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

/**
 * What goes before the source at `index`: "A and B" for two sources, and
 * "A; B; and C" for more, since a label can hold a comma of its own.
 */
function sourceSeparator(index: number, count: number): string {
  if (count === 2) {
    return " and ";
  }
  return index === count - 1 ? "; and " : "; ";
}

function OrganizationUseRow({
  organization,
}: {
  organization: OrganizationWithUse;
}) {
  const { name, link, use } = organization;

  return (
    <li className="tw:grid tw:gap-x-3xl tw:gap-y-sm tw:py-2xl tw:border-t tw:border-border-light tw:md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <h3 className="tw:text-lg tw:font-semibold tw:leading-snug">
        <a
          href={use.site ?? link}
          {...externalLinkProps}
          className="tw:text-gray-900 tw:no-underline tw:hover:text-text-link tw:hover:underline"
        >
          {name}
        </a>
      </h3>
      <div className="tw:max-w-[42rem]">
        <p className="tw:text-base tw:leading-relaxed tw:text-gray-800">
          {use.description}
        </p>
        <p className="tw:mt-sm tw:text-sm tw:text-gray-600">
          {use.sources.length > 1 ? "Sources" : "Source"}:{" "}
          {use.sources.map((source, index) => (
            <Fragment key={source.url}>
              {index > 0 && sourceSeparator(index, use.sources.length)}
              <a
                href={source.url}
                {...externalLinkProps}
                className="tw:text-text-link tw:underline tw:underline-offset-2 tw:hover:text-text-link-hover"
              >
                {source.label}
              </a>
            </Fragment>
          ))}
        </p>
      </div>
    </li>
  );
}

export interface OrganizationUseListProps {
  /** Unique within the page; ties the list to its heading. */
  id: string;
  title: string;
  organizations: OrganizationWithUse[];
}

/** One group on the users page: a heading and a row for each organization. */
export default function OrganizationUseList({
  id,
  title,
  organizations,
}: OrganizationUseListProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="tw:mb-4xl tw:last:mb-0">
      <h2
        id={headingId}
        className="tw:mb-lg tw:text-2xl tw:font-semibold tw:text-primary-800"
      >
        {title}
      </h2>
      <ul className="tw:m-0 tw:list-none tw:p-0 tw:border-b tw:border-border-light">
        {organizations.map((organization) => (
          <OrganizationUseRow
            key={organization.name}
            organization={organization}
          />
        ))}
      </ul>
    </section>
  );
}
