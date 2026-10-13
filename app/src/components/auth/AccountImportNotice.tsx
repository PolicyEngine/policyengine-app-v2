import { FloatingAlert } from '@/components/common/FloatingAlert';
import { Button } from '@/components/ui';
import { dismissAccountImportNotice, useAccountImportNotice } from '@/libs/auth/accountImport';

const ALERT_TYPES = { success: 'success', warning: 'warning', failure: 'error' } as const;

/**
 * Reports the import at sign-in (see runSignInImport). Mounted once in the
 * v3 workspace, so it stays up after the callback page has moved on.
 */
export default function AccountImportNotice() {
  const notice = useAccountImportNotice();
  if (!notice) {
    return null;
  }
  return (
    <FloatingAlert type={ALERT_TYPES[notice.kind]} onClose={dismissAccountImportNotice}>
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
