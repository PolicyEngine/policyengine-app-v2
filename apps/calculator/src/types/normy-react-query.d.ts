declare module '@normy/react-query' {
  import { QueryClient } from '@tanstack/react-query';
  import { ReactNode } from 'react';

  export interface QueryNormalizerProviderProps {
    children: ReactNode;
    queryClient: QueryClient;
    normalizerConfig?: {
      getNormalizationObjectKey?: (obj: any) => string;
      devLogging?: boolean;
    };
    normalize?: boolean;
  }

  export function QueryNormalizerProvider(props: QueryNormalizerProviderProps): JSX.Element;

  export interface QueryNormalizer {
    setNormalizedData: (data: any) => void;
    getNormalizedData: (key: string) => any;
    getObjectById: (id: string) => any;
    getQueryFragment: (queryKey: any[], fragment: string[]) => any;
  }

  export function useQueryNormalizer(): QueryNormalizer;
}
