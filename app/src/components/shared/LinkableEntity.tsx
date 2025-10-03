/**
 * Component for rendering clickable links to entities (policies, simulations, etc.)
 */

import { Anchor } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { variablesAPI } from '@/api/v2/variables';

type EntityType = 'policy' | 'simulation' | 'dynamic' | 'dataset' | 'user' | 'variable';

interface LinkableEntityProps {
  type: EntityType;
  id: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: number;
  color?: string;
  underline?: 'always' | 'hover' | 'never';
}

/**
 * Renders an entity as a clickable link that navigates to its detail page
 */
export default function LinkableEntity({
  type,
  id,
  label,
  size = 'sm',
  weight,
  color,
  underline = 'hover',
}: LinkableEntityProps) {
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();

  // Fetch variable label if it's a variable and no label provided
  const { data: variable } = useQuery({
    queryKey: ['variable', id],
    queryFn: () => variablesAPI.get(id),
    enabled: type === 'variable' && !label,
  });

  // Capitalize first letter of variable labels
  const capitalizeFirst = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const rawLabel = label || (type === 'variable' && variable?.label) || id;
  const displayLabel = type === 'variable' ? capitalizeFirst(rawLabel) : rawLabel;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let path = '';
    switch (type) {
      case 'policy':
        path = `/${countryId}/policy/${id}`;
        break;
      case 'simulation':
        path = `/${countryId}/simulation/${id}`;
        break;
      case 'dynamic':
        path = `/${countryId}/dynamic/${id}`;
        break;
      case 'dataset':
        path = `/${countryId}/dataset/${id}`;
        break;
      case 'user':
        path = `/${countryId}/user/${id}`;
        break;
      case 'variable':
        path = `/${countryId}/variable/${id}`;
        break;
    }

    navigate(path);
  };

  return (
    <Anchor
      size={size}
      fw={weight}
      c={color}
      underline={underline}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {displayLabel}
    </Anchor>
  );
}
