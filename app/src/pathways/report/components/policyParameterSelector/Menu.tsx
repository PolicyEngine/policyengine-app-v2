import { Box, Divider, ScrollArea, Stack, Text } from '@mantine/core';
import LazyNestedMenu from '@/components/common/LazyNestedMenu';
import { useLazyParameterTree } from '@/hooks/useLazyParameterTree';

interface PolicyParameterSelectorMenuProps {
  setSelectedParamLabel: (param: string) => void;
}

export default function PolicyParameterSelectorMenu({
  setSelectedParamLabel,
}: PolicyParameterSelectorMenuProps) {
  const { getChildren } = useLazyParameterTree();

  // Get root level children (direct children of 'gov')
  const rootNodes = getChildren('gov');

  return (
    <Stack h="100%">
      <Box>
        <SelectorMenuHeader />
        <Divider my="xs" />
      </Box>

      <ScrollArea flex={1} type="scroll">
        <LazyNestedMenu
          nodes={rootNodes}
          getChildren={getChildren}
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
