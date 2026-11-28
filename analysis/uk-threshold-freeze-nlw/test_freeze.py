"""Invariants of the threshold paths and results, and the post's figures.

    pytest analysis/uk-threshold-freeze-nlw

Needs results.csv and meta.json from nlw_freeze.py. The live model test skips
when PolicyEngine UK is missing, and every other test runs without model code.
"""

import csv
import json
import re
from decimal import Decimal
from pathlib import Path

import pytest
from hypothesis import example, given, settings
from hypothesis import strategies as st

from thresholds import (
    ACTUAL_PA,
    ACTUAL_PT_WEEK,
    CHART_KINKS,
    CPI_SEP,
    NLW,
    PT_JUL22_WEEK,
    S57_PA,
    hand,
    rounded_weekly_path,
    s57_allowance,
    scenarios,
)

HERE = Path(__file__).resolve().parent
POST = HERE.parents[1] / "app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md"
POSTS = HERE.parents[1] / "app/src/data/posts/posts.json"
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
PART_TIME_LABELS = [
    "If the government had raised the NI threshold with the allowance",
    "If the government had raised the NI threshold from £242 a week by each September's CPI",
]
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


def table_rows(text: str = TEXT) -> list:
    return [
        cells(line) for line in text.splitlines()
        if line.startswith("|") and not line.startswith("| ---")
    ]


def spread(year: str, field: str, household: str = "single", sign: float = 1) -> str:
    values = [sign * float(row(year, household, scenario=s)[field]) for s in SCENARIOS]
    return f"{gbp(min(values))} to {gbp(max(values))}"


# Threshold paths


@settings(deadline=None)
@given(cpi_rates)
@example({year: 0.0 for year in range(2021, 2027)})
# £12,570 + £30 = £12,600, and 10% of £12,600 lands on a multiple of £10.
@example({2021: 0.002, 2022: 0.1, 2023: 0.0, 2024: 0.0, 2025: 0.0, 2026: 0.0})
def test_s57_steps_round_up_to_ten_pounds(rates):
    path = s57_allowance(rates)
    previous = ACTUAL_PA
    for year, allowance in path.items():
        step = allowance - previous
        exact = Decimal(previous) * Decimal(str(rates[year - 1]))
        assert step % 10 == 0
        assert exact <= step < exact + 10
        previous = allowance


@settings(deadline=None)
@given(st.floats(100, 400, allow_nan=False), cpi_rates)
def test_weekly_path_stays_within_50p_of_each_step(start, rates):
    previous = start
    for year, week in rounded_weekly_path(start, 2021, rates).items():
        assert abs(week - previous * (1 + rates[year - 1])) <= 0.5 + 1e-6
        previous = week


@settings(deadline=None)
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
    heading = f"**{year}, on pay of {pay}**"
    assert heading in TEXT
    labels = [
        "raised the NI threshold with the allowance",
        "raised £242 a week by each September's CPI from April 2023",
        "raised £242 a week by CPI since July 2022",
        "left the NI threshold at £12,570",
        "skipped the July 2022 rise and raised £184 a week by each September's CPI",
    ]
    tables = table_rows(TEXT.split(heading, 1)[1].split("**", 1)[0])
    for scenario, label in zip(SCENARIOS, labels):
        r = row(year, scenario=scenario)
        expected = [
            label, gbp(float(r["primary_threshold"])), gbp(float(r["freeze_income_tax"])),
            gbp(float(r["freeze_ni"])), gbp(float(r["freeze_tax_and_ni"])),
        ]
        assert expected in tables, expected


def test_part_time_table_matches_results():
    tables = table_rows()
    assert ["Hours a week", "Annual pay", *PART_TIME_LABELS] in tables
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
    assert [p["hours"] for p in spec["data"]] == sorted(
        [h / 2 for h in range(30, 81)] + list(CHART_KINKS)
    )
    assert [m["x"] for m in spec["markers"]] == [CHART_KINKS[0], CHART_KINKS[2]]
    assert [s["name"] for s in spec["series"]] == PART_TIME_LABELS
    for point in spec["data"]:
        hours = float(point["hours"])
        assert point["aligned"] == pytest.approx(float(row(hours=hours)["freeze_tax_and_ni"]), abs=0.01)
        cpi = row(hours=hours, scenario="ni_sep_cpi_from_jul22")
        assert point["septemberCpi"] == pytest.approx(float(cpi["freeze_tax_and_ni"]), abs=0.01)


def test_chart_kinks_fall_where_pay_reaches_each_threshold():
    thresholds = (ACTUAL_PA, PT_JUL22_WEEK[2026] * 52, S57_PA[2026])
    for hours, threshold in zip(CHART_KINKS, thresholds):
        assert hours == round(threshold / (NLW[2026] * 52), 2)


def test_prose_figures_match_results():
    a26, a27 = row("2026-27"), row("2027-28")
    couple26 = row("2026-27", "couple_two_children")
    couple27 = row("2027-28", "couple_two_children")
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
        f"They receive {gbp(float(row(household='lone_parent')['uc_base']))} of UC",
        f"pay {gbp(float(META['ni_2021_rules']['2026']['rules_2021']))} of NI in 2026-27",
        f"against {gbp(float(META['ni_2021_rules']['2026']['actual']))} now",
        f"pay {gbp(float(couple26['freeze_income_tax']))} more income tax in 2026-27 and "
        f"{gbp(float(couple27['freeze_income_tax']))} more in 2027-28",
        f"the £{S57_PA[2026] - ACTUAL_PA:,} and £{S57_PA[2027] - ACTUAL_PA:,} of pay",
        f"£{S57_PA[2026]:,} in 2026-27 and £{S57_PA[2027]:,} in 2027-28",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    # results.csv keeps the alternative allowances, which neither section 57 nor
    # unrounded CPI gives, and the post leaves them out.
    alternative = row("2027-28", path="alternative")
    assert f"£{float(alternative['allowance']):,.0f}" not in TEXT
    assert ACTUAL_PA / (NLW[2026] * 52) == pytest.approx(19.02, abs=0.01)
    assert S57_PA[2026] / (NLW[2026] * 52) == pytest.approx(24.33, abs=0.01)
    assert round(100 * (242 / 190 - 1)) == 27


def test_post_metadata_matches_results():
    entry = next(p for p in json.loads(POSTS.read_text()) if p["filename"] == POST.name)
    assert f"pays {gbp(float(row()['freeze_income_tax']))} more income tax in 2026-27" in entry["description"]
    assert f"they pay {spread('2026-27', 'freeze_tax_and_ni')} more income tax" in entry["description"]


def test_cpi_list_in_the_post_matches_the_script():
    listed = ", ".join(f"{100 * rate:.1f}%" for rate in list(CPI_SEP.values())[:-1])
    assert f"{listed} and {100 * CPI_SEP[2026]:.1f}%" in TEXT


def test_post_states_the_recorded_model_version():
    assert f"PolicyEngine UK {META['policyengine_uk']}" in TEXT


# The live model


@pytest.mark.parametrize("scenario", ["ni_tracks_allowance", "ni_sep_cpi_from_2021"])
def test_reform_keys_reproduce_the_recorded_rows(scenario):
    pytest.importorskip("policyengine_uk")
    from nlw_freeze import reform_for, run, situation

    sit = situation(2026, [("single", 35.0, "NORTH_WEST")])
    base = run(sit, 2026, None)
    allowance, threshold = scenarios(2026, S57_PA)[scenario]
    reformed = run(sit, 2026, reform_for(2026, allowance, threshold))
    recorded = row(scenario=scenario)
    tax = float(base["income_tax"][0] - reformed["income_tax"][0])
    ni = float(base["ni"][0] - reformed["ni"][0])
    assert tax == pytest.approx(float(recorded["freeze_income_tax"]), abs=0.01)
    assert ni == pytest.approx(float(recorded["freeze_ni"]), abs=0.01)
