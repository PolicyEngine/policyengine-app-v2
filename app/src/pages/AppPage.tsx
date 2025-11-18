/**
 * AppPage Component
 *
 * Generic page for rendering any app from apps.json by slug.
 * Routes apps to appropriate embed component based on type.
 */

import { useParams } from 'react-router-dom';
import { apps } from '@/data/apps/appTransformers';
import StreamlitEmbed from '@/components/interactive/StreamlitEmbed';
import SimpleIframe from '@/components/interactive/SimpleIframe';
import OBBBAEmbed from '@/components/interactive/OBBBAEmbed';

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
        embedUrl={`${app.url}?embedded=true`}
        directUrl={app.url}
        title={app.title}
        iframeTitle={app.description}
      />
    );
  }

  if (app.type === 'custom') {
    // Currently only OBBBA apps use custom components
    if (app.component === 'OBBBAEmbed') {
      return <OBBBAEmbed url={app.url} title={app.title} />;
    }
  }

  // Default: simple iframe
  return <SimpleIframe url={app.url} title={app.title} />;
}
