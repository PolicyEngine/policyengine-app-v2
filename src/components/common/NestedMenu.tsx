import { useState } from 'react';
import { NavLink } from '@mantine/core';

interface NestedMenuOptions {
  name: string;
  label: string;
  children?: NestedMenuOptions[];
}

interface NestedMenuProps {
  menuOptions: NestedMenuOptions[];
}

export default function NestedMenu({ menuOptions }: NestedMenuProps) {
  const [active, setActive] = useState<string | null>(null);

  // Manually control what's been selected so that we render deeper menu levels
  // on demand; vastly improves runtime for larger menu sets, e.g., US policy params
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());

  function handleClick(name: string) {
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

  function mapOverOneParamLevel(list: NestedMenuOptions[]) {
    console.log('Mapping over one parameter level:', list);
    return list.map((item: NestedMenuOptions) => {
      return (
        <NavLink
          key={item.name}
          // href={`#${item.name}`} TODO: Do we need href?
          label={item.label}
          active={active === item.name}
          onClick={() => handleClick(item.name)}
          opened={selectedSet.has(item.name)}
        >
          {item.children && selectedSet.has(item.name) && mapOverOneParamLevel(item.children)}
        </NavLink>
      );
    });
  }

  const paramList = mapOverOneParamLevel(menuOptions);

  return <>{paramList}</>;
}
