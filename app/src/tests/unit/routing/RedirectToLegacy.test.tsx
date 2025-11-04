import { screen, waitFor } from '@test-utils';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { render as testingLibraryRender } from '@testing-library/react';
import { policyEngineTheme } from '@/theme';
import { RedirectToLegacy } from '@/routing/RedirectToLegacy';

// Helper to render with a specific route
function renderWithRoute(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: <RedirectToLegacy />,
      },
    ],
    {
      initialEntries: [initialPath],
    }
  );

  return testingLibraryRender(
    <MantineProvider theme={policyEngineTheme} env="test">
      <RouterProvider router={router} />
    </MantineProvider>
  );
}

describe('RedirectToLegacy', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { ...originalLocation, href: '' };
    vi.useFakeTimers();
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    vi.restoreAllMocks();
  });

  test('given component renders then displays redirecting message', () => {
    renderWithRoute('/uk/research/test-post');

    expect(
      screen.getByText('Redirecting to our legacy website...')
    ).toBeInTheDocument();
    expect(
      screen.getByText('This page is still available on our previous version')
    ).toBeInTheDocument();
  });

  test('given different paths then displays message for research route', () => {
    renderWithRoute('/uk/research/test-post');

    expect(
      screen.getByText('Redirecting to our legacy website...')
    ).toBeInTheDocument();
  });

  test('given US calculator route then displays redirecting message', () => {
    renderWithRoute('/us/aca-calc');

    expect(
      screen.getByText('Redirecting to our legacy website...')
    ).toBeInTheDocument();
  });

  test('given UK-specific route then displays redirecting message', () => {
    renderWithRoute('/uk/cec');

    expect(
      screen.getByText('Redirecting to our legacy website...')
    ).toBeInTheDocument();
  });
});
