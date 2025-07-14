import { useEffect, useState } from 'react';
import { NavLink, Stack } from '@mantine/core';

interface ParamItem {
  name: string;
  label: string;
  index?: number;
  children?: ParamItem[];
}

interface NestedMenuProps {
  data: ParamItem[];
  onItemClick?: (item: ParamItem) => void;
}

interface MenuItemProps {
  item: ParamItem;
  openItems: Set<string>;
  onToggle: (name: string) => void;
  onItemClick?: (item: ParamItem) => void;
  level?: number;
}

export default function NestedMenu({ data, onItemClick }: NestedMenuProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    console.log('Open items:', Array.from(openItems));
  }, [openItems]);

  const handleToggle = (name: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: ParamItem) => {
    console.log('Clicked item:', item);
    onItemClick?.(item);
  };

  return (
    <Stack spacing={0}>
      {data.map((item) => (
        <MenuItem
          key={item.name}
          item={item}
          openItems={openItems}
          onToggle={handleToggle}
          onItemClick={handleItemClick}
        />
      ))}
    </Stack>
  );
};

function MenuItem({ item, openItems, onToggle, onItemClick, level = 0 }: MenuItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = openItems.has(item.name);

  const handleClick = () => {
    if (hasChildren) {
      onToggle(item.name);
    }
    onItemClick?.(item);
  };

  return (
    <NavLink
      key={item.name}
      label={item.label}
      opened={isOpen}
      onClick={handleClick}
      style={{ paddingLeft: level * 16 }}
    >
      {hasChildren && isOpen && (
        <Stack spacing={0}>
          {item.children!.map((child) => (
            <MenuItem
              key={child.name}
              item={child}
              openItems={openItems}
              onToggle={onToggle}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </Stack>
      )}
    </NavLink>
  );
};
