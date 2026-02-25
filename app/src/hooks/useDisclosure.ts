import { useCallback, useState } from 'react';

type DisclosureHandlers = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Custom hook for managing boolean disclosure state.
 * Drop-in replacement for @mantine/hooks useDisclosure.
 */
export function useDisclosure(initialState: boolean = false): [boolean, DisclosureHandlers] {
  const [opened, setOpened] = useState(initialState);

  const open = useCallback(() => setOpened(true), []);
  const close = useCallback(() => setOpened(false), []);
  const toggle = useCallback(() => setOpened((prev) => !prev), []);

  return [opened, { open, close, toggle }];
}
