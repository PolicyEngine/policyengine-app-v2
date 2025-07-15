import { Box, Divider, Stack, Text } from '@mantine/core';
import { mockParamFolder } from '@/TEST_TO_DELETE/mockParamFolder';
import NestedMenu from '../common/nestedMenu';

export default function PolicyParameterSelectorMenu() {
  return (
    <Stack>
      <SelectorMenuHeader />
      <Divider my="xs" />
      <Text fw={700}>TODO: Search feature</Text>
      <NestedMenu menuOptions={mockParamFolder} />
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
