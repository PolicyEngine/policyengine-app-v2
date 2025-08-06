import { useUserPolicies } from '@/hooks/useUserPolicy';
import { FlowComponentProps } from '@/types/flow';
import { Stack, Text, Card } from '@mantine/core';
import { useState } from 'react';

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {

  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicyId, setLocalPolicyId] = useState<string | null>(null);
  
  function handlePolicySelect(policyId: string) {
    setLocalPolicyId(policyId);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  const userPolicies = data || [];

  let displayPolicies = null;

  if (userPolicies.length === 0) {
    displayPolicies = <Text>No policies available. Please create a new policy.</Text>;
  } else {
    const recentUserPolicies = userPolicies.slice(0, 5); // Display only the first 3 policies
    displayPolicies = recentUserPolicies.map((association) => (
      // TODO: Fix ID types
      <Card key={association.policy?.id} withBorder p="md" component="button" onClick={() => handlePolicySelect(association.policy?.id.toString() || '')}>
        <Stack>
          <Text fw={600}>{association.policy?.label}</Text>
        </Stack>
      </Card>
    ));
  }

  return (
    <Stack>
      <Text fw={700}>Select an Existing Policy</Text>
      <Text size="sm">
        Search
      </Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Recents</Text>
      <Stack>
        {displayPolicies}
      </Stack>
    </Stack>
  )
}