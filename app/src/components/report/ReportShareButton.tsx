import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconLink, IconShare } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover';

interface ReportShareButtonProps {
  shareUrl?: string;
}

export function ReportShareButton({ shareUrl }: ReportShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<'success' | 'error'>('success');
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('success');
    } catch (error) {
      console.error('[ReportShareButton] Failed to copy share URL:', error);
      setCopyState('error');
    }

    setIsOpen(true);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 3000);
  };

  const isSuccess = copyState === 'success';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Share"
          title="Share"
          onClick={handleCopy}
          disabled={!shareUrl}
        >
          <IconShare size={18} />
        </Button>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="tw:w-80 tw:border-0 tw:bg-transparent tw:p-0 tw:shadow-none"
      >
        <Card className="tw:gap-0 tw:border-border/70">
          <CardContent className="tw:px-4 tw:py-4">
            <div className="tw:flex tw:items-start tw:gap-3">
              <div
                className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full ${
                  isSuccess
                    ? 'tw:bg-emerald-100 tw:text-emerald-700'
                    : 'tw:bg-amber-100 tw:text-amber-700'
                }`}
              >
                {isSuccess ? <IconCheck size={20} /> : <IconLink size={20} />}
              </div>
              <PopoverHeader className="tw:gap-1">
                <PopoverTitle>{isSuccess ? 'Share link copied' : 'Copy failed'}</PopoverTitle>
                <PopoverDescription className="tw:text-sm">
                  {isSuccess
                    ? 'Anyone with the link can view this report.'
                    : 'The share link could not be copied. Please try again.'}
                </PopoverDescription>
              </PopoverHeader>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
