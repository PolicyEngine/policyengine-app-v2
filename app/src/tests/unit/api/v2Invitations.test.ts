import { describe, expect, test } from 'vitest';
import {
  acceptInvitation,
  createInvitation,
  invitationRefusalCode,
  isEmailNotVerified,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '@/api/v2Invitations';
import { V2_MAX_PAGE_SIZE } from '@/api/v2UserClient';
import {
  acceptanceResponse,
  acceptRefusalResponse,
  ALAN_INVITATION,
  emailNotVerifiedResponse,
  GRACE_INVITATION,
  INVITATION_IDS,
  INVITATION_TOKEN,
} from '@/tests/fixtures/api/v2InvitationMocks';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  itemResponse,
  noContentResponse,
  pageResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2Invitations', () => {
  test('given open invitations then every page is read with the session token and the invitations returned', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockResolvedValueOnce(pageResponse([GRACE_INVITATION], { hasMore: true }))
      .mockResolvedValueOnce(pageResponse([ALAN_INVITATION], { offset: 1 }));

    // When
    const invitations = await listInvitations(context.client);

    // Then
    expect(invitations).toEqual([GRACE_INVITATION, ALAN_INVITATION]);
    const firstRequest = fetchCall(fetchMock, 0);
    expect([firstRequest.method, firstRequest.path, firstRequest.query]).toEqual([
      'GET',
      '/v2/admin/invitations',
      { offset: '0', limit: String(V2_MAX_PAGE_SIZE) },
    ]);
    expect(firstRequest.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(fetchCall(fetchMock, 1).query).toEqual({ offset: '1', limit: String(V2_MAX_PAGE_SIZE) });
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

  test('given an open invitation then resending posts to its resend route and returns it', async () => {
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

  test('given an open invitation then revoking deletes it', async () => {
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

  test('given a token and a country then acceptance posts only the token, with the country, and returns the new type', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(acceptanceResponse());

    // When
    const acceptance = await acceptInvitation(context.client, 'uk', INVITATION_TOKEN);

    // Then
    expect(acceptance).toEqual({
      user_type: 'author',
      previous_user_type: 'standard',
      type_changed: true,
    });
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query, request.body]).toEqual([
      'POST',
      '/v2/me/invitations/accept',
      { country_id: 'uk' },
      { token: INVITATION_TOKEN },
    ]);
  });

  test('given an unverified email then the acceptance error is recognised as email_not_verified', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(emailNotVerifiedResponse());

    // When
    const failure = await acceptInvitation(context.client, 'us', INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );

    // Then
    expect(isEmailNotVerified(failure)).toBe(true);
  });

  test('given a refusal with a code then its code is read, and other errors have none', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock
      .mockResolvedValueOnce(acceptRefusalResponse(409, 'inviter_not_admin'))
      .mockResolvedValueOnce(errorResponse(500, 'The operation could not be completed.'));

    // When
    const refusal = await acceptInvitation(context.client, 'us', INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );
    const failure = await acceptInvitation(context.client, 'us', INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );

    // Then
    expect(invitationRefusalCode(refusal)).toBe('inviter_not_admin');
    expect(isEmailNotVerified(refusal)).toBe(false);
    expect(invitationRefusalCode(failure)).toBeNull();
  });

  test('given a refusal with a code the contract does not list then it has no refusal code', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ status: 'error', message: 'Refused.', code: 'a_newer_reason' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    // When
    const refusal = await acceptInvitation(context.client, 'us', INVITATION_TOKEN).catch(
      (caught: unknown) => caught
    );

    // Then
    expect(invitationRefusalCode(refusal)).toBeNull();
  });
});
