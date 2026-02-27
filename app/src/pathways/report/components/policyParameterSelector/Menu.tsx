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
    <Stack h="100%">
      <Box>
        <SelectorMenuHeader />
        <Divider my="xs" />
      </Box>

      <ScrollArea flex={1} type="scroll">
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
