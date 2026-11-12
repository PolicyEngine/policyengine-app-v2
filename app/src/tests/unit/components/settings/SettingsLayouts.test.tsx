import { useState, type ReactNode } from 'react';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AccountSettingsLayout from '@/components/settings/AccountSettingsLayout';
import AdminSettingsLayout from '@/components/settings/AdminSettingsLayout';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { CountryId } from '@/libs/countries';
import {
  answerMe,
  deferredResponse,
  itemResponse,
  meItemOfType,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  MeStatusProbe,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

const PAGE_CONTENT = 'The page inside the layout';

type SettingsLayout = typeof AccountSettingsLayout;

function renderLayout({
  Layout = AdminSettingsLayout,
  auth = signedInAuthValue(),
  countryId = 'us',
  pathname = `/${countryId}/admin/users`,
  page = <p>{PAGE_CONTENT}</p>,
}: {
  Layout?: SettingsLayout;
  auth?: AuthContextValue;
  countryId?: CountryId;
  pathname?: string;
  page?: ReactNode;
} = {}) {
  return render(
    <UserSessionProviders
      queryClient={createTestQueryClient()}
      session={{ auth, countryId, pathname }}
    >
      <Layout>{page}</Layout>
      <MeStatusProbe />
    </UserSessionProviders>,
    countryId
  );
}

/** A page with its own state, which it loses if it is mounted again. */
function PageWithState() {
  const [clicks, setClicks] = useState(0);
  return (
    <button type="button" onClick={() => setClicks(clicks + 1)}>
      Clicked {clicks} times
    </button>
  );
}

function sidebarNamed(name: string) {
  return screen.queryByRole('navigation', { name });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('AdminSettingsLayout', () => {
  test.each<CountryId>(['us', 'uk'])(
    'given an admin in %s then the Admin sidebar links to the users page, marked as the current page',
    async (countryId) => {
      // Given
      answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });

      // When
      renderLayout({ countryId });

      // Then
      const sidebar = await screen.findByRole('navigation', { name: 'Admin' });
      const usersLink = within(sidebar).getByRole('link', { name: 'Users' });
      expect(usersLink).toHaveAttribute('href', `/${countryId}/admin/users`);
      expect(usersLink).toHaveAttribute('aria-current', 'page');
      expect(within(sidebar).getAllByRole('link')).toHaveLength(1);
      expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
    }
  );

  test('given an admin on another admin page then Users is not marked as the current page', async () => {
    // Given
    answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });

    // When
    renderLayout({ pathname: '/us/admin/users-archive' });

    // Then
    const sidebar = await screen.findByRole('navigation', { name: 'Admin' });
    expect(within(sidebar).getByRole('link', { name: 'Users' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  test('given a standard user then the page shows without the sidebar', async () => {
    // Given
    answerMe(fetchMock);

    // When
    renderLayout();
    await screen.findByText('/v2/me status: success');

    // Then
    expect(sidebarNamed('Admin')).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
  });

  test('given the user type is not known yet then the page shows without the sidebar', async () => {
    // Given
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });

    // When
    renderLayout();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Then
    expect(screen.getByText('/v2/me status: pending')).toBeInTheDocument();
    expect(sidebarNamed('Admin')).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
  });

  test('given the sidebar appears once /v2/me answers then the page keeps its state', async () => {
    // Given
    const user = userEvent.setup();
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });
    renderLayout({ page: <PageWithState /> });
    await user.click(screen.getByRole('button', { name: 'Clicked 0 times' }));

    // When
    pendingMe.answer(itemResponse(meItemOfType('admin')));

    // Then
    expect(await screen.findByRole('navigation', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clicked 1 times' })).toBeInTheDocument();
  });
});

describe('AccountSettingsLayout', () => {
  test.each<CountryId>(['us', 'uk'])(
    'given the account page in %s then the My account sidebar has only General, marked as the current page',
    async (countryId) => {
      // Given
      answerMe(fetchMock);

      // When
      renderLayout({ Layout: AccountSettingsLayout, countryId, pathname: `/${countryId}/account` });

      // Then
      const sidebar = screen.getByRole('navigation', { name: 'My account' });
      const generalLink = within(sidebar).getByRole('link', { name: 'General' });
      expect(generalLink).toHaveAttribute('href', `/${countryId}/account`);
      expect(generalLink).toHaveAttribute('aria-current', 'page');
      expect(within(sidebar).getAllByRole('link')).toHaveLength(1);
      expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
    }
  );

  test('given a signed-out visitor then the account page still has its sidebar', () => {
    // When
    renderLayout({
      Layout: AccountSettingsLayout,
      auth: makeAuthValue(),
      pathname: '/us/account',
    });

    // Then
    expect(sidebarNamed('My account')).toBeInTheDocument();
    expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
