/**
 * Calculator App (app.policyengine.org)
 * Interactive policy simulation and analysis
 */
import './app.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import DevTools from '@/components/DevTools';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CalculatorRouter } from './CalculatorRouter';
import { AppProvider } from './contexts/AppContext';
import { CalcOrchestratorProvider } from './contexts/CalcOrchestratorContext';
import { store } from './store';
import { cacheMonitor } from './utils/cacheMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

cacheMonitor.init(queryClient);

export default function CalculatorApp() {
  return (
    <AppProvider mode="calculator">
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <CalcOrchestratorProvider>
              <CalculatorRouter />
              <DevTools />
            </CalcOrchestratorProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </Provider>
    </AppProvider>
  );
}
