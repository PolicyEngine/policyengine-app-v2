import { useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Divider,
  Group,
} from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AuthModal({ opened, onClose }: AuthModalProps) {
  const { signIn, signUp, signInAnonymously, user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
    } catch (error) {
      // Error handled by auth context
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously();
      onClose();
    } catch (error) {
      // Error handled by auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={mode === 'signin' ? 'Sign in' : 'Sign up'}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
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
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>

          <Text size="sm" ta="center">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Anchor
              component="button"
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Anchor>
          </Text>

          <Divider label="OR" labelPosition="center" />

          <Button
            variant="light"
            fullWidth
            onClick={handleAnonymousSignIn}
            loading={loading}
          >
            Continue anonymously
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
