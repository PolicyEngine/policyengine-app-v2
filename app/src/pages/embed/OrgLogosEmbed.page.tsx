/**
 * Embeddable OrgLogos page for use in iframes (e.g., blog posts)
 * Access at /:countryId/embed/org-logos
 */

import OrgLogos from '@/components/home/OrgLogos';

export default function OrgLogosEmbedPage() {
  return (
    <div
      className="tw:flex tw:items-center tw:justify-center"
      style={{
        backgroundColor: 'white',
        minHeight: '100vh',
        padding: 0,
        margin: 0,
      }}
    >
      <OrgLogos />
    </div>
  );
}
