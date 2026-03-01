/**
 * StreamlitEmbed Component
 *
 * Reusable component for embedding Streamlit apps with sleep state handling.
 * Ported from policyengine-app v1.
 *
 * Note: Due to CORS restrictions, we cannot detect if a Streamlit app is sleeping
 * from the parent page. The notice is shown by default and users can dismiss it.
 */

import { useState } from 'react';
import { colors, spacing, typography } from '@/designTokens';
import type { StreamlitEmbedProps } from '@/types/apps';

export default function StreamlitEmbed({
  embedUrl,
  directUrl,
  title: _title,
  iframeTitle,
  height,
  width,
}: StreamlitEmbedProps) {
  // Generate a unique storage key for this app
  const storageKey = `streamlit-notice-dismissed-${embedUrl}`;

  // Check if user has previously dismissed this notice in this session
  const [alertVisible, setAlertVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return !sessionStorage.getItem(storageKey);
  });

  const handleAlertClose = () => {
    setAlertVisible(false);
    // Remember that user dismissed this notice for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  };

  // Calculate iframe dimensions
  const iframeWidth = width || '100%';
  const containerHeight = `calc(100vh - ${spacing.appShell.header.height})`;

  return (
    <div
      style={{
        position: 'relative',
        height: containerHeight,
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {alertVisible && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: colors.gray[100],
            borderBottom: `1px solid ${colors.gray[300]}`,
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: typography.fontSize.sm,
            color: colors.gray[600],
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.md,
            animation: 'fadeIn 0.3s ease-in',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <span>If the app is sleeping:</span>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.gray[300]}`,
                borderRadius: spacing.radius.element,
                padding: `2px ${spacing.md}`,
                fontSize: typography.fontSize.xs,
                color: colors.gray[600],
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary[500];
                e.currentTarget.style.color = colors.primary[500];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.gray[300];
                e.currentTarget.style.color = colors.gray[600];
              }}
            >
              Wake it up
            </a>
          </div>
          <button
            type="button"
            onClick={handleAlertClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.gray[500],
              cursor: 'pointer',
              fontSize: '16px',
              padding: `0 ${spacing.xs}`,
              lineHeight: '1',
            }}
            aria-label="Close notice"
          >
            ×
          </button>
        </div>
      )}

      <iframe
        src={embedUrl}
        title={iframeTitle}
        style={{
          width: iframeWidth,
          height: height || '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}
