import { Anchor, Group, Box } from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface PolicyLinkProps {
  policyId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function PolicyLink({ policyId, label, size = 'sm' }: PolicyLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/policy/${policyId}`);
  };

  return (
    <Anchor
      href={`/policy/${policyId}`}
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
        <IconFileText size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || policyId}</span>
      </Box>
    </Anchor>
  );
}
