import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import NotFound, { metadata } from '../../../../../calculator-app/src/app/not-found';

describe('calculator 404 page', () => {
  test('given a path the calculator does not serve then the page says it could not be found', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('This page could not be found.')).toBeInTheDocument();
  });

  test('given the 404 page then it links back to the calculator root', () => {
    render(<NotFound />);

    expect(screen.getByRole('link', { name: 'Go to the calculator' })).toHaveAttribute('href', '/');
  });

  test('given the 404 page then its title says the page was not found', () => {
    expect(metadata.title).toBe('Page not found | PolicyEngine calculator');
  });
});
