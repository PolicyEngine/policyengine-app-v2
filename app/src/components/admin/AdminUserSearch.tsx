import { useId, useState, type FormEvent } from 'react';
import type { AdminUserItem, AdminUserPageResult } from '@/api/v2AdminUsers';
import {
  Button,
  Input,
  Label,
  ShadcnTable,
  Spinner,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import {
  isRefusedOrMissing,
  useAdminUserSearch,
  useStartAdminUserSearch,
} from '@/hooks/useAdminUsers';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { adminUserName, formatAdminDate, USER_TYPE_LABELS } from './adminUserFormat';

/** The longest email part the API's `email` filter accepts. */
const EMAIL_SEARCH_MAX_LENGTH = 320;

/**
 * The users of every page read so far, each once. The API pages by offset
 * over the newest users first, so a user who signs up between two pages
 * shifts the rest by one and would be read twice; the first copy is kept.
 * A user deleted between two pages shifts them the other way, and one user
 * can then be missing until the search is run again.
 */
function usersOfPages(pages: readonly AdminUserPageResult[]): AdminUserItem[] {
  const usersById = new Map<string, AdminUserItem>();
  for (const user of pages.flatMap((page) => page.items)) {
    if (!usersById.has(user.id)) {
      usersById.set(user.id, user);
    }
  }
  return [...usersById.values()];
}

interface AdminUserSearchProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

/**
 * Finds signed-in users by part of their email, newest first, a page at a
 * time. Without a search it lists every signed-in user.
 */
export default function AdminUserSearch({ selectedUserId, onSelectUser }: AdminUserSearchProps) {
  const countryId = useCurrentCountry();
  const emailInputId = useId();
  const [emailDraft, setEmailDraft] = useState('');
  const [searchedEmail, setSearchedEmail] = useState('');
  const search = useAdminUserSearch(searchedEmail);
  const startSearch = useStartAdminUserSearch();
  const users = search.data ? usersOfPages(search.data.pages) : [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailDraft.trim();
    // Every submit reads afresh, including the same text again.
    void startSearch(email);
    setSearchedEmail(email);
  };

  let results: React.ReactNode;
  // Users already read stay on the screen when a later read fails for a
  // while (a network error, a 5xx), but not after a 403 or 404.
  if (search.isError && (search.data === undefined || isRefusedOrMissing(search.error))) {
    results = (
      <Stack gap="sm" align="start">
        <Text role="alert" style={{ margin: 0, color: colors.error }}>
          We could not load the users: {search.error.message}
        </Text>
        <Button variant="outline" onClick={() => search.refetch()}>
          Try again
        </Button>
      </Stack>
    );
  } else if (search.data === undefined) {
    results = (
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading users…</Text>
      </Stack>
    );
  } else if (users.length === 0) {
    results = (
      <Text style={{ margin: 0, color: colors.text.secondary }}>
        {searchedEmail
          ? 'No signed-in user has an email that contains this.'
          : 'No signed-in users yet.'}
      </Text>
    );
  } else {
    results = (
      <Stack gap="md" align="start">
        <ShadcnTable aria-label="Users">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const selected = user.id === selectedUserId;
              return (
                <TableRow
                  key={user.id}
                  style={selected ? { backgroundColor: colors.secondary[50] } : undefined}
                >
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      aria-pressed={selected}
                      onClick={() => onSelectUser(user.id)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      {user.email ?? 'No email'}
                    </Button>
                  </TableCell>
                  <TableCell>{adminUserName(user) ?? '—'}</TableCell>
                  <TableCell>{USER_TYPE_LABELS[user.user_type]}</TableCell>
                  <TableCell>
                    {user.last_seen_at ? formatAdminDate(user.last_seen_at, countryId) : 'Never'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ShadcnTable>
        {search.hasNextPage && (
          <Button
            variant="outline"
            onClick={() => search.fetchNextPage()}
            disabled={search.isFetchingNextPage}
          >
            {search.isFetchingNextPage && <Spinner size="sm" />}
            Load more
          </Button>
        )}
        {search.isFetchNextPageError && (
          <Text role="alert" size="sm" style={{ margin: 0, color: colors.error }}>
            We could not load more users: {search.error.message}
          </Text>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <form
        role="search"
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: spacing.sm, alignItems: 'flex-end', flexWrap: 'wrap' }}
      >
        <Stack gap="xs" style={{ flex: '1 1 auto' }}>
          <Label htmlFor={emailInputId}>Email</Label>
          <Input
            id={emailInputId}
            type="search"
            value={emailDraft}
            maxLength={EMAIL_SEARCH_MAX_LENGTH}
            onChange={(event) => setEmailDraft(event.target.value)}
            placeholder="Email address"
          />
        </Stack>
        <Button type="submit">Search</Button>
      </form>
      {results}
    </Stack>
  );
}
