import { render, screen } from '@test-utils';
import { vi } from 'vitest';
import HomePage from '@/pages/Home.page';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('HomePage component', () => {
  it('exists', () => {
    render(<HomePage />);
    expect(screen.getByText('TODO: Home Page')).toBeInTheDocument();
  });
});
