/**
 * SimpleIframe Component
 *
 * Basic iframe embed for non-Streamlit apps that don't need
 * special handling (no sleep state, no postMessage).
 */

import type { IframeContentProps } from '@/types/apps';

export default function SimpleIframe({
  url,
  title = 'Interactive App',
  height = 'calc(100vh - var(--header-height, 64px))',
  width = '100%',
}: IframeContentProps) {
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
          height,
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}
