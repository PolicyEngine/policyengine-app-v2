/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 *
 * Note: This app does NOT use Redux or React Query.
 * It's a simple static site with minimal state management.
 */
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { policyEngineTheme } from './theme';
import { WebsiteRouter } from './Router';

export default function App() {
  return (
    <MantineProvider theme={policyEngineTheme}>
      <WebsiteRouter />
    </MantineProvider>
  );
}
