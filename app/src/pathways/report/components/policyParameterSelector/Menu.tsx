import { Box, Divider, ScrollArea, Stack, Text } from '@mantine/core';
import type { ParameterChildNode } from '@/api/v2';
import LazyNestedMenu from '@/components/common/LazyNestedMenu';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface PolicyParameterSelectorMenuProps {
  setSelectedParamLabel: (node: ParameterChildNode) => void;
}

export default function PolicyParameterSelectorMenu({
  setSelectedParamLabel,
}: PolicyParameterSelectorMenuProps) {
  const countryId = useCurrentCountry();

  return (
    <Stack h="100%" style={{ minHeight: 0 }}>
      <Box style={{ flexShrink: 0 }}>
        <SelectorMenuHeader />
        <Divider my="xs" />
      </Box>

      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="scroll">
        <LazyNestedMenu
          countryId={countryId}
          rootPath="gov"
          onParameterClick={setSelectedParamLabel}
        />
      </ScrollArea>
    </Stack>
  );
}

function SelectorMenuHeader() {
  return (
    <Box>
      <Text fw={700}>Select parameters</Text>
      <Text fw={400}>Make changes and add provisions to your policy</Text>
    </Box>
  );
}
