import { useEffect, useState } from 'react';
import { Box, Grid, Stack, Text } from '@mantine/core';
import Header from '@/components/policyParameterSelectorFrame/header';
import Menu from '@/components/policyParameterSelectorFrame/menu';
import { FlowComponentProps } from '@/types/flow';
import MainEmpty from '@/components/policyParameterSelectorFrame/mainEmpty';
import Main from '@/components/policyParameterSelectorFrame/main';
import { mockParamMetadata } from '@/TEST_TO_DELETE/mockParamMetadata';
import { Parameter } from '@/types/parameter';

export default function PolicyParameterSelectorFrame({ onNavigate }: FlowComponentProps) {

  const [selectedLeafParam, setSelectedLeafParam] = useState<Parameter | null>(null);

  function handleMenuItemClick(paramLabel: string) {
    const param: Parameter | null = mockParamMetadata.parameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
    }
  }

  return (
    <>
      <Box h="100%" maw="100vw">
        <Stack>
          <Header />
          <Grid>
            <Grid.Col span={3}>
              <Menu setSelectedParamLabel={handleMenuItemClick}/>
            </Grid.Col>
            <Grid.Col span={9}>
              {selectedLeafParam ? (
                <Main param={selectedLeafParam} />
              ) : (
                <MainEmpty />
              )}
            </Grid.Col>
          </Grid>
          <Text fw={700}>TODO: Footer</Text>
        </Stack>
      </Box>
    </>
  );
}
