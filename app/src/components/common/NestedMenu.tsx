import { useState } from 'react';
import { colors } from '@/designTokens';
import { cn } from '@/lib/utils';

interface NestedMenuOptions {
  name: string;
  label: string;
  children?: NestedMenuOptions[];
}

interface NestedMenuProps {
  menuOptions: NestedMenuOptions[];
  onItemClick?: (name: string) => void;
}

export default function NestedMenu({ menuOptions, onItemClick }: NestedMenuProps) {
  const [active, setActive] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  function handleClick(name: string) {
    if (onItemClick) {
      onItemClick(name);
    }
    setActive(name);
    setSelectedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }

  function mapOverOneParamLevel(list: NestedMenuOptions[], depth = 0) {
    return list.map((item: NestedMenuOptions) => {
      const isActive = active === item.name;
      const isExpanded = selectedSet.has(item.name);

      return (
        <div key={item.name}>
          <button
            type="button"
            className={cn(
              'tw:w-full tw:text-left tw:border-none tw:cursor-pointer tw:text-sm tw:flex tw:items-center tw:gap-1.5 tw:rounded-sm tw:transition-colors',
              isActive
                ? 'tw:bg-primary-50 tw:text-primary-700 tw:font-medium'
                : 'tw:bg-transparent tw:text-gray-700 tw:hover:bg-gray-100'
            )}
            style={{
              padding: '6px 12px',
              paddingLeft: `${12 + depth * 20}px`,
              borderLeft: isActive ? `3px solid ${colors.primary[500]}` : '3px solid transparent',
            }}
            onClick={() => handleClick(item.name)}
          >
            <span className="tw:leading-tight">{item.label}</span>
          </button>
          {item.children && isExpanded && (
            <div>{mapOverOneParamLevel(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

  const paramList = mapOverOneParamLevel(menuOptions);

  return <>{paramList}</>;
}
