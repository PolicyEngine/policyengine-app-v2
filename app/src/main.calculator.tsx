/**
 * Entry point for Calculator app (app.policyengine.org)
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CalculatorApp from './CalculatorApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CalculatorApp />
  </StrictMode>
);
