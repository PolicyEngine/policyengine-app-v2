import { Anchor, Box } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface DatasetLinkProps {
  datasetId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function DatasetLink({ datasetId, label, size = 'sm' }: DatasetLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/dataset/${datasetId}`);
  };

  return (
    <Anchor
      href={`/dataset/${datasetId}`}
      onClick={handleClick}
      size={size}
      style={{ display: 'inline-block' }}
    >
      <Box
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'var(--mantine-color-gray-1)',
        }}
      >
        <IconDatabase size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || datasetId}</span>
      </Box>
    </Anchor>
  );
}
