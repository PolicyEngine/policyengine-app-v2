import type { Meta, StoryObj } from '@storybook/react';
import { RenameIngredientModal } from './RenameIngredientModal';

const meta: Meta<typeof RenameIngredientModal> = {
  title: 'Building blocks/RenameIngredientModal',
  component: RenameIngredientModal,
  args: {
    onClose: () => {},
    onRename: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RenameIngredientModal>;

export const Policy: Story = {
  args: {
    opened: true,
    currentLabel: 'My policy',
    ingredientType: 'policy',
  },
};

export const Report: Story = {
  args: {
    opened: true,
    currentLabel: '2026 analysis',
    ingredientType: 'report',
  },
};
