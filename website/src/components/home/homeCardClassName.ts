import { cn } from "@/lib/utils";

/** The bordered, lifting card the homepage's tools and research sections use. */
export const homeCardClassName = cn(
  "tw:block tw:h-full tw:no-underline tw:text-inherit tw:group",
  "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
  "tw:transition-all tw:duration-300 tw:ease-out",
  "tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
  "tw:focus-visible:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-visible:outline-none",
);
