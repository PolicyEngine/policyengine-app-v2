import { useCallback, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { downloadMapAsPng, downloadMapAsSvg } from '@/utils/mapExportUtils';

interface MapDownloadMenuProps {
  mapRef: React.RefObject<HTMLElement | null>;
  filename: string;
}

export function MapDownloadMenu({ mapRef, filename }: MapDownloadMenuProps) {
  const [loading, setLoading] = useState(false);

  const handlePng = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }
    setLoading(true);
    try {
      await downloadMapAsPng(mapRef.current, { filename });
    } finally {
      setLoading(false);
    }
  }, [mapRef, filename]);

  const handleSvg = useCallback(async () => {
    if (!mapRef.current) {
      return;
    }
    setLoading(true);
    try {
      await downloadMapAsSvg(mapRef.current, { filename });
    } finally {
      setLoading(false);
    }
  }, [mapRef, filename]);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={loading}
              aria-label="Download map"
              className="tw:shrink-0"
            >
              <IconDownload size={18} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Download map</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="tw:w-40">
        <DropdownMenuItem onClick={handlePng}>Download PNG</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSvg}>Download SVG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
