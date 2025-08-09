import { Button, Grid } from '@mantine/core';

export interface ButtonConfig {
  label: string;
  variant?: 'filled' | 'outline' | 'disabled' | 'default';
  onClick: () => void;
  isLoading?: boolean;
}

export interface MultiButtonFooterProps {
  buttons: ButtonConfig[];
}

export default function MultiButtonFooter(props: MultiButtonFooterProps) {
  const { buttons } = props;

  // Determine grid size based on number of buttons
  const GRID_WIDTH = 12;
  const DESIRED_COLS_FOR_TWO_BUTTONS = 2;
  const DESIRED_COLS_OTHERWISE = 3;

  const gridSize =
    buttons.length <= 2
      ? GRID_WIDTH / DESIRED_COLS_FOR_TWO_BUTTONS
      : GRID_WIDTH / DESIRED_COLS_OTHERWISE;

  return (
    <Grid>
      {buttons.map((button, index) => (
        <Grid.Col span={gridSize} key={index}>
          <Button
            variant={button.variant}
            disabled={button.variant === 'disabled'}
            onClick={button.onClick}
            fullWidth
            loading={button.isLoading}
          >
            {button.label}
          </Button>
        </Grid.Col>
      ))}
    </Grid>
  );
}
