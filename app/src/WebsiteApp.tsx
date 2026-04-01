/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import './app.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import DevTools from '@/components/DevTools';
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

cacheMonitor.init(queryClient);

export default function WebsiteApp() {
  return (
    <AppProvider mode="website">
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WebsiteRouter />
          </TooltipProvider>
          <DevTools />
        </QueryClientProvider>
      </Provider>
    </AppProvider>
  );
}
