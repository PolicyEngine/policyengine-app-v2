import { useState } from 'react';
import type { SignedInUserType } from '@/api/v2AdminUsers';
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
import { useAdminUser, useChangeUserType } from '@/hooks/useAdminUsers';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { getCountryLabel } from '@/utils/geographyUtils';
import {
  adminUserLabel,
  adminUserName,
  formatAdminDate,
  SIGNED_IN_USER_TYPES,
  USER_TYPE_LABELS,
} from './adminUserFormat';
import ChangeUserTypeDialog from './ChangeUserTypeDialog';
import UserTypeChangeHistory from './UserTypeChangeHistory';

const TYPE_GROUP_LABEL_ID = 'admin-user-type-label';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
      <Text size="sm" style={{ margin: 0, minWidth: 140, color: colors.text.secondary }}>
        {label}
      </Text>
      <Text size="sm" style={{ margin: 0, wordBreak: 'break-all' }}>
        {value}
      </Text>
    </div>
  );
}

/** One user's details, a control to change their type, and their type changes. */
export default function AdminUserDetails({ userId }: { userId: string }) {
  const countryId = useCurrentCountry();
  const adminUser = useAdminUser(userId);
  const changeUserType = useChangeUserType();
  // The type chosen in the control; null while it shows the user's own type.
  const [chosenType, setChosenType] = useState<SignedInUserType | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (adminUser.isPending) {
    return (
      <Stack role="status" aria-live="polite" align="center" gap="md">
        <Spinner size="sm" />
        <Text style={{ margin: 0, color: colors.text.secondary }}>Loading the user…</Text>
      </Stack>
    );
  }

  if (adminUser.isError) {
    return (
      <Text role="alert" style={{ margin: 0, color: colors.error }}>
        We could not load this user: {adminUser.error.message}
      </Text>
    );
  }

  const user = adminUser.data;
  const selectedType = chosenType ?? user.user_type;

  const closeConfirmation = () => {
    setConfirming(false);
    changeUserType.reset();
  };

  const confirmChange = () => {
    changeUserType.mutate(
      { userId, userType: selectedType },
      {
        onSuccess: () => {
          setConfirming(false);
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
          <Stack gap="sm">
            <DetailRow label="Type" value={USER_TYPE_LABELS[user.user_type]} />
            <DetailRow
              label="Primary country"
              value={user.primary_country ? getCountryLabel(user.primary_country) : 'None'}
            />
            <DetailRow label="Member since" value={formatAdminDate(user.created_at, countryId)} />
            <DetailRow
              label="Last seen"
              value={user.last_seen_at ? formatAdminDate(user.last_seen_at, countryId) : 'Never'}
            />
            <DetailRow label="PolicyEngine user ID" value={user.id} />
          </Stack>

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
                  <RadioGroupItem value={userType} id={`admin-user-type-${userType}`} />
                  <Label htmlFor={`admin-user-type-${userType}`}>
                    {USER_TYPE_LABELS[userType]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              variant="outline"
              onClick={() => setConfirming(true)}
              disabled={selectedType === user.user_type}
            >
              Change type
            </Button>
          </Stack>

          <UserTypeChangeHistory userId={userId} />
        </Stack>
      </CardContent>

      <ChangeUserTypeDialog
        open={confirming}
        userLabel={adminUserLabel(user)}
        currentType={user.user_type}
        newType={selectedType}
        changing={changeUserType.isPending}
        errorMessage={changeUserType.error?.message ?? null}
        onConfirm={confirmChange}
        onCancel={closeConfirmation}
      />
    </Card>
  );
}
