import { Anchor, Box } from '@mantine/core';
import { IconVersions } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface ModelVersionLinkProps {
  modelVersionId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ModelVersionLink({ modelVersionId, label, size = 'sm' }: ModelVersionLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/model-version/${modelVersionId}`);
  };

  return (
    <Anchor
      href={`/model-version/${modelVersionId}`}
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
        <IconVersions size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || modelVersionId}</span>
      </Box>
    </Anchor>
  );
}
