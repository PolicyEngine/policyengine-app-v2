import { Button, Grid } from "@mantine/core";

export interface TwoButtonFooterProps {
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  primaryLabel: string;
  secondaryLabel: string;
}

export default function TwoButtonFooter(props: TwoButtonFooterProps) {
  const { onPrimaryClick, onSecondaryClick, primaryLabel, secondaryLabel } = props;
  return (
    <Grid>
      <Grid.Col span={6}>
        <Button variant="outline" onClick={onSecondaryClick} fullWidth>
          {secondaryLabel}
        </Button>
      </Grid.Col>
      <Grid.Col span={6}>
        <Button variant="filled" onClick={onPrimaryClick} fullWidth>
          {primaryLabel}
        </Button>
      </Grid.Col>
    </Grid>
  );
}