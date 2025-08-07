import { render, screen } from '@test-utils';
import HomePage from '@/pages/Home.page';

describe('HomePage component', () => {
  it('exists', () => {
    render(<HomePage />);
    expect(screen.getByText('TODO: Home Page')).toBeInTheDocument();
  });
});
