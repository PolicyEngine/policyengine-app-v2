/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { WebsiteRouter } from './WebsiteRouter';
import { policyEngineTheme } from './theme';

export default function WebsiteApp() {
  return (
    <MantineProvider theme={policyEngineTheme}>
      <WebsiteRouter />
    </MantineProvider>
  );
}
