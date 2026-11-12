import AccountSection from '@/components/account/AccountSection';
import DownloadMyData from '@/components/account/DownloadMyData';

/**
 * The account settings' My data page (`/{countryId}/account/data`):
 * downloading everything saved to the account.
 */
export default function AccountDataPage() {
  return (
    <AccountSection title="My data">
      {(countryId) => <DownloadMyData countryId={countryId} />}
    </AccountSection>
  );
}
