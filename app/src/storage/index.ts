// Database and types
export {
  db,
  _closeDb,
  _deleteDb,
  type Variable,
  type Parameter,
  type ParameterValue,
  type Dataset,
  type MetadataDescription,
} from "./metadataDb";

// Bulk loading
export {
  bulkLoadVariables,
  bulkLoadParameters,
  bulkLoadParameterValues,
  clearAndLoadVariables,
  clearAndLoadParameters,
  clearAndLoadParameterValues,
  clearAndLoadDatasets,
} from "./metadataBulkLoader";

// Queries
export {
  getVariablesByVersion,
  getParametersByVersion,
  getParameterValues,
  getAllVariables,
  getAllParameters,
  getAllParameterValues,
  getAllDatasets,
  getVariableByName,
  getParameterByName,
  getMetadataDescription,
  setMetadataDescription,
} from "./metadataBulkLoader";

// Utilities
export {
  clearVersionData,
  clearAllStores,
  getStoreCounts,
} from "./metadataBulkLoader";

// Loaders (tiered loading)
export {
  loadCoreMetadata,
  isCoreMetadataCached,
  loadParameters,
  isParametersCached,
  type CoreMetadata,
  type CoreMetadataLoadResult,
  type ParametersData,
  type ParametersLoadResult,
} from "./loaders";
