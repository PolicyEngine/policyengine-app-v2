import { useEffect, useRef, useState } from 'react';
import { IconAlertTriangle, IconCheck, IconCopy, IconShare } from '@tabler/icons-react';
import {
  Button,
  Card,
  CardContent,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';

interface ReportShareButtonProps {
  shareUrl?: string | null;
}

/**
 * ReportShareButton - Copies the share URL immediately and shows a short
 * confirmation popover without dumping the raw link into the UI.
 */
export function ReportShareButton({ shareUrl }: ReportShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    setOpen(true);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus('success');

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      closeTimeoutRef.current = setTimeout(() => setOpen(false), 2200);
    } catch (error) {
      setStatus('error');
      console.error('[ReportShareButton] Failed to copy share URL:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverAnchor asChild>
            <Button variant="ghost" size="icon" aria-label="Share" disabled={!shareUrl} onClick={handleShare}>
              <IconShare size={18} />
            </Button>
          </PopoverAnchor>
        </TooltipTrigger>
        <TooltipContent side="bottom">Share</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="tw:w-[320px] tw:p-0">
        <Card className="tw:border-0 tw:shadow-none">
          <CardContent className="tw:flex tw:items-start tw:gap-3 tw:py-5">
            <div className="tw:mt-0.5 tw:flex tw:h-9 tw:w-9 tw:flex-shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-muted">
              {status === 'error' ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <Text className="tw:text-sm tw:font-semibold">
                {status === 'error' ? 'Could not copy link' : 'Link copied to clipboard'}
              </Text>
              <Text className="tw:mt-1 tw:text-sm tw:text-muted-foreground">
                {status === 'error'
                  ? 'Clipboard access failed. Try copying again.'
                  : 'Anyone with the link can view this report in read-only mode.'}
              </Text>
              {status === 'error' && (
                <Button onClick={handleShare} variant="secondary" size="sm" className="tw:mt-3">
                  <IconCopy size={16} />
                  Copy again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
