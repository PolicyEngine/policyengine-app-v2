/**
 * Base class for all ingredient models.
 *
 * Provides a common contract for serialization and equality comparison,
 * which React Query's custom structuralSharing functions use to
 * preserve referential stability.
 */
export abstract class BaseModel<TData> {
  /**
   * Serialize to a plain object for React Query cache storage,
   * API requests, or any context that needs JSON-compatible data.
   */
  abstract toJSON(): TData;

  /**
   * Compare two instances for value equality.
   * Used by custom structuralSharing functions to preserve
   * referential stability in React Query.
   */
  abstract isEqual(other: this): boolean;
}
