import { ScrollArea, Stack, TextInput, Button, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

interface SimpleParameterListProps {
  parameters: Record<string, any>;
  selectedParam: string | null;
  onSelectParam: (paramId: string) => void;
}

export default function SimpleParameterList({
  parameters,
  selectedParam,
  onSelectParam,
}: SimpleParameterListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter parameters based on search
  const filteredParams = Object.entries(parameters).filter(([key, param]) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      key.toLowerCase().includes(searchLower) ||
      param.label?.toLowerCase().includes(searchLower) ||
      param.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Stack h="100%" gap="md">
      <TextInput
        placeholder="Search parameters..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
      />

      <ScrollArea style={{ flex: 1 }}>
        <Stack gap="xs">
          {filteredParams.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" mt="lg">
              No parameters found
            </Text>
          ) : (
            filteredParams.map(([key, param]) => (
              <Button
                key={key}
                variant={selectedParam === key ? 'filled' : 'subtle'}
                justify="flex-start"
                onClick={() => onSelectParam(key)}
                styles={{
                  root: {
                    height: 'auto',
                    padding: '8px 12px',
                  },
                  inner: {
                    justifyContent: 'flex-start',
                  },
                  label: {
                    fontWeight: 400,
                    textAlign: 'left',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                  },
                }}
              >
                <Stack gap={2}>
                  <Text size="sm" fw={500}>
                    {param.label || key.split('.').pop()?.replace(/_/g, ' ')}
                  </Text>
                  {param.description && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {param.description}
                    </Text>
                  )}
                </Stack>
              </Button>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}