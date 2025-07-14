import { Box, Divider, Stack, Text } from "@mantine/core";
import { mockParamFolder } from "@/TEST_TO_DELETE/mockParamFolder";

export default function PolicyParameterSelectorMenu() {
  return (
    <Stack>
      <SelectorMenuHeader />
      <Divider my="xs" />
      <Text>TODO: Search feature</Text>
      {/* list of parameters */}
      <ParamList />
    </Stack>
  )
}

function SelectorMenuHeader() {
  return (
    <Box>
      <Text fw={700}>Select parameters</Text>
      <Text fw={400}>Make changes and add provisions to your policy</Text>
    </Box>
  )
}
