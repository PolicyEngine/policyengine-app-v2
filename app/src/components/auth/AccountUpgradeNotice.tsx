import { FloatingAlert } from '@/components/common/FloatingAlert';
import { Button } from '@/components/ui';
import { dismissAccountUpgradeNotice, useAccountUpgradeNotice } from '@/libs/auth/accountUpgrade';

/**
 * Reports the upgrade at sign-in (see runAccountUpgrade). Mounted once in
 * the v3 workspace, so it stays up after the callback page has moved on.
 */
export default function AccountUpgradeNotice() {
  const notice = useAccountUpgradeNotice();
  if (!notice) {
    return null;
  }
  return (
    <FloatingAlert
      type={notice.kind === 'success' ? 'success' : 'error'}
      onClose={dismissAccountUpgradeNotice}
    >
      <span>{notice.message}</span>
      {notice.retry && (
        <span className="tw:mt-2 tw:block">
          <Button size="sm" variant="outline" onClick={notice.retry}>
            Try again
          </Button>
        </span>
      )}
    </FloatingAlert>
  );
}
