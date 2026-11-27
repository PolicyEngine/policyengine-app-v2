import type { ParameterSearchFile, ParameterSearchFileParameter } from '@/api/publicApi/searchFile';
import {
  buildConceptAliases,
  buildConceptClusters,
  buildParameterSearchEntries,
  buildStateNames,
  createParameterSearchIndex,
  type ParameterSearchEntry,
  type ParameterSearchIndex,
} from '@/libs/parameterSearch';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * v3's parameter search on the v2 routes: the search file of the catalog
 * version, turned into the collection v3's existing search builders read
 * (`libs/parameterSearch`, unchanged), so the same entries, clusters,
 * aliases and index come out as from v1's whole metadata.
 *
 * The collection holds labels, units and descriptions only: values are not
 * in the file and load on demand. Which parameters a draft can take comes
 * from the file's `editable` and `editable_changes`, for a given date.
 */

/**
 * v1's label for a parameter or node without one: "bracket N" for a
 * bracket, otherwise the last part of its path with spaces for underscores.
 */
export function v1FallbackLabel(path: string): string {
  const bracket = /\[(\d+)\]$/.exec(path);
  if (bracket) {
    return `bracket ${Number(bracket[1]) + 1}`;
  }
  return (path.split('.').pop() ?? path).replaceAll('_', ' ');
}

/** Every node above `path`: `a.b[0].c` has `a`, `a.b`, `a.b[0]`. */
function ancestorPaths(path: string): string[] {
  const ancestors: string[] = [];
  for (let index = 1; index < path.length; index += 1) {
    if (path[index] === '.' || path[index] === '[') {
      ancestors.push(path.slice(0, index));
    }
  }
  return ancestors;
}

/**
 * The search file as a parameter collection: each parameter a reform can
 * change (economy and household set, as the file lists only those), each
 * parameter a reform cannot change (flags off, so search leaves it out but
 * its label still feeds concept clusters and aliases), every labelled node,
 * and every unlabelled node above a parameter with v1's fallback label, as
 * v1's metadata listed every node.
 */
export function searchCollectionFromFile(file: ParameterSearchFile): ParameterMetadataCollection {
  const collection: ParameterMetadataCollection = {};
  for (const node of file.nodes) {
    collection[node.path] = { type: 'parameterNode', parameter: node.path, label: node.label };
  }
  for (const parameter of file.parameters) {
    collection[parameter.path] = {
      type: 'parameter',
      parameter: parameter.path,
      label: parameter.label ?? v1FallbackLabel(parameter.path),
      unit: parameter.unit,
      description: parameter.description,
      economy: true,
      household: true,
    };
  }
  for (const parameter of file.other_parameters) {
    collection[parameter.path] = {
      type: 'parameter',
      parameter: parameter.path,
      label: parameter.label ?? v1FallbackLabel(parameter.path),
      economy: false,
      household: false,
    };
  }
  for (const path of Object.keys(collection)) {
    for (const ancestor of ancestorPaths(path)) {
      if (!collection[ancestor]) {
        collection[ancestor] = {
          type: 'parameterNode',
          parameter: ancestor,
          label: v1FallbackLabel(ancestor),
        };
      }
    }
  }
  return collection;
}

/** Whether a draft can edit the parameter's current-law value on `date` (YYYY-MM-DD). */
export function editableOn(parameter: ParameterSearchFileParameter, date: string): boolean {
  let editable = parameter.editable;
  const changes = [...(parameter.editable_changes ?? [])].sort((first, second) =>
    first.start_date.localeCompare(second.start_date)
  );
  for (const change of changes) {
    if (change.start_date.slice(0, 10) <= date) {
      editable = change.editable;
    }
  }
  return editable;
}

/** What v3's search and draft editor read, built from one search file for one date. */
export interface V2SearchCatalog {
  /** Labels, units and descriptions of every parameter and node in the file. */
  collection: ParameterMetadataCollection;
  /** The parameters a draft can take on the date, as search entries. */
  entries: ParameterSearchEntry[];
  index: ParameterSearchIndex;
  entriesByPath: Map<string, ParameterSearchEntry>;
  addablePaths: Set<string>;
  clusters: string[][];
}

const catalogsByFile = new WeakMap<ParameterSearchFile, Map<string, V2SearchCatalog>>();

/** Today, as the date part of an ISO timestamp. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The search catalog for a file on a date, built once per file and date
 * (the file is large, so every reader shares one build).
 */
export function buildV2SearchCatalog(
  file: ParameterSearchFile,
  date: string = todayIsoDate()
): V2SearchCatalog {
  const byDate = catalogsByFile.get(file) ?? new Map<string, V2SearchCatalog>();
  catalogsByFile.set(file, byDate);
  const built = byDate.get(date);
  if (built) {
    return built;
  }

  const collection = searchCollectionFromFile(file);
  const editable = new Set(
    file.parameters.filter((parameter) => editableOn(parameter, date)).map((entry) => entry.path)
  );
  const entries = buildParameterSearchEntries(collection).filter((entry) =>
    editable.has(entry.path)
  );
  const clusters = buildConceptClusters(collection);
  const catalog: V2SearchCatalog = {
    collection,
    entries,
    index: createParameterSearchIndex(
      entries,
      clusters,
      buildConceptAliases(collection),
      buildStateNames(collection)
    ),
    entriesByPath: new Map(entries.map((entry) => [entry.path, entry])),
    addablePaths: new Set(entries.map((entry) => entry.path)),
    clusters,
  };
  byDate.set(date, catalog);
  return catalog;
}
