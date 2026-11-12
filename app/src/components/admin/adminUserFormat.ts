import type { AdminUserItem, SignedInUserType } from '@/api/v2AdminUsers';
import type { CountryId } from '@/libs/countries';
import { formatDate } from '@/utils/dateUtils';

/** The types an admin can give a user, from fewest permissions to most. */
export const SIGNED_IN_USER_TYPES: readonly SignedInUserType[] = ['standard', 'author', 'admin'];

export const USER_TYPE_LABELS: Record<SignedInUserType, string> = {
  standard: 'Standard',
  author: 'Author',
  admin: 'Admin',
};

/** The user's first and last names, or null when the user has neither. */
export function adminUserName(
  user: Pick<AdminUserItem, 'first_name' | 'last_name'>
): string | null {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return name || null;
}

/** The user's email, or its ID for a user with no email. */
export function adminUserLabel(user: Pick<AdminUserItem, 'email' | 'id'>): string {
  return user.email ?? user.id;
}

export function formatAdminDate(isoDate: string, countryId: CountryId): string {
  return formatDate(isoDate, 'short-month-day-year', countryId);
}

/** A date and time in UTC, such as "Oct 12, 2026, 11:00 AM UTC". */
export function formatAdminDateTime(isoDate: string, countryId: CountryId): string {
  return new Intl.DateTimeFormat(`en-${countryId.toUpperCase()}`, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(isoDate));
}
