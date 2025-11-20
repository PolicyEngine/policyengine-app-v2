/**
 * AppPage Component
 *
 * Generic page for rendering any app from apps.json by slug.
 * Routes apps to appropriate embed component based on type.
 */

import { useParams } from 'react-router-dom';
import { apps } from '@/data/apps/appTransformers';
import { StreamlitEmbed, OBBBAIframeContent } from '@/components/interactive';
import IframeContent from '@/components/IframeContent';

export default function AppPage() {
  const { slug } = useParams<{ slug: string }>();

  const app = apps.find((a) => a.slug === slug);

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

  if (app.type === 'applet') {
    return <IframeContent url={app.source} title={app.title} />;
  }

  // Default: standard iframe (for 'iframe' type)
  return <IframeContent url={app.source} title={app.title} />;
}
