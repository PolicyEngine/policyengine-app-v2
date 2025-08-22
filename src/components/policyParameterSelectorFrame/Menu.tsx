import { Box, Divider, ScrollArea, Stack, Text } from '@mantine/core';
import { mockParamFolder } from '@/TEST_TO_DELETE/mockParamFolder';
import { ParameterTreeNode } from '@/types/metadata';
import NestedMenu from '../common/NestedMenu';

interface PolicyParameterSelectorMenuProps {
  setSelectedParamLabel: (param: string) => void;
  parameterTree: ParameterTreeNode;
}

export default function PolicyParameterSelectorMenu({
  setSelectedParamLabel,
  parameterTree,
}: PolicyParameterSelectorMenuProps) {
  // Convert parameter tree to format expected by NestedMenu
  const menuOptions = parameterTree.children || [];

  return (
    <Stack h="100%">
      <Box>
        <SelectorMenuHeader />
        <Divider my="xs" />
        <Text fw={700} mb="md">
          TODO: Search feature
        </Text>
      </Box>

      <ScrollArea flex={1} type="scroll">
        <NestedMenu menuOptions={menuOptions} onItemClick={setSelectedParamLabel} />
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
