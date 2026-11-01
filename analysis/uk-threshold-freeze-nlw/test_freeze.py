"""Invariants of the threshold paths and results, and the post's figures.

    pytest analysis/uk-threshold-freeze-nlw

Needs results.csv and meta.json from nlw_freeze.py, and no model code.
"""

import csv
import json
import re
from pathlib import Path

import pytest
from hypothesis import given
from hypothesis import strategies as st

from thresholds import (
    ACTUAL_PA,
    ACTUAL_PT_WEEK,
    CPI_SEP,
    NLW,
    S57_PA,
    hand,
    rounded_weekly_path,
    s57_allowance,
)

HERE = Path(__file__).resolve().parent
POST = HERE.parents[1] / "app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md"
ROWS = list(csv.DictReader((HERE / "results.csv").open()))
META = json.loads((HERE / "meta.json").read_text())
TEXT = POST.read_text()

SCENARIOS = (
    "ni_tracks_allowance",
    "ni_sep_cpi_from_jul22",
    "ni_p2p_from_jul22",
    "allowance_only",
    "ni_sep_cpi_from_2021",
)
PARENT_KINDS = ("lone_parent", "lone_parent_council_tax", "couple_two_children")
HOUSEHOLD_YEARS = {"2026-27": 2026, "2027-28": 2027}

cpi_rates = st.fixed_dictionaries(
    {year: st.floats(0, 0.25, allow_nan=False) for year in range(2021, 2027)}
).map(lambda rates: {year: round(rate, 6) for year, rate in rates.items()})


def row(year="2026-27", household="single", hours=35.0, scenario="ni_tracks_allowance",
        path="s57", region="NORTH_WEST") -> dict:
    found = [
        r for r in ROWS
        if r["year"] == year and r["household"] == household and float(r["hours"]) == hours
        and r["scenario"] == scenario and r["allowance_path"] == path and r["region"] == region
    ]
    assert len(found) == 1, (year, household, hours, scenario, path, region)
    return found[0]


def gbp(value: float) -> str:
    text = f"£{abs(value):,.0f}"
    return f"−{text}" if round(value) < 0 else text


def cells(markdown_row: str) -> list:
    return [c.strip() for c in markdown_row.strip().strip("|").split("|")]


def table_rows() -> list:
    return [
        cells(line) for line in TEXT.splitlines()
        if line.startswith("|") and not line.startswith("| ---")
    ]


def spread(year: str, field: str, household: str = "single", sign: float = 1) -> str:
    values = [sign * float(row(year, household, scenario=s)[field]) for s in SCENARIOS]
    return f"{gbp(min(values))} to {gbp(max(values))}"


# Threshold paths


@given(cpi_rates)
def test_s57_steps_round_up_to_ten_pounds(rates):
    path = s57_allowance(rates)
    previous = ACTUAL_PA
    for year, allowance in path.items():
        exact = previous * rates[year - 1]
        assert (allowance - previous) % 10 == 0
        assert exact - 1e-6 <= allowance - previous < exact + 10 + 1e-6
        previous = allowance


@given(st.floats(100, 400, allow_nan=False), cpi_rates)
def test_weekly_path_stays_within_50p_of_each_step(start, rates):
    previous = start
    for year, week in rounded_weekly_path(start, 2021, rates).items():
        assert abs(week - previous * (1 + rates[year - 1])) <= 0.5 + 1e-6
        previous = week


@given(
    st.floats(0, 60_000, allow_nan=False),
    st.floats(ACTUAL_PA, 20_000, allow_nan=False),
    st.floats(ACTUAL_PA, 20_000, allow_nan=False),
)
def test_extra_tax_and_ni_stay_within_the_threshold_gaps(earnings, allowance, threshold):
    tax_now, ni_now = hand(earnings, ACTUAL_PA, ACTUAL_PA)
    tax_then, ni_then = hand(earnings, allowance, threshold)
    extra = (tax_now - tax_then) + (ni_now - ni_then)
    assert -1e-6 <= extra <= 0.20 * (allowance - ACTUAL_PA) + 0.08 * (threshold - ACTUAL_PA) + 1e-6


def test_s57_path_matches_the_recorded_run():
    assert {int(k): v for k, v in META["s57_allowance"].items()} == S57_PA
    assert S57_PA[2026] == 16_080
    assert S57_PA[2027] == 16_650


# Results


def test_results_add_up():
    for r in ROWS:
        extra = float(r["freeze_income_tax"]) + float(r["freeze_ni"])
        assert abs(extra - float(r["freeze_tax_and_ni"])) < 0.02
        offset = float(r["uc_if_indexed_minus_base"])
        assert abs(float(r["freeze_net_loss"]) - (extra + offset)) < 1


def test_results_match_plain_arithmetic_for_single_workers():
    for r in ROWS:
        if r["household"] != "single":
            continue
        earnings = float(r["earnings"])
        allowance = float(r["allowance"])
        threshold = float(r["primary_threshold"])
        tax_now, ni_now = hand(earnings, ACTUAL_PA, ACTUAL_PT_WEEK * 52)
        tax_then, ni_then = hand(earnings, allowance, threshold)
        assert abs(tax_now - tax_then - float(r["freeze_income_tax"])) < 1
        assert abs(ni_now - ni_then - float(r["freeze_ni"])) < 1


@pytest.mark.parametrize("year", HOUSEHOLD_YEARS)
@pytest.mark.parametrize("scenario", SCENARIOS[:4])
def test_extra_amount_rises_with_hours_and_starts_at_19_hours(year, scenario):
    hours = sorted(
        {float(r["hours"]) for r in ROWS if r["household"] == "single" and r["region"] == "NORTH_WEST"}
    )
    values = [float(row(year, hours=h, scenario=scenario)["freeze_tax_and_ni"]) for h in hours]
    assert all(a <= b + 0.01 for a, b in zip(values, values[1:]))
    assert all(v == 0 for h, v in zip(hours, values) if h <= (18 if year == "2027-28" else 19))


def test_uc_offsets_55p_in_the_pound_while_in_payment():
    for r in ROWS:
        if r["household"] in PARENT_KINDS and float(r["uc_base"]) + float(r["uc_if_indexed_minus_base"]) > 0:
            assert abs(float(r["uc_if_indexed_minus_base"]) + 0.55 * float(r["freeze_tax_and_ni"])) < 1


def test_more_hours_scotland_and_pensions_leave_the_35_hour_figures_alone():
    for year in HOUSEHOLD_YEARS:
        for scenario in SCENARIOS:
            base = row(year, scenario=scenario)
            same = [
                row(year, hours=37.5, scenario=scenario),
                row(year, hours=40.0, scenario=scenario),
                row(year, region="SCOTLAND", scenario=scenario),
                row(year, household="single_auto_enrolment", scenario=scenario),
            ]
            for other in same:
                assert abs(float(other["freeze_income_tax"]) - float(base["freeze_income_tax"])) < 1
                assert abs(float(other["freeze_ni"]) - float(base["freeze_ni"])) < 1
    pension = row(household="single_auto_enrolment")
    assert float(pension["income_tax_base"]) < float(row()["income_tax_base"])


def test_no_uc_for_the_single_renter_and_no_ctr_for_the_lone_parent():
    for year in HOUSEHOLD_YEARS:
        assert float(row(year, "single_social_rent")["uc_base"]) == 0
        assert float(row(year, "lone_parent_council_tax")["ctr_base"]) == 0


# The post


@pytest.mark.parametrize("year,pay", [("2026-27", "£23,132"), ("2027-28", "£24,042")])
def test_full_time_tables_match_results(year, pay):
    assert f"**{year}, on pay of {pay}**" in TEXT
    labels = [
        "kept the NI threshold equal to the allowance",
        "raised £242 a week by each September's CPI from April 2023",
        "raised £242 a week by CPI since July 2022",
        "left the NI threshold at £12,570",
        "skipped the July 2022 rise and raised £184 a week by each September's CPI",
    ]
    tables = table_rows()
    for scenario, label in zip(SCENARIOS, labels):
        r = row(year, scenario=scenario)
        expected = [
            label, gbp(float(r["primary_threshold"])), gbp(float(r["freeze_income_tax"])),
            gbp(float(r["freeze_ni"])), gbp(float(r["freeze_tax_and_ni"])),
        ]
        assert expected in tables, expected


def test_part_time_table_matches_results():
    tables = table_rows()
    for hours in (16.0, 20.0, 24.0, 25.0, 35.0):
        aligned = row(hours=hours)
        cpi = row(hours=hours, scenario="ni_sep_cpi_from_jul22")
        expected = [
            f"{hours:.0f}", gbp(float(aligned["earnings"])),
            gbp(float(aligned["freeze_tax_and_ni"])), gbp(float(cpi["freeze_tax_and_ni"])),
        ]
        assert expected in tables, expected


def test_chart_matches_results():
    spec = json.loads(re.search(r"```chart\n(.*?)\n```", TEXT, re.S).group(1))
    assert [p["hours"] for p in spec["data"]] == [h / 2 for h in range(30, 81)]
    for point in spec["data"]:
        hours = float(point["hours"])
        assert point["aligned"] == pytest.approx(float(row(hours=hours)["freeze_tax_and_ni"]), abs=0.01)
        cpi = row(hours=hours, scenario="ni_sep_cpi_from_jul22")
        assert point["septemberCpi"] == pytest.approx(float(cpi["freeze_tax_and_ni"]), abs=0.01)


def test_prose_figures_match_results():
    a26, a27 = row("2026-27"), row("2027-28")
    expected = [
        f"pays {gbp(float(a26['freeze_income_tax']))} more income tax in 2026-27",
        f"{gbp(float(a27['freeze_income_tax']))} more in 2027-28",
        f"pays {spread('2026-27', 'freeze_tax_and_ni')} more income tax and NI in 2026-27",
        f"{spread('2027-28', 'freeze_tax_and_ni')} more in 2027-28",
        f"they pay {spread('2026-27', 'freeze_tax_and_ni', 'lone_parent')} more income tax and NI",
        f"receive {spread('2026-27', 'uc_if_indexed_minus_base', 'lone_parent', -1)} more UC",
        f"have {spread('2026-27', 'freeze_net_loss', 'lone_parent')} less net income",
        f"{spread('2027-28', 'freeze_tax_and_ni', 'lone_parent')}, "
        f"{spread('2027-28', 'uc_if_indexed_minus_base', 'lone_parent', -1)}, "
        f"and {spread('2027-28', 'freeze_net_loss', 'lone_parent')}",
        f"they receive {gbp(float(row(household='lone_parent')['uc_base']))} of UC",
        f"pay {gbp(float(META['ni_2021_rules']['2026']['rules_2021']))} of NI in 2026-27",
        f"against {gbp(float(META['ni_2021_rules']['2026']['actual']))} now",
        f"would pay {gbp(float(row('2026-27', path='unrounded')['freeze_tax_and_ni']))}"
        f" and {gbp(float(row('2027-28', path='unrounded')['freeze_tax_and_ni']))} more",
        f"the £{S57_PA[2026] - ACTUAL_PA:,} and £{S57_PA[2027] - ACTUAL_PA:,} of pay",
        f"£{S57_PA[2026]:,} in 2026-27 and £{S57_PA[2027]:,} in 2027-28",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    assert ACTUAL_PA / (NLW[2026] * 52) == pytest.approx(19.02, abs=0.01)
    assert S57_PA[2026] / (NLW[2026] * 52) == pytest.approx(24.33, abs=0.01)
    assert round(100 * (242 / 190 - 1)) == 27


def test_cpi_list_in_the_post_matches_the_script():
    listed = ", ".join(f"{100 * rate:.1f}%" for rate in list(CPI_SEP.values())[:-1])
    assert f"{listed} and {100 * CPI_SEP[2026]:.1f}%" in TEXT


def test_post_states_the_recorded_model_version():
    assert f"PolicyEngine UK {META['policyengine_uk']}" in TEXT
    assert META["policyengine_uk_commit"] in TEXT
