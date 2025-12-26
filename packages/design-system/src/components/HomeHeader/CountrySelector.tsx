import { IconWorld } from '@tabler/icons-react';
import { Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, typography } from '../../tokens';
import { Country } from './types';

interface CountrySelectorProps {
  currentCountryId: string;
  countries: Country[];
  onCountryChange: (countryId: string) => void;
}

export function CountrySelector({
  currentCountryId,
  countries,
  onCountryChange,
}: CountrySelectorProps) {
  return (
    <Menu shadow="md" width={200} zIndex={1001} position="bottom-end" offset={10}>
      <Menu.Target>
        <UnstyledButton aria-label="Country selector" style={{ lineHeight: 1 }}>
          <Group gap={4} align="center">
            <IconWorld size={18} color={colors.text.inverse} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {countries.map((country) => (
          <Menu.Item
            key={country.id}
            onClick={() => onCountryChange(country.id)}
            style={{
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <Text
              fw={
                currentCountryId === country.id
                  ? typography.fontWeight.bold
                  : typography.fontWeight.normal
              }
              style={{
                fontFamily: typography.fontFamily.primary,
              }}
            >
              {country.label}
            </Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
