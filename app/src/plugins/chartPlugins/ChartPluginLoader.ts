/**
 * Chart Plugin Loader
 *
 * Handles fetching chart plugins from GitHub repositories.
 * Fetches manifest.json and the main chart code file.
 */

import type {
  ChartPluginManifest,
  ChartPluginOfficialRegistry,
  ChartPluginRegistryEntry,
} from './types';

// Default registry location (can be customized)
const DEFAULT_REGISTRY_URL =
  '/chart-plugins-registry.json';

/**
 * Parse a GitHub URL into owner, repo, and optional path components.
 */
function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  ref: string;
  path: string;
} | null {
  // Match patterns like:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/tree/branch/path
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.*))?)?/
  );

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
    ref: match[3] || 'main',
    path: match[4] || '',
  };
}

/**
 * Build a raw GitHub content URL.
 */
function buildRawUrl(
  owner: string,
  repo: string,
  ref: string,
  filePath: string
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
}

/**
 * Loader for fetching chart plugins from GitHub.
 */
export class ChartPluginLoader {
  private registryUrl: string;

  constructor(registryUrl: string = DEFAULT_REGISTRY_URL) {
    this.registryUrl = registryUrl;
  }

  /**
   * Fetch the official registry of chart plugins.
   */
  async fetchRegistry(): Promise<ChartPluginOfficialRegistry> {
    const response = await fetch(this.registryUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch registry: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch a plugin manifest from a GitHub repository URL.
   */
  async fetchManifest(
    repoUrl: string,
    manifestPath: string = 'manifest.json',
    ref: string = 'main'
  ): Promise<ChartPluginManifest> {
    const parsed = parseGitHubUrl(repoUrl);

    if (!parsed) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    // Use provided ref or the one from URL
    const actualRef = ref || parsed.ref;
    const actualPath = parsed.path
      ? `${parsed.path}/${manifestPath}`
      : manifestPath;

    const rawUrl = buildRawUrl(parsed.owner, parsed.repo, actualRef, actualPath);
    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest from ${rawUrl}: ${response.status}`);
    }

    const manifest: ChartPluginManifest = await response.json();

    // Validate required fields
    if (!manifest.id || !manifest.name || !manifest.main) {
      throw new Error('Invalid manifest: missing required fields (id, name, main)');
    }

    if (!manifest.countries || !Array.isArray(manifest.countries)) {
      throw new Error('Invalid manifest: countries must be an array');
    }

    return manifest;
  }

  /**
   * Fetch the plugin code from a GitHub repository.
   */
  async fetchCode(
    repoUrl: string,
    codePath: string,
    ref: string = 'main'
  ): Promise<string> {
    const parsed = parseGitHubUrl(repoUrl);

    if (!parsed) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }

    const actualRef = ref || parsed.ref;
    const actualPath = parsed.path ? `${parsed.path}/${codePath}` : codePath;

    const rawUrl = buildRawUrl(parsed.owner, parsed.repo, actualRef, actualPath);
    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch code from ${rawUrl}: ${response.status}`);
    }

    return response.text();
  }

  /**
   * Fetch a complete plugin (manifest + code) from a registry entry.
   */
  async fetchFromRegistryEntry(
    entry: ChartPluginRegistryEntry
  ): Promise<{ manifest: ChartPluginManifest; code: string }> {
    const ref = entry.ref || 'main';
    const manifestPath = entry.manifestPath || 'manifest.json';

    // Fetch manifest first
    const manifest = await this.fetchManifest(entry.repository, manifestPath, ref);

    // Then fetch the code using the path from manifest
    const code = await this.fetchCode(entry.repository, manifest.main, ref);

    return { manifest, code };
  }

  /**
   * Fetch a complete plugin from a GitHub URL.
   * This is the main method for installing plugins from custom URLs.
   */
  async fetchFromUrl(
    repoUrl: string,
    options: { manifestPath?: string; ref?: string } = {}
  ): Promise<{ manifest: ChartPluginManifest; code: string }> {
    const { manifestPath = 'manifest.json', ref = 'main' } = options;

    // Fetch manifest
    const manifest = await this.fetchManifest(repoUrl, manifestPath, ref);

    // Fetch code
    const code = await this.fetchCode(repoUrl, manifest.main, ref);

    return { manifest, code };
  }

  /**
   * Check if an installed plugin has updates available.
   * Returns the new manifest if an update is available, null otherwise.
   */
  async checkForUpdates(
    repoUrl: string,
    currentVersion: string,
    options: { manifestPath?: string; ref?: string } = {}
  ): Promise<ChartPluginManifest | null> {
    try {
      const manifest = await this.fetchManifest(
        repoUrl,
        options.manifestPath,
        options.ref
      );

      // Simple version comparison (could be enhanced with semver)
      if (manifest.version !== currentVersion) {
        return manifest;
      }

      return null;
    } catch {
      // If we can't fetch, assume no update
      return null;
    }
  }
}

/**
 * Global chart plugin loader instance.
 */
export const chartPluginLoader = new ChartPluginLoader();
