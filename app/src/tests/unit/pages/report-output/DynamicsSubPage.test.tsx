import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DynamicsSubPage from '@/pages/report-output/DynamicsSubPage';

describe('DynamicsSubPage', () => {
  it('renders dynamics placeholder', () => {
    render(<DynamicsSubPage />);
    expect(screen.getByText('Dynamics')).toBeInTheDocument();
  });
});
