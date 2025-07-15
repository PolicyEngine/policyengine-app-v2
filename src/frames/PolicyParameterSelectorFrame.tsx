import { Box, Grid, Stack } from '@mantine/core';
import PolicyParameterSelectorHeader from '@/components/policyParameterSelectorFrame/header';
import PolicyParameterSelectorMenu from '@/components/policyParameterSelectorFrame/paramSelectorMenu';
import { FlowComponentProps } from '@/flows/types';

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
              <p>TODO: Main Content</p>
            </Grid.Col>
          </Grid>
          <h3>TODO: Footer</h3>
        </Stack>
      </Box>
    </>
  );
}
