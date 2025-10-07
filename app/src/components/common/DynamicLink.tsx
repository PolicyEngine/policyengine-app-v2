import { Anchor, Box } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface DynamicLinkProps {
  dynamicId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function DynamicLink({ dynamicId, label, size = 'sm' }: DynamicLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/dynamic/${dynamicId}`);
  };

  return (
    <Anchor
      href={`/dynamic/${dynamicId}`}
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
        <IconRefresh size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || dynamicId}</span>
      </Box>
    </Anchor>
  );
}
