import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Radio, Stack } from '@mantine/core';
import IngredientCreationStartView from '@/components/IngredientCreationStartView';
import { setGeographicScope } from '@/reducers/populationReducer';
import { FlowComponentProps } from '@/types/flow';

export default function SelectGeographicScopeFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [scope, setScope] = useState('national');

  const formInputs = (
    <Stack>
      <Radio.Group label="Geographic Scope" value={scope} onChange={setScope}>
        <Radio value="national" label="National" />
        <Radio value="state" label="State" />
        <Radio value="household" label="Household" />
      </Radio.Group>
    </Stack>
  );

  function submissionHandler() {
    dispatch(setGeographicScope(scope as any));
    onNavigate(scope); // directs to correct frame in flow
  }

  return (
    <IngredientCreationStartView
      title="Select Scope"
      formInputs={formInputs}
      submissionHandler={submissionHandler}
    />
  );
}
