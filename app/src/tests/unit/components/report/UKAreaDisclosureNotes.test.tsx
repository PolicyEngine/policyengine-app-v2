import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import UKAreaDisclosureNotes from '@/components/report/UKAreaDisclosureNotes';
import {
  NO_WITHHELD_CONSTITUENCIES,
  ONE_WITHHELD_CONSTITUENCY,
  SOME_WITHHELD_CONSTITUENCIES,
} from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

const CONSTITUENCIES = NORMALIZED_BREAKDOWN.constituency_impact.by_constituency;
const LOCAL_AUTHORITIES = NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority;

describe('UKAreaDisclosureNotes', () => {
  test('given counted withheld constituencies then says how many were not published and why', () => {
    // When
    render(
      <UKAreaDisclosureNotes
        level="constituency"
        areas={LOCAL_AUTHORITIES}
        withheld={SOME_WITHHELD_CONSTITUENCIES}
      />,
      'uk'
    );

    // Then
    expect(
      screen.getByText(
        '12 of 650 constituencies are not shown. The survey data’s disclosure rules withhold an area’s estimate when too few surveyed households support it, or when it could reveal a household’s income.'
      )
    ).toBeInTheDocument();
  });

  test('given one withheld constituency then the note reads in the singular', () => {
    // When
    render(
      <UKAreaDisclosureNotes
        level="constituency"
        areas={LOCAL_AUTHORITIES}
        withheld={ONE_WITHHELD_CONSTITUENCY}
      />,
      'uk'
    );

    // Then
    expect(screen.getByText(/^1 of 650 constituencies is not shown\./)).toBeInTheDocument();
  });

  test('given withheld areas that cannot be counted then says why areas may be missing, with no count', () => {
    // When
    render(
      <UKAreaDisclosureNotes level="local_authority" areas={LOCAL_AUTHORITIES} withheld={null} />,
      'uk'
    );

    // Then
    expect(
      screen.getByText(
        'Local authorities whose estimates fail the survey data’s disclosure rules are not shown. The rules withhold an area’s estimate when too few surveyed households support it, or when it could reveal a household’s income.'
      )
    ).toBeInTheDocument();
  });

  test('given no constituency withheld then there is no withheld note', () => {
    // When
    render(
      <UKAreaDisclosureNotes
        level="constituency"
        areas={LOCAL_AUTHORITIES}
        withheld={NO_WITHHELD_CONSTITUENCIES}
      />,
      'uk'
    );

    // Then
    expect(screen.queryByText(/not shown/)).not.toBeInTheDocument();
  });

  test('given a saved result with no disclosure control then there is no note', () => {
    // When
    const { container } = render(
      <UKAreaDisclosureNotes level="local_authority" areas={LOCAL_AUTHORITIES} />,
      'uk'
    );

    // Then
    expect(container).toBeEmptyDOMElement();
  });

  test('given an approximate constituency then says it is approximate and why its range is too narrow', () => {
    // When
    render(<UKAreaDisclosureNotes level="constituency" areas={CONSTITUENCIES} />, 'uk');

    // Then
    expect(
      screen.getByText(
        '1 constituency is approximate: few surveyed households support its estimate, so its 90% range understates the uncertainty.'
      )
    ).toBeInTheDocument();
  });
});
