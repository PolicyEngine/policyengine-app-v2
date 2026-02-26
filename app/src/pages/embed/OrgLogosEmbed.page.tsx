/**
 * Embeddable OrgLogos page for use in iframes (e.g., blog posts)
 * Access at /:countryId/embed/org-logos
 */

import { Box } from '@mantine/core';
import OrgLogos from '@/components/home/OrgLogos';

export default function OrgLogosEmbedPage() {
  return (
    <Box
      style={{
        backgroundColor: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
      }}
    >
      <OrgLogos />
    </Box>
  );
}
