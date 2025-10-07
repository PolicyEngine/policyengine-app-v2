import { Text, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

interface ResourceIdLinkProps {
  resourceType: 'policy' | 'simulation' | 'report' | 'dataset' | 'dynamic' | 'model-version';
  resourceId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
}

export default function ResourceIdLink({
  resourceType,
  resourceId,
  size = 'sm',
  label,
}: ResourceIdLinkProps) {
  const navigate = useNavigate();

  const getPath = () => {
    switch (resourceType) {
      case 'policy':
        return `/policy/${resourceId}`;
      case 'simulation':
        return `/simulation/${resourceId}`;
      case 'report':
        return `/report/${resourceId}`;
      case 'dataset':
        return `/dataset/${resourceId}`;
      case 'dynamic':
        return `/dynamic/${resourceId}`;
      case 'model-version':
        return `/model-version/${resourceId}`;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(getPath());
  };

  return (
    <Anchor
      href={getPath()}
      onClick={handleClick}
      size={size}
      style={{ fontFamily: 'monospace' }}
    >
      {label || resourceId}
    </Anchor>
  );
}
