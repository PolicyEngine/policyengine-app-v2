import { render, screen } from '@test-utils';
import DashboardPage from '@/pages/Dashboard.page';

describe('DashboardPage component', () => {
  it('exists', () => {
    render(<DashboardPage />);
    expect(screen.getByText('TODO: Dashboard page')).toBeInTheDocument();
  });
});
