/**
 * AppPage Component
 *
 * Generic page for rendering any app from apps.json by slug.
 * Routes apps to appropriate embed component based on type.
 */

import { useLocation, useParams } from 'react-router-dom';
import IframeContent from '@/components/IframeContent';
import { OBBBAIframeContent, StreamlitEmbed } from '@/components/interactive';
import { apps } from '@/data/apps/appTransformers';

export default function AppPage() {
  const { slug, countryId } = useParams<{ slug: string; countryId: string }>();
  const location = useLocation();

  const app =
    apps.find((a) => a.slug === slug && a.countryId === countryId) ||
    apps.find((a) => a.slug === slug);

  if (!app) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>App not found</h1>
        <p>The app "{slug}" could not be found.</p>
      </div>
    );
  }

  // Route to appropriate component based on app type
  if (app.type === 'streamlit') {
    return (
      <StreamlitEmbed
        embedUrl={`${app.source}?embedded=true`}
        directUrl={app.source}
        title={app.title}
        iframeTitle={app.description}
      />
    );
  }

  if (app.type === 'obbba-iframe') {
    return <OBBBAIframeContent url={app.source} title={app.title} />;
  }

  // Forward hash fragment from the browser URL to the iframe (e.g. #NY)
  // Always inject country for non-US routes (needed for shared links)
  let iframeUrl: string;
  if (location.hash && countryId && countryId !== 'us') {
    const params = new URLSearchParams(location.hash.slice(1));
    params.set('country', countryId);
    iframeUrl = `${app.source}#${params.toString()}`;
  } else if (location.hash) {
    iframeUrl = `${app.source}${location.hash}`;
  } else if (countryId && countryId !== 'us') {
    iframeUrl = `${app.source}#country=${countryId}`;
  } else {
    iframeUrl = app.source;
  }

  // Default: standard iframe (for 'iframe' type and any other types)
  return <IframeContent url={iframeUrl} title={app.title} />;
}
