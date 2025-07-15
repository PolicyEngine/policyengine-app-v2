import { Box, Grid, Stack, Text } from '@mantine/core';
import PolicyParameterSelectorHeader from '@/components/policyParameterSelectorFrame/header';
import PolicyParameterSelectorMenu from '@/components/policyParameterSelectorFrame/menu';
import { FlowComponentProps } from '@/flows/types';
import PolicyParameterSelectorEmptyMain from '@/components/policyParameterSelectorFrame/mainEmpty';

export default function PolicyParameterSelectorFrame({ onNavigate }: FlowComponentProps) {
  return (
    <>
      <Box h="100%" maw="100vw">
        <Stack>
          <PolicyParameterSelectorHeader />
          <Grid>
            <Grid.Col span={3}>
              <PolicyParameterSelectorMenu />
            </Grid.Col>
            <Grid.Col span={9}>
              <PolicyParameterSelectorEmptyMain />
            </Grid.Col>
          </Grid>
          <Text fw={700}>TODO: Footer</Text>
        </Stack>
      </Box>
    </>
  );
}
