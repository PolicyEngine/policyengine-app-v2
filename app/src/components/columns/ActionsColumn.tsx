import { ActionIcon, Box, Tooltip } from '@mantine/core';
import { spacing } from '@/designTokens';
import { ActionsColumnConfig, IngredientRecord } from './types';

interface ActionsColumnProps {
  config: ActionsColumnConfig;
  record: IngredientRecord;
}

export function ActionsColumn({ config, record }: ActionsColumnProps) {
  return (
    <Box style={{ display: 'flex', gap: spacing.xs, justifyContent: 'flex-end' }}>
      {config.actions.map((action) => (
        <Tooltip key={action.action} label={action.tooltip} position="bottom" withArrow>
          <ActionIcon
            variant="light"
            color={action.color || 'gray'}
            size="lg"
            onClick={() => config.onAction(action.action, record.id)}
          >
            {action.icon}
          </ActionIcon>
        </Tooltip>
      ))}
    </Box>
  );
}
