import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Alert, Box, Button, Group, Text } from '@mantine/core';

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
  height = '100%',
  width = '100%',
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
    sessionStorage.setItem(storageKey, 'true');
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
              This app may go to sleep when inactive (the below blue wake-up button will not
              work).
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
