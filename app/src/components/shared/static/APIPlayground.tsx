import { Box } from '@mantine/core';
import { spacing } from '@/designTokens';

interface APIPlaygroundProps {
  countryId: string;
}

export default function APIPlayground({ countryId }: APIPlaygroundProps) {
  const streamlitUrl = `https://policyengine-policyengine-api-demo-app-xy5rgn.streamlit.app/?embed=true&embed_options=light_theme&embed_options=hide_footer&mode=${countryId}`;

  return (
    <Box
      component="iframe"
      src={streamlitUrl}
      style={{
        width: '100%',
        height: '600px',
        border: 'none',
        borderRadius: spacing.radius.lg,
      }}
      title="API Playground"
    />
  );
}
