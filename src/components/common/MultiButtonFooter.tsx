import { Button, Grid } from "@mantine/core";

export interface ButtonConfig {
  label: string;
  variant?: "filled" | "outline";
  onClick: () => void;
}

export interface MultiButtonFooterProps {
  buttons: ButtonConfig[];
}

export default function MultiButtonFooter(props: MultiButtonFooterProps) {
  const { buttons } = props;

  // Determine grid size based on number of buttons
  const GRID_WIDTH = 12;
  const gridSize = buttons.length > 2 ? 4 : 6; 

  return (
    <Grid>
      {buttons.map((button, index) => (
        <Grid.Col span={gridSize} key={index}>
          <Button variant={button.variant} onClick={button.onClick} fullWidth>
            {button.label}
          </Button>
        </Grid.Col>
      ))}
    </Grid>
  );
}