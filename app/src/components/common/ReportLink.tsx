import { Anchor, Box } from '@mantine/core';
import { IconReport } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface ReportLinkProps {
  reportId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ReportLink({ reportId, label, size = 'sm' }: ReportLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/report/${reportId}`);
  };

  return (
    <Anchor
      href={`/report/${reportId}`}
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
        <IconReport size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || reportId}</span>
      </Box>
    </Anchor>
  );
}
