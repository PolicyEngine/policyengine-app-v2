import type { Meta, StoryObj } from '@storybook/react';
import PaginationControls from './PaginationControls';

const meta: Meta<typeof PaginationControls> = {
  title: 'Building blocks/PaginationControls',
  component: PaginationControls,
};

export default meta;
type Story = StoryObj<typeof PaginationControls>;

export const FirstPage: Story = {
  args: {
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalItems: 100,
      itemsPerPage: 10,
      onPageChange: () => {},
    },
  },
};

export const MiddlePage: Story = {
  args: {
    pagination: {
      currentPage: 5,
      totalPages: 10,
      totalItems: 100,
      itemsPerPage: 10,
      onPageChange: () => {},
    },
  },
};

export const LastPage: Story = {
  args: {
    pagination: {
      currentPage: 10,
      totalPages: 10,
      totalItems: 100,
      itemsPerPage: 10,
      onPageChange: () => {},
    },
  },
};

export const SinglePage: Story = {
  args: {
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 5,
      itemsPerPage: 10,
      onPageChange: () => {},
    },
  },
};
