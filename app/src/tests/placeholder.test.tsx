import { render, screen } from '@test-utils';
import { vi } from 'vitest';
import HomePage from '@/pages/Dashboard.page';

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

describe('HomePage component', () => {
  it('exists', () => {
    render(<HomePage />);
    expect(screen.getByText('TODO: Home Page')).toBeInTheDocument();
  });
});
