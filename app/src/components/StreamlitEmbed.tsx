import { useState, useEffect } from 'react';
import { Alert, Button, Group, Text, Box } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

interface StreamlitEmbedProps {
  embedUrl: string;
  directUrl: string;
  title: string;
  height?: string | number;
  width?: string | number;
}

export default function StreamlitEmbed({
  embedUrl,
  directUrl,
  title,
  height = "100%",
  width = "100%",
}: StreamlitEmbedProps) {
  const storageKey = `streamlit-notice-dismissed-${embedUrl}`;
  const [alertVisible, setAlertVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(storageKey);
    if (dismissed) {
      setAlertVisible(false);
    }
  }, [storageKey]);

  const handleAlertClose = () => {
    setAlertVisible(false);
    sessionStorage.setItem(storageKey, "true");
  };

  return (
    <Box h="100%" w="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      {alertVisible && (
        <Alert
          variant="light"
          color="blue"
          title="If the app is sleeping:"
          icon={<IconInfoCircle />}
          withCloseButton
          onClose={handleAlertClose}
          mb="xs"
        >
          <Group justify="space-between" align="center">
            <Text size="sm">
              Streamlit apps may go to sleep when inactive.
            </Text>
            <Button
              component="a"
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="outline"
            >
              Wake it up
            </Button>
          </Group>
        </Alert>
      )}
      <iframe
        src={embedUrl}
        title={title}
        height={height}
        width={width}
        style={{ border: 'none', flex: 1 }}
      />
    </Box>
  );
}
