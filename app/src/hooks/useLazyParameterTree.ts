/**
 * Hook for lazy parameter tree access with caching.
 *
 * Usage:
 *   const { getChildren, hasChildren } = useLazyParameterTree();
 *   const govChildren = getChildren('gov');
 *   const taxChildren = getChildren('gov.tax');
 */

import { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  createParameterTreeCache,
  getChildrenForPath,
  hasChildren as checkHasChildren,
  LazyParameterTreeNode,
  ParameterTreeCache,
} from '@/libs/lazyParameterTree';
import { RootState } from '@/store';

interface UseLazyParameterTreeResult {
  /** Get children for a path (cached after first call) */
  getChildren: (path: string) => LazyParameterTreeNode[];
  /** Check if a path has children */
  hasChildren: (path: string) => boolean;
  /** Whether parameters are still loading */
  loading: boolean;
  /** Any error from loading parameters */
  error: string | null;
}

/**
 * Hook for on-demand parameter tree building with caching.
 *
 * The cache persists for the lifetime of the component.
 * Each path's children are built only once, on first access.
 */
export function useLazyParameterTree(): UseLazyParameterTreeResult {
  const { parameters, loading, error } = useSelector((state: RootState) => state.metadata);
  const cacheRef = useRef<ParameterTreeCache>(createParameterTreeCache());

  const getChildren = useCallback(
    (path: string): LazyParameterTreeNode[] => {
      if (!parameters || Object.keys(parameters).length === 0) {
        return [];
      }
      return getChildrenForPath(parameters, path, cacheRef.current);
    },
    [parameters]
  );

  const hasChildren = useCallback(
    (path: string): boolean => {
      if (!parameters || Object.keys(parameters).length === 0) {
        return false;
      }
      return checkHasChildren(parameters, path);
    },
    [parameters]
  );

  return {
    getChildren,
    hasChildren,
    loading,
    error,
  };
}
