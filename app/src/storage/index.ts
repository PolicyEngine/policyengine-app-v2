// Database and types
export {
  db,
  _closeDb,
  _deleteDb,
  type Variable,
  type Parameter,
  type Dataset,
  type CacheMetadata,
} from "./metadataDb";

// Bulk loading
export {
  bulkLoadVariables,
  bulkLoadParameters,
  clearAndLoadVariables,
  clearAndLoadParameters,
  clearAndLoadDatasets,
} from "./metadataBulkLoader";

// Queries
export {
  getVariablesByVersion,
  getParametersByVersion,
  getAllVariables,
  getAllParameters,
  getAllDatasets,
  getVariableByName,
  getParameterByName,
  getCacheMetadata,
  setCacheMetadata,
} from "./metadataBulkLoader";

// Utilities
export {
  clearVersionData,
  clearAllStores,
  getStoreCounts,
} from "./metadataBulkLoader";

// Loaders (unified metadata loading)
export {
  loadMetadata,
  isMetadataCached,
  type Metadata,
  type MetadataLoadResult,
} from "./loaders";
