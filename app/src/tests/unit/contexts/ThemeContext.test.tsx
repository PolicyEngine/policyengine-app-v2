import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

function ThemeProbe() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button type="button" onClick={toggleTheme}>
      {resolvedTheme}
    </button>
  );
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-pe-theme');
    document.documentElement.style.colorScheme = '';
  });

  test('given no saved preference then follows system dark mode', async () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.peTheme).toBe('dark');
      expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
    });
  });

  test('given dark mode then toggle stores a light preference', async () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await screen.findByRole('button', { name: 'dark' });
    fireEvent.click(screen.getByRole('button', { name: 'dark' }));

    await waitFor(() => {
      expect(document.documentElement.dataset.peTheme).toBe('light');
      expect(localStorage.getItem('policyengine-theme')).toBe('light');
    });
  });
});
