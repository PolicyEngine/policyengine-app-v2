import type { StreamlitEmbedProps } from '@/types/apps';

export const TEST_STREAMLIT_EMBED_URL = 'https://test-app.streamlit.app/?embedded=true';
export const TEST_STREAMLIT_DIRECT_URL = 'https://test-app.streamlit.app';
export const TEST_IFRAME_TITLE = 'Test Streamlit Application';

export const MOCK_STREAMLIT_PROPS: StreamlitEmbedProps = {
  embedUrl: TEST_STREAMLIT_EMBED_URL,
  directUrl: TEST_STREAMLIT_DIRECT_URL,
  title: 'Test App',
  iframeTitle: TEST_IFRAME_TITLE,
};

export const MOCK_STREAMLIT_PROPS_WITH_DIMENSIONS: StreamlitEmbedProps = {
  ...MOCK_STREAMLIT_PROPS,
  height: '600px',
  width: '800px',
};

export const MOCK_SESSION_STORAGE_KEY = `streamlit-notice-dismissed-${TEST_STREAMLIT_EMBED_URL}`;
