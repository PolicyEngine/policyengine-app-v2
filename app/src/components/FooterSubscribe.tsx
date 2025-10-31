import { useState } from 'react';
import { Button, Stack, Text, TextInput } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export default function FooterSubscribe() {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    // Functionality to handle subscription to be added
    // alert(`Subscribe button clicked with email: ${email}`);
  };

  return (
    <Stack gap="xs" pl="2xl">
      <Text fw={600} fz="h2" c={colors.white} ff={typography.fontFamily.primary}>
        Subscribe to PolicyEngine
      </Text>
      <Text fz="h5" c={colors.white} ff={typography.fontFamily.primary}>
        Get the latest posts delivered right to your inbox.
      </Text>
      <Stack gap="sm" w="80%" mt="20px">
        <TextInput
          placeholder="Enter your email address"
          size="md"
          ff={typography.fontFamily.primary}
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          styles={{
            input: { backgroundColor: colors.white, flex: 1 },
          }}
        />
        <Button
          color={colors.primary[500]}
          size="md"
          ff={typography.fontFamily.primary}
          onClick={handleSubscribe}
        >
          SUBSCRIBE
        </Button>
      </Stack>
    </Stack>
  );
}
