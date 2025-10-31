import { Box } from '@mantine/core';

interface APIPlaygroundProps {
  countryId: string;
}

export default function APIPlayground({ countryId }: APIPlaygroundProps) {
  const streamlitUrl = `https://policyengine-api-light.streamlit.app/?embedded=true&country_id=${countryId}`;

  return (
    <Box
      component="iframe"
      src={streamlitUrl}
      style={{
        width: '100%',
        height: '600px',
        border: 'none',
        borderRadius: '8px',
      }}
      title="API Playground"
    />
  );
}
