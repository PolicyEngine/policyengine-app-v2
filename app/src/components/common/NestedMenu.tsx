import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NestedMenuOptions {
  name: string;
  label: string;
  children?: NestedMenuOptions[];
}

interface NestedMenuProps {
  menuOptions: NestedMenuOptions[];
  onItemClick?: (name: string) => void; // Optional callback for item click
}

export default function NestedMenu({ menuOptions, onItemClick }: NestedMenuProps) {
  const [active, setActive] = useState<string | null>(null);

  // Manually control what's been selected so that we render deeper menu levels
  // on demand; vastly improves runtime for larger menu sets, e.g., US policy params
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  function handleClick(name: string) {
    if (onItemClick) {
      onItemClick(name); // Call the optional callback if provided
    }
    setActive(name);
    setSelectedSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name); // If already selected, remove it
      } else {
        newSet.add(name); // If not selected, add it
      }
      return newSet;
    });
  }

  function mapOverOneParamLevel(list: NestedMenuOptions[], depth = 0) {
    return list.map((item: NestedMenuOptions) => {
      const isActive = active === item.name;
      const isExpanded = selectedSet.has(item.name);
      const hasChildren = !!item.children;

      return (
        <div key={item.name}>
          <button
            className={cn(
              'tw:w-full tw:text-left tw:px-md tw:py-xs tw:border-none tw:bg-transparent tw:cursor-pointer tw:text-sm tw:rounded-sm tw:transition-colors',
              isActive ? 'tw:bg-primary-50 tw:text-primary-700 tw:font-medium' : 'tw:text-gray-700 hover:tw:bg-gray-50',
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => handleClick(item.name)}
          >
            {hasChildren && (
              <span className="tw:mr-xs tw:inline-block" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
                &#9656;
              </span>
            )}
            {item.label}
          </button>
          {item.children && isExpanded && (
            <div>
              {mapOverOneParamLevel(item.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }

  const paramList = mapOverOneParamLevel(menuOptions);

  return <>{paramList}</>;
}
