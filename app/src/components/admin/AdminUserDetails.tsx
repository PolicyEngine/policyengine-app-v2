import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
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
  Title,
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

/** What the dialog says when the API refused a change because the user's type changed since. */
function typeChangedSentence(
  userLabel: string,
  typeNow: SignedInUserType,
  newType: SignedInUserType
): string {
  const changedTo = `The type of ${userLabel} changed to ${USER_TYPE_LABELS[typeNow]} since you opened this`;
  if (typeNow === newType) {
    return `${changedTo}, so nothing will change.`;
  }
  return `${changedTo}. Confirm to change it from ${USER_TYPE_LABELS[typeNow]} to ${USER_TYPE_LABELS[newType]}, or cancel.`;
}

/** Whether nothing has focus: what a dialog leaves behind when it unmounts with what opened it. */
function focusWasLost(): boolean {
  return document.activeElement === null || document.activeElement === document.body;
}

/**
 * Stands in for the details when they cannot be shown. Its heading takes
 * focus when a closing dialog left it nowhere.
 */
function DetailsMessage({ heading, children }: { heading: string; children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // After the dialog's own focus handling, which runs on a zero timeout.
    const timer = setTimeout(() => {
      if (focusWasLost()) {
        headingRef.current?.focus();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Stack gap="sm" align="start">
      <Title order={3} ref={headingRef} tabIndex={-1} style={{ margin: 0 }}>
        {heading}
      </Title>
      {children}
    </Stack>
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
  // Said in place of the API's 409 when the user's type changed since the dialog's read.
  const [typeChangedNotice, setTypeChangedNotice] = useState<string | null>(null);
  // Counts the confirmation's reads, so only the latest one's answer is shown.
  const latestReadNumber = useRef(0);
  // Set when a change is saved, so the closing dialog hands focus to the type control.
  const savedTypeToFocus = useRef<SignedInUserType | null>(null);
  const changeTypeButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const typeGroupLabelId = `${idPrefix}-type-label`;
  const typeOptionId = (userType: SignedInUserType) => `${idPrefix}-type-${userType}`;
  const heading = adminUser.data ? adminUserLabel(adminUser.data) : 'User';

  if (adminUser.isError && isV2ApiError(adminUser.error, 404)) {
    return (
      <DetailsMessage heading={heading}>
        <Text role="status" style={{ margin: 0, color: colors.text.secondary }}>
          This user no longer exists.
        </Text>
      </DetailsMessage>
    );
  }

  // A user already read stays on the screen when a later read fails for a
  // while (a network error, a 5xx), but not after a 403.
  if (adminUser.data === undefined || (adminUser.isError && isRefusedOrMissing(adminUser.error))) {
    if (adminUser.isError) {
      return (
        <DetailsMessage heading={heading}>
          <Text role="alert" style={{ margin: 0, color: colors.error }}>
            We could not load this user: {adminUser.error.message}
          </Text>
          <Button variant="outline" onClick={() => adminUser.refetch()}>
            Try again
          </Button>
        </DetailsMessage>
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

  /**
   * Reads the user's type again, since the cached one may be out of date,
   * and returns it (null when the read failed, or a later one replaced it).
   */
  const readCurrentType = async (newType: SignedInUserType): Promise<SignedInUserType | null> => {
    latestReadNumber.current += 1;
    const readNumber = latestReadNumber.current;
    setConfirmation({ newType, currentType: null, readErrorMessage: null });
    try {
      const currentUser = await readUserNow(userId);
      if (readNumber !== latestReadNumber.current) {
        return null;
      }
      setConfirmation({ newType, currentType: currentUser.user_type, readErrorMessage: null });
      return currentUser.user_type;
    } catch (error) {
      if (readNumber === latestReadNumber.current) {
        setConfirmation({
          newType,
          currentType: null,
          readErrorMessage: error instanceof Error ? error.message : 'The user could not be read.',
        });
      }
      return null;
    }
  };

  const openConfirmation = () => {
    changeUserType.reset();
    setTypeChangedNotice(null);
    setConfirmationOpen(true);
    void readCurrentType(selectedType);
  };

  const closeConfirmation = () => {
    latestReadNumber.current += 1;
    setConfirmationOpen(false);
    changeUserType.reset();
    setTypeChangedNotice(null);
  };

  const confirmChange = () => {
    if (!confirmation?.currentType) {
      return;
    }
    const { newType, currentType } = confirmation;
    setTypeChangedNotice(null);
    changeUserType.mutate(
      // The type the dialog names, so the API refuses if someone changed it since.
      { userId, userType: newType, expectedUserType: currentType },
      {
        onSuccess: (changedUser) => {
          savedTypeToFocus.current = changedUser.user_type;
          setConfirmationOpen(false);
          setChosenType(null);
        },
        onError: async (error) => {
          // A 409 is either a type changed since the dialog's read or a
          // last-admin refusal; reading the user again tells them apart. The
          // dialog's description then names the current type. Below it, the
          // API's message stays after a last-admin refusal (the type read is
          // the same), and is replaced by the app's own after a changed type.
          if (!isV2ApiError(error, 409)) {
            return;
          }
          const typeNow = await readCurrentType(newType);
          if (typeNow !== null && typeNow !== currentType) {
            setTypeChangedNotice(typeChangedSentence(adminUserLabel(user), typeNow, newType));
          }
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle ref={headingRef} role="heading" aria-level={3} tabIndex={-1}>
          {adminUserLabel(user)}
        </CardTitle>
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
            <Text id={typeGroupLabelId} size="sm" style={{ margin: 0 }}>
              User type
            </Text>
            <RadioGroup
              aria-labelledby={typeGroupLabelId}
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
              ref={changeTypeButtonRef}
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
          errorMessage={typeChangedNotice ?? changeUserType.error?.message ?? null}
          onConfirm={confirmChange}
          onCancel={closeConfirmation}
          onReadAgain={() => void readCurrentType(confirmation.newType)}
          onCloseAutoFocus={(event) => {
            // The dialog has no trigger to hand focus back to, so it is placed here.
            event.preventDefault();
            const savedType = savedTypeToFocus.current;
            savedTypeToFocus.current = null;
            const changeTypeButton = changeTypeButtonRef.current;
            if (savedType) {
              // "Change type" is disabled once the change is saved; focus the type instead.
              document.getElementById(typeOptionId(savedType))?.focus();
            } else if (changeTypeButton?.isConnected && !changeTypeButton.disabled) {
              changeTypeButton.focus();
            } else if (headingRef.current?.isConnected) {
              headingRef.current.focus();
            }
          }}
        />
      )}
    </Card>
  );
}
