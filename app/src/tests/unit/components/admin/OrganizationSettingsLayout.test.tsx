import { render, screen, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import OrganizationSettingsLayout from '@/components/admin/OrganizationSettingsLayout';
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
import { signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

const PAGE_CONTENT = 'The page inside the layout';

function renderLayout({
  countryId = 'us',
  pathname = `/${countryId}/admin/users`,
}: { countryId?: CountryId; pathname?: string } = {}) {
  return render(
    <UserSessionProviders
      queryClient={createTestQueryClient()}
      session={{ auth: signedInAuthValue(), countryId, pathname }}
    >
      <OrganizationSettingsLayout>
        <p>{PAGE_CONTENT}</p>
      </OrganizationSettingsLayout>
      <MeStatusProbe />
    </UserSessionProviders>,
    countryId
  );
}

function organizationSidebar() {
  return screen.queryByRole('navigation', { name: 'My organization' });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('OrganizationSettingsLayout', () => {
  test.each<CountryId>(['us', 'uk'])(
    'given an admin in %s then the sidebar links to the users page, marked as the current page',
    async (countryId) => {
      // Given
      answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });

      // When
      renderLayout({ countryId });

      // Then
      const sidebar = await screen.findByRole('navigation', { name: 'My organization' });
      const usersLink = within(sidebar).getByRole('link', { name: 'Users' });
      expect(usersLink).toHaveAttribute('href', `/${countryId}/admin/users`);
      expect(usersLink).toHaveAttribute('aria-current', 'page');
      expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
    }
  );

  test('given an admin on another organization page then Users is not marked as the current page', async () => {
    // Given
    answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });

    // When
    renderLayout({ pathname: '/us/admin/users-archive' });

    // Then
    const sidebar = await screen.findByRole('navigation', { name: 'My organization' });
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
    expect(organizationSidebar()).not.toBeInTheDocument();
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
    expect(organizationSidebar()).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_CONTENT)).toBeInTheDocument();
  });
});
