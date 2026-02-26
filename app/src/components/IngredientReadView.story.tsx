import type { Meta, StoryObj } from '@storybook/react';
import type { ColumnConfig, IngredientRecord } from './columns';
import IngredientReadView from './IngredientReadView';

const meta: Meta<typeof IngredientReadView> = {
  title: 'Report creation/IngredientReadView',
  component: IngredientReadView,
  args: {
    onBuild: () => {},
    enableSelection: true,
    isSelected: () => false,
    onSelectionChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof IngredientReadView>;

const policyColumns: ColumnConfig[] = [
  { key: 'label', header: 'Name', type: 'text' },
  { key: 'date', header: 'Date created', type: 'text' },
  { key: 'parameters', header: 'Parameters', type: 'text' },
];

const householdColumns: ColumnConfig[] = [
  { key: 'label', header: 'Name', type: 'text' },
  { key: 'members', header: 'Members', type: 'text' },
  { key: 'date', header: 'Date created', type: 'text' },
];

const policyData: IngredientRecord[] = [
  {
    id: 'pol-1',
    label: { text: 'Expand Child Tax Credit to $4,000' },
    date: { text: 'Feb 15, 2026' },
    parameters: { text: '3 parameters' },
  },
  {
    id: 'pol-2',
    label: { text: 'Universal basic income $500/month' },
    date: { text: 'Feb 10, 2026' },
    parameters: { text: '5 parameters' },
  },
  {
    id: 'pol-3',
    label: { text: 'Flat tax at 20%' },
    date: { text: 'Jan 28, 2026' },
    parameters: { text: '12 parameters' },
  },
];

const householdData: IngredientRecord[] = [
  {
    id: 'hh-1',
    label: { text: 'Smith family (4 members)' },
    members: { text: '4 members' },
    date: { text: 'Feb 20, 2026' },
  },
  {
    id: 'hh-2',
    label: { text: 'Single parent household' },
    members: { text: '2 members' },
    date: { text: 'Feb 12, 2026' },
  },
];

export const PolicyList: Story = {
  args: {
    ingredient: 'Policy',
    title: 'Your saved policies',
    subtitle: 'Select a policy to use in your simulation.',
    buttonLabel: 'New policy',
    isLoading: false,
    isError: false,
    data: policyData,
    columns: policyColumns,
  },
};

export const HouseholdList: Story = {
  args: {
    ingredient: 'Household',
    title: 'Your saved households',
    subtitle: 'Select a household to use in your simulation.',
    buttonLabel: 'New household',
    isLoading: false,
    isError: false,
    data: householdData,
    columns: householdColumns,
  },
};

export const Empty: Story = {
  args: {
    ingredient: 'Policy',
    title: 'Your saved policies',
    subtitle: 'Select a policy to use in your simulation.',
    buttonLabel: 'New policy',
    isLoading: false,
    isError: false,
    data: [],
    columns: policyColumns,
  },
};
