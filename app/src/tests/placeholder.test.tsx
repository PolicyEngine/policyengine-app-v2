import { render, screen } from '@test-utils';
import HomePage from '@/pages/Dashboard.page';

describe('HomePage component', () => {
  it('exists', () => {
    render(<HomePage />);
    expect(screen.getByText('TODO: Home Page')).toBeInTheDocument();
  });
});
