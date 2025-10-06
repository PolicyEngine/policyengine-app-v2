import { useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
} from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';

interface ConvertAnonymousModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function ConvertAnonymousModal({
  opened,
  onClose,
}: ConvertAnonymousModalProps) {
  const { convertAnonymousToEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await convertAnonymousToEmail(email, password);
      onClose();
      setEmail('');
      setPassword('');
    } catch (error) {
      // Error handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create account">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Convert your anonymous session to a permanent account. Your library and data will
            be preserved.
          </Text>

          <TextInput
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" fullWidth loading={loading}>
            Create account
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
