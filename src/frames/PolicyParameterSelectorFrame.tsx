import { useState } from 'react';
import { Box, Grid, Stack, Text } from '@mantine/core';
import Header from '@/components/policyParameterSelectorFrame/Header';
import Main from '@/components/policyParameterSelectorFrame/Main';
import MainEmpty from '@/components/policyParameterSelectorFrame/MainEmpty';
import Menu from '@/components/policyParameterSelectorFrame/Menu';
import { mockParamMetadata } from '@/TEST_TO_DELETE/mockParamMetadata';
import { FlowComponentProps } from '@/types/flow';
import { ParameterMetadata } from '@/types/parameterMetadata';

export default function PolicyParameterSelectorFrame({
  onNavigate,
  onReturn,
  flowConfig,
  isInSubflow,
  flowDepth
}: FlowComponentProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);

  function handleMenuItemClick(paramLabel: string) {
    const param: ParameterMetadata | null = mockParamMetadata.parameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
    }
  }

  return (
    <>
      <Box h="100%" maw="100vw">
        <Stack>
          <Header onNavigate={onNavigate} onReturn={onReturn} flowConfig={flowConfig} isInSubflow={isInSubflow} flowDepth={flowDepth}/>
          <Grid>
            <Grid.Col span={3}>
              <Menu setSelectedParamLabel={handleMenuItemClick} />
            </Grid.Col>
            <Grid.Col span={9}>
              {selectedLeafParam ? <Main param={selectedLeafParam} /> : <MainEmpty />}
            </Grid.Col>
          </Grid>
          <Text fw={700}>TODO: Footer</Text>
        </Stack>
      </Box>
    </>
  );
}
