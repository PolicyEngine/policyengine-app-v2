import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActionsColumnConfig, IngredientRecord } from './types';

interface ActionsColumnProps {
  config: ActionsColumnConfig;
  record: IngredientRecord;
}

export function ActionsColumn({ config, record }: ActionsColumnProps) {
  return (
    <div className="tw:flex tw:gap-1 tw:justify-end">
      {config.actions.map((action) => (
        <Tooltip key={action.action}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => config.onAction(action.action, record.id)}
              aria-label={action.tooltip}
            >
              {action.icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{action.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
