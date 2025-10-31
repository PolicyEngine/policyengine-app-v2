import { IconWorld } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { colors, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const countries = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
];

export default function CountrySelector() {
  const countryId = useCurrentCountry();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCountryChange = (newCountryId: string) => {
    // Replace the country ID in the current path
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts[0] = newCountryId;
      navigate(`/${pathParts.join('/')}`);
    } else {
      navigate(`/${newCountryId}`);
    }
  };

  return (
    <Menu shadow="md" width={200} zIndex={1001} position="bottom-end" offset={10}>
      <Menu.Target>
        <UnstyledButton>
          <Group gap={4}>
            <IconWorld size={16} color={colors.text.inverse} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {countries.map((country) => (
          <Menu.Item
            key={country.id}
            onClick={() => handleCountryChange(country.id)}
            style={{
              fontFamily: typography.fontFamily.primary,
            }}
          >
            <Text
              fw={
                countryId === country.id ? typography.fontWeight.bold : typography.fontWeight.normal
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
