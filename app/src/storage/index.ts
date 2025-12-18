// Database and types
export {
  db,
  _closeDb,
  _deleteDb,
  type Variable,
  type Parameter,
  type ParameterValue,
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
} from "./metadataBulkLoader";

// Queries
export {
  getVariablesByVersion,
  getParametersByVersion,
  getParameterValues,
  getAllVariables,
  getAllParameters,
  getAllParameterValues,
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
