import { Fragment, useRef, useState } from 'react';
import type { SignedInUserType } from '@/api/v2AdminUsers';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  Stack,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import {
  isRefusedOrMissing,
  useAdminUser,
  useChangeUserType,
  useReadAdminUserNow,
} from '@/hooks/useAdminUsers';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMe } from '@/hooks/useMe';
import { getCountryLabel } from '@/utils/geographyUtils';
import {
  adminUserLabel,
  adminUserName,
  formatAdminDate,
  SIGNED_IN_USER_TYPES,
  USER_TYPE_LABELS,
} from './adminUserFormat';
import ChangeUserTypeDialog, { type UserTypeConfirmation } from './ChangeUserTypeDialog';
import UserTypeChangeHistory from './UserTypeChangeHistory';

const TYPE_GROUP_LABEL_ID = 'admin-user-type-label';

function typeOptionId(userType: SignedInUserType): string {
  return `admin-user-type-${userType}`;
}

/** Labels and values in two columns, the labels as wide as the widest. */
function DetailList({ details }: { details: ReadonlyArray<[label: string, value: string]> }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        columnGap: spacing.lg,
        rowGap: spacing.sm,
      }}
    >
      {details.map(([label, value]) => (
        <Fragment key={label}>
          <Text size="sm" style={{ margin: 0, color: colors.text.secondary }}>
            {label}
          </Text>
          <Text size="sm" style={{ margin: 0, wordBreak: 'break-all' }}>
            {value}
          </Text>
        </Fragment>
      ))}
    </div>
  );
}

/** One user's details, a control to change their type, and their type changes. */
export default function AdminUserDetails({ userId }: { userId: string }) {
  const countryId = useCurrentCountry();
  const adminUser = useAdminUser(userId);
  const readUserNow = useReadAdminUserNow();
  const changeUserType = useChangeUserType();
  const signedInUserId = useMe().data?.id ?? null;
  // The type chosen in the control; null while it shows the user's own type.
  const [chosenType, setChosenType] = useState<SignedInUserType | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  // Kept after the dialog closes, so it reads the same while it animates away.
  const [confirmation, setConfirmation] = useState<UserTypeConfirmation | null>(null);
  // Counts the confirmation's reads, so only the latest one's answer is shown.
  const latestReadNumber = useRef(0);
  // Set when a change is saved, so the closing dialog hands focus to the type control.
  const savedTypeToFocus = useRef<SignedInUserType | null>(null);

  if (adminUser.isError && isV2ApiError(adminUser.error, 404)) {
    return (
      <Text style={{ margin: 0, color: colors.text.secondary }}>This user no longer exists.</Text>
    );
  }

  // A user already read stays on the screen when a later read fails for a
  // while (a network error, a 5xx), but not after a 403.
  if (adminUser.data === undefined || (adminUser.isError && isRefusedOrMissing(adminUser.error))) {
    if (adminUser.isError) {
      return (
        <Stack gap="sm" align="start">
          <Text role="alert" style={{ margin: 0, color: colors.error }}>
            We could not load this user: {adminUser.error.message}
          </Text>
          <Button variant="outline" onClick={() => adminUser.refetch()}>
            Try again
          </Button>
        </Stack>
      );
    }
    return (
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading the user…</Text>
      </Stack>
    );
  }

  const user = adminUser.data;
  const selectedType = chosenType ?? user.user_type;

  /** Reads the user's type again, since the cached one may be out of date. */
  const readCurrentType = async (newType: SignedInUserType) => {
    latestReadNumber.current += 1;
    const readNumber = latestReadNumber.current;
    setConfirmation({ newType, currentType: null, readErrorMessage: null });
    try {
      const currentUser = await readUserNow(userId);
      if (readNumber === latestReadNumber.current) {
        setConfirmation({ newType, currentType: currentUser.user_type, readErrorMessage: null });
      }
    } catch (error) {
      if (readNumber === latestReadNumber.current) {
        setConfirmation({
          newType,
          currentType: null,
          readErrorMessage: error instanceof Error ? error.message : 'The user could not be read.',
        });
      }
    }
  };

  const openConfirmation = () => {
    changeUserType.reset();
    setConfirmationOpen(true);
    void readCurrentType(selectedType);
  };

  const closeConfirmation = () => {
    latestReadNumber.current += 1;
    setConfirmationOpen(false);
    changeUserType.reset();
  };

  const confirmChange = () => {
    if (!confirmation) {
      return;
    }
    changeUserType.mutate(
      { userId, userType: confirmation.newType },
      {
        onSuccess: (changedUser) => {
          savedTypeToFocus.current = changedUser.user_type;
          setConfirmationOpen(false);
          setChosenType(null);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{adminUserLabel(user)}</CardTitle>
        <CardDescription>{adminUserName(user) ?? 'No name'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap="xl">
          <DetailList
            details={[
              ['Type', USER_TYPE_LABELS[user.user_type]],
              [
                'Primary country',
                user.primary_country ? getCountryLabel(user.primary_country) : 'None',
              ],
              ['Member since', formatAdminDate(user.created_at, countryId)],
              [
                'Last seen',
                user.last_seen_at ? formatAdminDate(user.last_seen_at, countryId) : 'Never',
              ],
              ['PolicyEngine user ID', user.id],
            ]}
          />

          <Stack gap="sm" align="start">
            <Text id={TYPE_GROUP_LABEL_ID} size="sm" style={{ margin: 0 }}>
              User type
            </Text>
            <RadioGroup
              aria-labelledby={TYPE_GROUP_LABEL_ID}
              value={selectedType}
              onValueChange={(value) => setChosenType(value as SignedInUserType)}
              style={{ display: 'flex', gap: spacing.lg }}
            >
              {SIGNED_IN_USER_TYPES.map((userType) => (
                <div
                  key={userType}
                  style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}
                >
                  <RadioGroupItem value={userType} id={typeOptionId(userType)} />
                  <Label htmlFor={typeOptionId(userType)}>{USER_TYPE_LABELS[userType]}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              variant="outline"
              onClick={openConfirmation}
              disabled={selectedType === user.user_type}
            >
              Change type
            </Button>
          </Stack>

          <UserTypeChangeHistory userId={userId} />
        </Stack>
      </CardContent>

      {confirmation && (
        <ChangeUserTypeDialog
          open={confirmationOpen}
          userLabel={adminUserLabel(user)}
          confirmation={confirmation}
          isOwnAccount={user.id === signedInUserId}
          changing={changeUserType.isPending}
          errorMessage={changeUserType.error?.message ?? null}
          onConfirm={confirmChange}
          onCancel={closeConfirmation}
          onReadAgain={() => void readCurrentType(confirmation.newType)}
          onCloseAutoFocus={(event) => {
            const savedType = savedTypeToFocus.current;
            if (savedType) {
              // "Change type" is disabled once the change is saved; focus the type instead.
              savedTypeToFocus.current = null;
              event.preventDefault();
              document.getElementById(typeOptionId(savedType))?.focus();
            }
          }}
        />
      )}
    </Card>
  );
}
