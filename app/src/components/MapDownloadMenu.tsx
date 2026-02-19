import { useCallback, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { ActionIcon, Menu, Tooltip } from '@mantine/core';
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
    <Menu shadow="sm" width={160} position="bottom-end">
      <Menu.Target>
        <Tooltip label="Download map" position="left">
          <ActionIcon
            variant="subtle"
            size="md"
            loading={loading}
            aria-label="Download map"
            style={{ flexShrink: 0 }}
          >
            <IconDownload size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={handlePng}>Download PNG</Menu.Item>
        <Menu.Item onClick={handleSvg}>Download SVG</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
