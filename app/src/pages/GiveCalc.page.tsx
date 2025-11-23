import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Alert, Button, Group, Text } from '@mantine/core';
import IframeContent from '@/components/IframeContent';

export default function GiveCalcPage() {
  const storageKey = 'streamlit-notice-dismissed-givecalc';
  const [alertVisible, setAlertVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(storageKey);
    if (dismissed) {
      setAlertVisible(false);
    }
  }, []);

  const handleAlertClose = () => {
    setAlertVisible(false);
    sessionStorage.setItem(storageKey, 'true');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {alertVisible && (
        <Alert
          variant="light"
          color="blue"
          title="If the app is sleeping:"
          icon={<IconInfoCircle />}
          withCloseButton
          onClose={handleAlertClose}
          mb="xs"
          style={{ flexShrink: 0 }}
        >
          <Group justify="space-between" align="center">
            <Text size="sm">
              This app may go to sleep when inactive (the below blue wake-up button will not work).
            </Text>
            <Button
              component="a"
              href="https://givecalc.streamlit.app"
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <IframeContent url="https://givecalc.streamlit.app?embedded=true" title="GiveCalc" />
      </div>
    </div>
  );
}
