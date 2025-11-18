/**
 * OBBBAEmbed Component
 *
 * Custom embed for OBBBA apps with postMessage support and
 * URL parameter synchronization.
 *
 * Ported from policyengine-app v1 OBBBAHouseholdExplorer.jsx and
 * AppPage.jsx OBBBA-specific logic.
 */

import { useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface OBBBAEmbedProps {
  url: string;
  title: string;
}

export default function OBBBAEmbed({ url, title }: OBBBAEmbedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize iframe origin for efficient message verification
  const iframeOrigin = useMemo(() => new URL(url).origin, [url]);

  // Get current URL parameters to forward to iframe
  const urlParams = new URLSearchParams(location.search);

  // Construct iframe URL with forwarded parameters
  const iframeUrl = urlParams.toString()
    ? `${url}?${urlParams.toString()}`
    : url;

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our iframe
      if (event.origin !== iframeOrigin) return;

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
  }, [navigate, location.pathname, iframeOrigin]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title={title}
        style={{
          width: '100%',
          height: 'calc(100vh - var(--header-height, 64px))',
          border: 'none',
          overflow: 'hidden',
        }}
        allow="clipboard-write"
      />
    </div>
  );
}
