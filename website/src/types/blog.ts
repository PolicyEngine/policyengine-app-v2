/**
 * Blog and research article type definitions.
 * Mirrors the Vite app's types for compatibility with posts.json and authors.json.
 */

export interface BlogPost {
  title: string;
  description: string;
  date: string;
  authors: string[];
  tags: string[];
  filename: string;
  image: string;
  slug: string;
  hideHeaderImage?: boolean;
  imageCredit?: string;
}

export interface Author {
  name: string;
  headshot: string;
  title: string;
  bio: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export type AuthorsCollection = Record<string, Author>;

export type NotebookCellType = "markdown" | "code";

export type NotebookOutputType =
  | "text/plain"
  | "application/vnd.plotly.v1+json"
  | "text/html"
  | "text/markdown"
  | "display_data"
  | "execute_result";

export interface NotebookOutput {
  output_type?: NotebookOutputType | string;
  data?: Record<string, unknown>;
  execution_count?: number | null;
  metadata?: Record<string, unknown>;
}

export interface NotebookCell {
  cell_type: NotebookCellType;
  source: string[];
  metadata?: {
    tags?: string[];
    [key: string]: unknown;
  };
  outputs?: NotebookOutput[];
  execution_count?: number | null;
}

export interface Notebook {
  cells: NotebookCell[];
  metadata?: {
    kernelspec?: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info?: {
      name: string;
      version?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  nbformat?: number;
  nbformat_minor?: number;
}

export type DisplayCategory = "mobile" | "tablet" | "desktop";
