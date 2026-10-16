import { IconExternalLink } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { BILL_TRACKER_URL } from '@/libs/flagship/billTracker';

/** The bill tracker's home, where every tracked bill is listed. */
export default function TrackerHomeButton() {
  return (
    <Button variant="outline" asChild>
      <a href={BILL_TRACKER_URL} target="_blank" rel="noreferrer">
        Bill tracker
        <IconExternalLink size={16} />
      </a>
    </Button>
  );
}
