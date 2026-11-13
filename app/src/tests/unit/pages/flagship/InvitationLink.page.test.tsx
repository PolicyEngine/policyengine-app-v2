import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readPendingInvitationToken } from '@/libs/invitations/pendingInvitation';
import InvitationLinkPage from '@/pages/flagship/InvitationLink.page';
import { INVITATION_TOKEN } from '@/tests/fixtures/api/v2InvitationMocks';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('InvitationLinkPage', () => {
  test("given the email's link then the token is kept and the invitee goes on to the US accept page", () => {
    // Given
    window.history.replaceState(null, '', `/invitations/accept#token=${INVITATION_TOKEN}`);
    const continueTo = vi.fn();

    // When
    render(<InvitationLinkPage onContinue={continueTo} />);

    // Then
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
    expect(window.location.hash).toBe('');
    expect(continueTo).toHaveBeenCalledWith('/us/invitations/accept');
    expect(screen.getByText('Opening your invitation…')).toBeInTheDocument();
  });

  test('given storage is blocked then the page says so, keeps the token out of the address bar and stays', () => {
    // Given
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is blocked');
    });
    window.history.replaceState(null, '', `/invitations/accept#token=${INVITATION_TOKEN}`);
    const continueTo = vi.fn();

    // When
    render(<InvitationLinkPage onContinue={continueTo} />);

    // Then
    expect(
      screen.getByRole('heading', { name: 'This browser is not keeping site data' })
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(continueTo).not.toHaveBeenCalled();
  });
});
