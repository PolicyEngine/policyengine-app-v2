import { describe, expect, test } from 'vitest';
import {
  acceptInvitation,
  createInvitation,
  isEmailNotVerified,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '@/api/v2Invitations';
import { V2ApiError } from '@/api/v2UserClient';
import {
  ALAN_INVITATION,
  emailNotVerifiedResponse,
  GRACE_INVITATION,
  INVITATION_API_MESSAGES,
  INVITATION_IDS,
  INVITATION_TOKEN,
  meAfterAcceptance,
} from '@/tests/fixtures/api/v2InvitationMocks';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  itemResponse,
  mockMeItem,
  noContentResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2Invitations', () => {
  test('given pending invitations then the list is read with the session token and returned', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(okResponse({ items: [GRACE_INVITATION, ALAN_INVITATION] }));

    // When
    const invitations = await listInvitations(context.client);

    // Then
    expect(invitations).toEqual([GRACE_INVITATION, ALAN_INVITATION]);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query]).toEqual([
      'GET',
      '/v2/admin/invitations',
      {},
    ]);
    expect(request.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test('given an address and a type then the invitation is created with exactly those', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(GRACE_INVITATION, 201));

    // When
    const invitation = await createInvitation(context.client, {
      email: GRACE_INVITATION.email,
      userType: 'author',
    });

    // Then
    expect(invitation).toEqual(GRACE_INVITATION);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.body]).toEqual([
      'POST',
      '/v2/admin/invitations',
      { email: GRACE_INVITATION.email, user_type: 'author' },
    ]);
  });

  test('given a pending invitation then resending posts to its resend route and returns it', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(ALAN_INVITATION));

    // When
    const invitation = await resendInvitation(context.client, INVITATION_IDS.ALAN);

    // Then
    expect(invitation).toEqual(ALAN_INVITATION);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.body]).toEqual([
      'POST',
      `/v2/admin/invitations/${INVITATION_IDS.ALAN}/resend`,
      undefined,
    ]);
  });

  test('given a pending invitation then revoking deletes it', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    await revokeInvitation(context.client, INVITATION_IDS.GRACE);

    // Then
    const request = fetchCall(fetchMock);
    expect([request.method, request.path]).toEqual([
      'DELETE',
      `/v2/admin/invitations/${INVITATION_IDS.GRACE}`,
    ]);
  });

  test('given a token then acceptance posts only the token and returns the user and outcome', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const accepted = { item: meAfterAcceptance(mockMeItem), outcome: 'changed' };
    fetchMock.mockResolvedValue(okResponse(accepted));

    // When
    const result = await acceptInvitation(context.client, INVITATION_TOKEN);

    // Then
    expect(result).toEqual(accepted);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query, request.body]).toEqual([
      'POST',
      '/v2/me/invitations/accept',
      {},
      { token: INVITATION_TOKEN },
    ]);
  });

  test('given an unverified email then the acceptance error is recognised as email_not_verified', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(emailNotVerifiedResponse());

    // When
    const failure = await acceptInvitation(context.client, INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );

    // Then
    expect(isEmailNotVerified(failure)).toBe(true);
  });

  test('given another 409 then the acceptance error is not email_not_verified', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(errorResponse(409, INVITATION_API_MESSAGES.INVITER_NOT_ADMIN));

    // When
    const failure = await acceptInvitation(context.client, INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );

    // Then
    expect(failure).toBeInstanceOf(V2ApiError);
    expect(isEmailNotVerified(failure)).toBe(false);
  });
});
