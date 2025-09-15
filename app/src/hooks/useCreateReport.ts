import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReport } from '@/api/report';
import { MOCK_USER_ID } from '@/constants';
import { reportKeys } from '@/libs/queryKeys';
import { ReportCreationPayload } from '@/types/payloads';
import { useCreateReportAssociation } from './useUserReportAssociations';

export function useCreateReport(reportLabel?: string) {
  const queryClient = useQueryClient();
  // const user = MOCK_USER_ID; // TODO: Replace with actual user context or auth hook in future
  const createAssociation = useCreateReportAssociation();

  const mutation = useMutation({
    mutationFn: ({ countryId, payload }: { countryId: string; payload: ReportCreationPayload }) =>
      createReport(countryId as any, payload),
    onSuccess: async (data) => {
      try {
        queryClient.invalidateQueries({ queryKey: reportKeys.all });

        console.log('Report label in useCreateReport:', reportLabel);

        // Create association with current user (or anonymous for session storage)
        const userId = MOCK_USER_ID; // TODO: Replace with actual user ID retrieval logic and add conditional logic to access user ID

        await createAssociation.mutateAsync({
          userId,
          reportId: String(data.id), // Convert the numeric ID from metadata to string
          label: reportLabel,
          isCreated: true,
        });
      } catch (error) {
        console.error('Report created but association failed:', error);
      }
    },
  });

  return {
    createReport: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}