/**
 * SimpleIframe Component
 *
 * Basic iframe embed for non-Streamlit apps that don't need
 * special handling (no sleep state, no postMessage).
 */

import { spacing } from '@policyengine/design-system';
import type { IframeContentProps } from '@/types/apps';

export default function SimpleIframe({
  url,
  title = 'Interactive App',
  height,
  width = '100%',
}: IframeContentProps) {
  const iframeHeight = height || `calc(100vh - ${spacing.appShell.header.height})`;
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <iframe
        src={url}
        title={title}
        style={{
          width,
          height: iframeHeight,
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}
