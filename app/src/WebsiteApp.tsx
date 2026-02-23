/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import './app.css';

import { QueryNormalizerProvider } from '@normy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from './contexts/AppContext';
import { store } from './store';
import { cacheMonitor } from './utils/cacheMonitor';
import { WebsiteRouter } from './WebsiteRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

// Initialize cache monitor
cacheMonitor.init(queryClient);

export default function WebsiteApp() {
  return (
    <AppProvider mode="website">
      <Provider store={store}>
        <QueryNormalizerProvider
          queryClient={queryClient}
          normalizerConfig={{
            devLogging: true,
          }}
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WebsiteRouter />
            </TooltipProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </QueryNormalizerProvider>
      </Provider>
    </AppProvider>
  );
}
