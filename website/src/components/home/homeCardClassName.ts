import { cn } from "@/lib/utils";

/** The bordered, lifting card the homepage's tools and research sections use. */
export const homeCardClassName = cn(
  "tw:block tw:h-full tw:no-underline tw:text-inherit tw:group",
  "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
  // Only the hover lift animates; with transition-all the focus outline would
  // fade in from a dark 3px ring.
  "tw:transition-[box-shadow,translate] tw:duration-300 tw:ease-out",
  "tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
  // An outline, unlike a box-shadow ring, also shows in forced-colors mode.
  "tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-primary-500",
);
