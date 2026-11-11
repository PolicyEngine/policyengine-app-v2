"""Invariants of net income by hours, and the post's use of them.

    pytest analysis/uk-threshold-freeze-nlw

Needs hours.csv, hours_meta.json and results.csv. Runs no model code.
"""

import csv
import json
import re
from pathlib import Path

import pytest

from thresholds import (
    ACTUAL_PA,
    BAND_C_SHARE,
    BAND_D,
    CHART_KINKS,
    NLW,
    S57_PA,
    SINGLE_PERSON_SHARE,
    council_bill,
)

HERE = Path(__file__).resolve().parent
ROWS = list(csv.DictReader((HERE / "hours.csv").open()))
META = json.loads((HERE / "hours_meta.json").read_text())
RESULTS = list(csv.DictReader((HERE / "results.csv").open()))
TEXT = (HERE.parents[1] / "app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md").read_text()
PATH = "ni_tracks_allowance"
TWENTY_PERCENT_COUNCILS = ("kingston_upon_thames", "merton", "westminster")
# Oxford's scheme sets support by bands of weekly income, so a small change in
# income can cross a band and move Council Tax Reduction by more than the change.
BAND_SCHEMES = ("single_oxford", "lone_parent_oxford")


def number(row: dict, key: str) -> float:
    return float(row[key])


def rows_for(household: str, scenario: str = PATH) -> list:
    return [r for r in ROWS if r["household"] == household and r["scenario"] == scenario]


def at(household: str, hours: float, scenario: str = PATH) -> dict:
    return next(r for r in rows_for(household, scenario) if number(r, "hours") == hours)


def on_both_sides(row: dict, benefit: str) -> bool:
    return number(row, f"{benefit}_frozen") > 0 and number(row, f"{benefit}_raised") > 0


def on_neither_side(row: dict, benefit: str) -> bool:
    return number(row, f"{benefit}_frozen") == 0 and number(row, f"{benefit}_raised") == 0


def test_net_income_adds_up():
    for row in ROWS:
        expected = number(row, "extra_uc") + number(row, "extra_ctr") - number(row, "extra_tax_and_ni")
        assert number(row, "net_income_change") == pytest.approx(expected, abs=1)


def test_comparison_runs_frozen_less_raised():
    for row in ROWS:
        assert number(row, "extra_uc") == pytest.approx(number(row, "uc_frozen") - number(row, "uc_raised"), abs=0.02)
        assert number(row, "extra_ctr") == pytest.approx(number(row, "ctr_frozen") - number(row, "ctr_raised"), abs=0.02)


def test_a_worker_with_no_benefits_loses_all_of_the_extra_tax_and_ni():
    rows = rows_for("single")
    assert rows
    for row in rows:
        assert on_neither_side(row, "uc") and on_neither_side(row, "ctr")
        assert number(row, "net_income_change") == pytest.approx(-number(row, "extra_tax_and_ni"), abs=0.02)


def test_uc_gives_back_55p_of_each_pound_while_in_payment():
    checked = 0
    for row in ROWS:
        if on_both_sides(row, "uc"):
            assert number(row, "extra_uc") == pytest.approx(0.55 * number(row, "extra_tax_and_ni"), abs=0.5)
            checked += 1
    assert checked > 100


def test_ctr_gives_back_20p_of_each_pound_left_after_uc():
    """Where the scheme takes 20% of income above the applicable amount, and income
    counts UC, a family on both gets 20% of the 45p that UC leaves."""
    both, ctr_alone = 0, 0
    for row in ROWS:
        council = row["household"].removeprefix("single_").removeprefix("lone_parent_")
        tapering = on_both_sides(row, "ctr") and number(row, "extra_ctr") > 0
        if council not in TWENTY_PERCENT_COUNCILS or not tapering:
            continue
        extra = number(row, "extra_tax_and_ni")
        if on_both_sides(row, "uc"):
            assert number(row, "extra_ctr") == pytest.approx(0.2 * 0.45 * extra, abs=0.5)
            assert number(row, "net_income_change") == pytest.approx(-0.36 * extra, abs=1)
            both += 1
        elif on_neither_side(row, "uc"):
            assert number(row, "extra_ctr") == pytest.approx(0.2 * extra, abs=0.5)
            ctr_alone += 1
    assert both > 10


def test_no_one_loses_more_than_the_extra_tax_and_ni_or_gains_outside_band_schemes():
    gainers = []
    for row in ROWS:
        net, extra = number(row, "net_income_change"), number(row, "extra_tax_and_ni")
        if extra >= 0:
            assert net >= -extra - 1
            if net > 1:
                gainers.append(row["household"])
    assert set(gainers) <= set(BAND_SCHEMES)


def test_a_worker_who_pays_less_with_thresholds_frozen_keeps_at_most_that_amount():
    """On the path without the July 2022 rise, a worker between £12,272 and £12,570
    pays less NI with thresholds frozen, as intended, and UC takes back 55p of it."""
    paying_less = [row for row in ROWS if number(row, "extra_tax_and_ni") < 0]
    assert paying_less
    assert {row["scenario"] for row in paying_less} == {"ni_sep_cpi_from_2021"}
    for row in paying_less:
        assert 0 <= number(row, "net_income_change") <= -number(row, "extra_tax_and_ni") + 1


def test_band_scheme_gain_stays_where_the_bands_change():
    """A fall in income can keep a lone parent in Oxford in a higher band of support
    than the raised side reaches, which moves support by more than the fall."""
    gained = [number(r, "hours") for r in rows_for("lone_parent_oxford") if number(r, "net_income_change") > 1]
    assert gained == [23.5, 24.0, 24.5]
    for hours in gained:
        row = at("lone_parent_oxford", hours)
        assert number(row, "ctr_frozen") > number(row, "ctr_raised")


def test_pay_follows_the_national_living_wage():
    for row in ROWS:
        assert number(row, "earnings") == pytest.approx(NLW[2026] * number(row, "hours") * 52, abs=0.01)


def test_results_at_35_hours_match_the_main_script():
    for household in ("single", "lone_parent", "single_social_rent"):
        for scenario in {r["scenario"] for r in ROWS}:
            ours = at(household, 35.0, scenario)
            theirs = next(
                r for r in RESULTS
                if r["year"] == "2026-27" and r["household"] == household and float(r["hours"]) == 35.0
                and r["scenario"] == scenario and r["allowance_path"] == "s57" and r["region"] == "NORTH_WEST"
            )
            assert number(ours, "extra_tax_and_ni") == pytest.approx(float(theirs["freeze_tax_and_ni"]), abs=0.01)
            assert number(ours, "net_income_change") == pytest.approx(-float(theirs["freeze_net_loss"]), abs=0.01)


def test_chart_points_include_the_kinks_and_stay_within_the_range():
    hours = META["chart_hours"]
    assert hours == sorted(hours)
    assert set(CHART_KINKS) <= set(hours)
    assert hours[0] == 15 and hours[-1] == 40
    for household, runs_out in META["benefit_runs_out_at_hours"].items():
        assert set(runs_out.values()) <= set(hours), household


def test_chart_stays_close_to_the_model_between_its_points():
    for household, gap in META["largest_gap_between_chart_and_model_on_a_grid_of_0_01_hours"].items():
        assert gap < 3, household


def test_council_bills_follow_band_d():
    for council, band_d in BAND_D.items():
        assert council_bill(council) == pytest.approx(band_d * 8 / 9 * 0.75, abs=0.01)
    assert META["council_bills"]["KINGSTON_UPON_THAMES"] == pytest.approx(1_739.47, abs=0.01)


# Someone on UC's minimum income floor


def floor_row(income: int, self_employed: bool) -> dict:
    return next(
        r for r in META["minimum_income_floor"] if r["income"] == income and r["self_employed"] == self_employed
    )


def test_frozen_thresholds_lower_the_floor_and_raise_uc_for_someone_paying_no_more_tax():
    row = floor_row(8_000, True)
    assert row["floor_applies"]
    assert row["extra_tax_and_ni"] == 0
    assert row["floor_frozen"] < row["floor_raised"]
    assert row["uc_frozen"] > row["uc_raised"]
    assert row["net_income_change"] == pytest.approx(row["uc_frozen"] - row["uc_raised"], abs=0.01)
    assert row["net_income_change"] > 0


def test_uc_rises_by_55p_of_the_fall_in_the_floor():
    row = floor_row(8_000, True)
    assert row["uc_frozen"] - row["uc_raised"] == pytest.approx(0.55 * (row["floor_raised"] - row["floor_frozen"]), abs=1)


def test_the_same_income_as_pay_gains_nothing():
    for income in (3_000, 8_000, 12_000, 14_000, 16_000, 20_000, 24_000):
        row = floor_row(income, False)
        assert not row["floor_applies"]
        assert row["net_income_change"] <= 0


# Workers on higher pay


def earner(pay: int) -> dict:
    return next(r for r in META["higher_earners"] if r["pay"] == pay)


def test_higher_rate_payers_pay_40p_on_the_gap_in_the_allowance():
    gap = S57_PA[2026] - ACTUAL_PA
    for pay in (55_000, 60_000, 100_000):
        assert earner(pay)["extra_income_tax"] == pytest.approx(0.4 * gap, abs=0.5)
    assert earner(110_000)["allowance_raised"] - earner(110_000)["allowance_frozen"] == pytest.approx(gap, abs=0.5)


def test_someone_with_no_allowance_on_either_side_pays_no_more_income_tax():
    row = earner(150_000)
    assert row["allowance_frozen"] == row["allowance_raised"] == 0
    assert row["extra_income_tax"] == 0
    assert row["extra_ni"] == pytest.approx(0.08 * (S57_PA[2026] - ACTUAL_PA), abs=1)


# The post


def gbp(value: float) -> str:
    return f"£{abs(value):,.0f}"


def about(hours: float) -> str:
    return f"about {hours:.0f} hours"


def net(household: str, hours: float) -> float:
    return number(at(household, hours), "net_income_change")


def chart_titled(start: str) -> dict:
    specs = [json.loads(block) for block in re.findall(r"```chart\n(.*?)\n```", TEXT, re.S)]
    return next(spec for spec in specs if spec["title"].startswith(start))


def test_net_income_chart_matches_the_results():
    spec = chart_titled("Workers on UC lose less net income")
    series = {
        "noBenefits": "single",
        "loneParent": "lone_parent",
        "renter": "single_social_rent",
        "kingston": "single_kingston_upon_thames",
    }
    assert [s["key"] for s in spec["series"]] == list(series)
    assert [point["hours"] for point in spec["data"]] == META["chart_hours"]
    for point in spec["data"]:
        for key, household in series.items():
            assert point[key] == pytest.approx(net(household, point["hours"]), abs=0.01)
    runs_out = META["benefit_runs_out_at_hours"]["single_social_rent"]["uc_frozen"]
    assert [m["x"] for m in spec["markers"]] == [CHART_KINKS[0], CHART_KINKS[2], runs_out]
    assert f"PolicyEngine UK {META['policyengine_uk']}" in spec["source"]


def test_chart_says_which_way_the_comparison_runs():
    subtitle = chart_titled("Workers on UC lose less net income")["subtitle"]
    assert subtitle.startswith("Net income with thresholds frozen, minus net income if the government had raised")
    for household in ("single", "lone_parent", "single_social_rent", "single_kingston_upon_thames"):
        assert net(household, 35.0) < 0


def test_uc_and_council_tax_reduction_prose_matches_the_results():
    renter = META["benefit_runs_out_at_hours"]["single_social_rent"]
    kingston = META["benefit_runs_out_at_hours"]["single_kingston_upon_thames"]
    expected = [
        "Compared with raising the allowance and NI threshold together, they have "
        f"{gbp(net('single_social_rent', 24.33))} less net income from about 24.3 hours to {about(renter['uc_raised'])}, "
        "where their UC would have run out on that path. "
        f"With thresholds frozen, their UC runs out at {about(renter['uc_frozen'])}, and from there they have the full "
        f"{gbp(net('single_social_rent', 34.0))} less.",
        f"Band C bill of {gbp(META['council_bills']['KINGSTON_UPON_THAMES'])}",
        f"has {gbp(net('single_kingston_upon_thames', 25.0))} less net income from about 24.3 hours to {about(kingston['ctr_raised'])}",
        f"from {about(kingston['uc_frozen'])} they have the full {gbp(net('single_kingston_upon_thames', 34.0))} less",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    assert net("single_kingston_upon_thames", 25.0) == pytest.approx(net("single_kingston_upon_thames", 30.0), abs=0.05)


def test_other_councils_in_the_post_match_the_results():
    assert number(at("single_merton", 25.5), "ctr_frozen") > 0
    assert number(at("single_merton", 26.5), "ctr_frozen") == 0
    assert "by about 26 hours in [Merton]" in TEXT
    for household in ("single_newham", "single_westminster"):
        row = at(household, 15.0)
        assert on_neither_side(row, "ctr")
    assert "before 15 hours in [Newham]" in TEXT
    oxford = at("lone_parent_oxford", 24.0)
    assert f"a lone parent working 24 hours there has {gbp(number(oxford, 'net_income_change'))} more net income" in TEXT
    assert number(oxford, "net_income_change") > 0
    gap = number(oxford, "ctr_frozen") - number(oxford, "ctr_raised")
    assert f"a band with {gbp(gap)} more support" in TEXT
    assert f"From 25 hours, they have {gbp(net('lone_parent_oxford', 25.0))} less" in TEXT
    assert net("lone_parent_oxford", 25.0) < 0


def test_post_names_the_council_tax_bill_rules():
    assert "25% discount for living alone" in TEXT
    assert SINGLE_PERSON_SHARE == 0.75
    assert BAND_C_SHARE == 8 / 9


def test_floor_example_in_the_post_matches_the_results():
    row = floor_row(8_000, True)
    assert row["extra_tax_and_ni"] == 0
    extra_uc = gbp(row["uc_frozen"] - row["uc_raised"])
    assert f"£8,000 of profit pays no more tax with thresholds frozen and receives {extra_uc} more UC" in TEXT


def test_higher_earner_figures_in_the_post_match_the_results():
    gap = S57_PA[2026] - ACTUAL_PA
    extra_tax = gbp(earner(55_000)["extra_income_tax"])
    assert f"40p on each £1 of the {gbp(gap)} between the allowances, or {extra_tax} more income tax" in TEXT
    assert earner(150_000)["extra_income_tax"] == 0
    assert f"A worker on £150,000 has no allowance either way, so they pay {gbp(earner(150_000)['extra_ni'])} more NI and no more income tax" in TEXT
