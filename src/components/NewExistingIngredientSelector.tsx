import { Box, Stack, Text, Card } from '@mantine/core';

export interface NewExistingIngredientSelectorProps {
  ingredientName: string;
  onClickCreateNew: () => void;
}
export default function NewExistingIngredientSelector(props: NewExistingIngredientSelectorProps) {
  const { ingredientName, onClickCreateNew } = props;

  return (
    <Box p="md">
      <Stack>
        <Text size="lg" fw={700}>TODO: Title</Text>
          {/* Temporarily make gray to show disabled state */}
          <Card disabled withBorder p="md" h="100%" component="button" onClick={() => {console.log('Existing Ingredient Clicked');}} bg="gray">
            <Stack>
              <Text fw={600}>Load existing {`${ingredientName}`}</Text>
              <Text size="sm" c="dimmed">
                Use a {`${ingredientName}`} you have already created
              </Text>
            </Stack>
          </Card>
          <Card withBorder p="md" h="100%" component="button" onClick={onClickCreateNew}>
            <Stack>
              <Text fw={600}>Create new {`${ingredientName}`}</Text>
              <Text size="sm" c="dimmed">
                Build a new {`${ingredientName}`}
              </Text>
            </Stack>
          </Card>
      </Stack>
    </Box>
  );
}