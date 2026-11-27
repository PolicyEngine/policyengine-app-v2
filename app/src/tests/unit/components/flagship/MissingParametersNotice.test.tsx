import { render, screen, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import MissingParametersNotice from '@/components/flagship/MissingParametersNotice';
import {
  REMOVED_PARAMETERS,
  REMOVED_US_PARAMETER,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';

describe('MissingParametersNotice', () => {
  test('given one parameter then it says so and names it', () => {
    render(
      <MissingParametersNotice subject="This reform" parameterPaths={[REMOVED_US_PARAMETER]} />
    );

    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent(
      'This reform cannot be run, because it changes a parameter that PolicyEngine’s model no longer has:'
    );
    expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
  });

  test('given several parameters then it names each one', () => {
    render(<MissingParametersNotice subject="This report" parameterPaths={REMOVED_PARAMETERS} />);

    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent(/changes parameters that/);
    expect(within(notice).getAllByRole('listitem')).toHaveLength(REMOVED_PARAMETERS.length);
  });

  test('given a closing sentence then it follows the list', () => {
    render(
      <MissingParametersNotice subject="This report" parameterPaths={[REMOVED_US_PARAMETER]}>
        Its stored results are shown as they were calculated.
      </MissingParametersNotice>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Its stored results are shown as they were calculated.'
    );
  });
});
