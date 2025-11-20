/**
 * IframeContent Component
 *
 * Basic iframe embed with loading and error states.
 * For advanced features like postMessage or Streamlit handling,
 * use AdvancedIframeContent or StreamlitEmbed respectively.
 */

import { useState } from 'react';
import { colors } from '@/designTokens';
import type { IframeContentProps } from '@/types/apps';

export default function IframeContent({
  url,
  title = 'Embedded content',
  height,
  width,
}: IframeContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const iframeHeight = height || 'calc(100vh - var(--header-height, 58px))';
  const iframeWidth = width || '100%';

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                border: `4px solid ${colors.gray[200]}`,
                borderTop: `4px solid ${colors.primary[600]}`,
                borderRadius: '50%',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: colors.gray[500], fontSize: '14px' }}>Loading calculator...</p>
          </div>
        </div>
      )}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            zIndex: 1,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              maxWidth: '500px',
            }}
          >
            <h2 style={{ color: colors.gray[900], marginBottom: '1rem' }}>Unable to load calculator</h2>
            <p style={{ color: colors.gray[500], marginBottom: '1rem' }}>
              The embedded calculator could not be loaded. You can try opening it directly:
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: colors.primary[600],
                color: colors.white,
                textDecoration: 'none',
                borderRadius: '4px',
              }}
            >
              Open Calculator in New Tab
            </a>
          </div>
        </div>
      )}
      <iframe
        src={url}
        style={{
          width: iframeWidth,
          height: iframeHeight,
          border: 'none',
          display: 'block',
        }}
        title={title}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
