import { Anchor, Box } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface SimulationLinkProps {
  simulationId: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function SimulationLink({ simulationId, label, size = 'sm' }: SimulationLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/simulation/${simulationId}`);
  };

  return (
    <Anchor
      href={`/simulation/${simulationId}`}
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
        <IconChartBar size={14} />
        <span style={{ fontFamily: 'monospace' }}>{label || simulationId}</span>
      </Box>
    </Anchor>
  );
}
