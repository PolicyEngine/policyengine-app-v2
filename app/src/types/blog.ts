/**
 * Blog and Research Article Type Definitions
 *
 * These types mirror the structure from the old policyengine-app
 * to ensure compatibility with existing posts.json and authors.json data.
 */

/**
 * Represents a single blog post/research article entry
 */
export interface BlogPost {
  /** Post title */
  title: string;

  /** Brief description/summary of the post */
  description: string;

  /** Publication date in format "YYYY-MM-DD HH:MM:SS" */
  date: string;

  /** Array of author IDs (keys in authors.json) */
  authors: string[];

  /** Array of tags (topics and locations) */
  tags: string[];

  /** Filename of the markdown or notebook file */
  filename: string;

  /** Filename of the cover image */
  image: string;

  /** URL-friendly slug generated from filename or title */
  slug: string;

  /** Whether to hide the header image on the article page (image still shows in cards) */
  hideHeaderImage?: boolean;
}

/**
 * Represents an author profile
 */
export interface Author {
  /** Author's full name */
  name: string;

  /** Filename of author's headshot image */
  headshot: string;

  /** Job title/position */
  title: string;

  /** Author biography */
  bio: string;

  /** Email address (optional) */
  email?: string;

  /** Twitter/X handle (optional) */
  twitter?: string;

  /** LinkedIn profile URL (optional) */
  linkedin?: string;

  /** GitHub username (optional) */
  github?: string;
}

/**
 * Record of all authors, keyed by author ID
 */
export type AuthorsCollection = Record<string, Author>;

/**
 * Jupyter notebook cell types
 */
export type NotebookCellType = 'markdown' | 'code';

/**
 * Jupyter notebook output types
 */
export type NotebookOutputType =
  | 'text/plain'
  | 'application/vnd.plotly.v1+json'
  | 'text/html'
  | 'text/markdown'
  | 'display_data'
  | 'execute_result';

/**
 * Represents a single output from a notebook cell
 */
export interface NotebookOutput {
  /** Type of output */
  output_type?: NotebookOutputType | string;

  /** Output data, keyed by MIME type */
  data?: Record<string, any>;

  /** Execution count (for code cells) */
  execution_count?: number | null;

  /** Metadata for the output */
  metadata?: Record<string, any>;
}

/**
 * Represents a single cell in a Jupyter notebook
 */
export interface NotebookCell {
  /** Type of cell */
  cell_type: NotebookCellType;

  /** Cell source code/markdown as array of strings */
  source: string[];

  /** Cell metadata (may include tags) */
  metadata?: {
    /** Tags for special rendering (e.g., "highlighted-left") */
    tags?: string[];
    /** Other metadata */
    [key: string]: any;
  };

  /** Cell outputs (for code cells) */
  outputs?: NotebookOutput[];

  /** Execution count (for code cells) */
  execution_count?: number | null;
}

/**
 * Represents a complete Jupyter notebook
 */
export interface Notebook {
  /** Array of notebook cells */
  cells: NotebookCell[];

  /** Notebook metadata */
  metadata?: {
    /** Kernel information */
    kernelspec?: {
      display_name: string;
      language: string;
      name: string;
    };
    /** Language information */
    language_info?: {
      name: string;
      version?: string;
      [key: string]: any;
    };
    /** Other metadata */
    [key: string]: any;
  };

  /** Notebook format version */
  nbformat?: number;
  nbformat_minor?: number;
}

/**
 * Display category for responsive design
 */
export type DisplayCategory = 'mobile' | 'tablet' | 'desktop';

/**
 * Tag type categorization
 */
export type TagType = 'location' | 'topic';

/**
 * Props for markdown formatter component
 */
export interface MarkdownFormatterProps {
  /** Markdown content to render */
  markdown: string;

  /** Optional display category for responsive rendering */
  displayCategory?: DisplayCategory;
}

/**
 * Props for blog post page
 */
export interface BlogPostPageProps {
  /** Post slug from URL params */
  postSlug?: string;
}

/**
 * Props for research/blog index page
 */
export interface ResearchPageProps {
  /** Initial search query (optional) */
  initialQuery?: string;
}

/**
 * Search and filter state for blog posts
 */
export interface BlogSearchState {
  /** Current search query */
  query: string;

  /** Selected topic tags */
  selectedTopics: string[];

  /** Selected location tags */
  selectedLocations: string[];

  /** Selected author IDs */
  selectedAuthors: string[];
}

/**
 * Blog preview component variants
 */
export type BlogPreviewVariant = 'featured' | 'medium' | 'small';

/**
 * Props for blog preview components
 */
export interface BlogPreviewProps {
  /** Blog post to display */
  blog: BlogPost;

  /** Preview variant/size */
  variant?: BlogPreviewVariant;

  /** Country ID for URL generation */
  countryId?: string;
}

/**
 * Plotly chart data structure (simplified)
 */
export interface PlotlyData {
  data: any[];
  layout?: {
    title?: {
      text?: string;
    };
    width?: number | string;
    height?: number | string;
    [key: string]: any;
  };
  config?: Record<string, any>;
}

/**
 * Props for notebook cell renderer
 */
export interface NotebookCellProps {
  /** Notebook cell data */
  data: NotebookCell;

  /** Display category for responsive rendering */
  displayCategory?: DisplayCategory;
}

/**
 * Tag label mappings
 */
export interface TagLabels {
  [tagKey: string]: string;
}

/**
 * Transformed/processed posts data
 */
export interface ProcessedBlogData {
  /** Sorted array of all posts */
  posts: BlogPost[];

  /** Unique topic tags */
  topicTags: string[];

  /** Unique location tags */
  locationTags: string[];

  /** Display labels for topics */
  topicLabels: TagLabels;

  /** Display labels for locations */
  locationLabels: TagLabels;
}

/**
 * Unified item for research listing (posts + apps with displayWithResearch)
 */
export interface ResearchItem {
  /** Item title */
  title: string;

  /** Brief description */
  description: string;

  /** Publication/release date */
  date: string;

  /** Author IDs */
  authors: string[];

  /** Tags for filtering */
  tags: string[];

  /** Cover image filename */
  image: string;

  /** URL slug */
  slug: string;

  /** Whether this is an app (vs blog post) */
  isApp: boolean;

  /** Country ID for routing */
  countryId: string;
}
