/**
 * Website App (policyengine.org)
 * Homepage, blog, team, and embedded calculators
 */
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { policyEngineTheme } from './theme';
import { WebsiteRouter } from './WebsiteRouter';

export default function WebsiteApp() {
  return (
    <MantineProvider theme={policyEngineTheme}>
      <WebsiteRouter />
    </MantineProvider>
  );
}
