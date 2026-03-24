export interface Citation {
  /** Headline or title of the citing article */
  title: string;
  /** Name of the outlet (e.g. "The New York Times") */
  outlet: string;
  /** Publication date in YYYY-MM-DD format */
  date: string;
  /** URL to the original article */
  url: string;
  /** Screenshot image filename in public/assets/citations/ */
  image: string;
  /** Tags for filtering (country + topic) */
  tags: string[];
  /** Whether to feature this citation prominently at the top */
  featured?: boolean;
}
