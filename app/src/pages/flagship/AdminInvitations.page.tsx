import AdminInvitations from '@/components/admin/AdminInvitations';
import AdminPage from '@/components/admin/AdminPage';

/**
 * The admin invitations page (`/{countryId}/admin/invitations`): admins
 * invite an email address to become an author or admin, and resend or
 * revoke open invitations. Everyone else, signed out included, gets a
 * not-found page once their type is known, and no admin route is called
 * for them (see `AdminPage`).
 */
export default function AdminInvitationsPage() {
  return (
    <AdminPage title="Invitations">
      <AdminInvitations />
    </AdminPage>
  );
}
