/**
 * OBBBAIframeContent Component
 *
 * Specialized iframe embed for OBBBA apps with URL parameter forwarding and postMessage state sync.
 * Used for OBBBA apps that need bidirectional communication with the parent page.
 *
 * Features:
 * - Forward URL params from parent to iframe on load
 * - Listen for urlUpdate postMessage events from iframe
 * - Update parent URL when iframe sends state changes
 * - Origin validation for security
 */

import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { OBBBAIframeProps } from '@/types/apps';

export default function OBBBAIframeContent({
  url,
  title = 'Embedded content',
  height,
  width,
  forwardUrlParams = true,
  enablePostMessage = true,
  allowedOrigins,
}: OBBBAIframeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize iframe origin for efficient message verification
  const iframeOrigin = useMemo(() => {
    try {
      return new URL(url).origin;
    } catch {
      return '';
    }
  }, [url]);

  // Get current URL parameters to forward to iframe
  const urlParams = new URLSearchParams(location.search);

  // Construct iframe URL with forwarded parameters
  const iframeUrl = useMemo(() => {
    if (forwardUrlParams && urlParams.toString()) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${urlParams.toString()}`;
    }
    return url;
  }, [url, forwardUrlParams, urlParams]);

  // Listen for postMessage events from iframe
  useEffect(() => {
    if (!enablePostMessage) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Verify the message origin
      if (allowedOrigins) {
        if (!allowedOrigins.includes(event.origin)) {
          return;
        }
      } else if (event.origin !== iframeOrigin) {
        return;
      }

      // Handle URL update messages from the iframe
      if (event.data?.type === 'urlUpdate' && event.data?.params) {
        const newParams = new URLSearchParams(event.data.params);
        navigate(`${location.pathname}?${newParams.toString()}`, {
          replace: true,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, location.pathname, iframeOrigin, enablePostMessage, allowedOrigins]);

  // Calculate dimensions
  const iframeHeight = height || 'calc(100vh - var(--header-height, 58px))';
  const iframeWidth = width || '100%';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title={title}
        style={{
          width: iframeWidth,
          height: iframeHeight,
          border: 'none',
          overflow: 'hidden',
        }}
        allow="clipboard-write"
      />
    </div>
  );
}
