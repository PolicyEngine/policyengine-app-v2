"""Invariants of the national figures, and the post's use of them.

    pytest analysis/uk-threshold-freeze-nlw

Needs numpy and the national_*_certified files that national_freeze.py writes.
Runs no model code and reads no microdata.
"""

import csv
import json
import re
from pathlib import Path

import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from national_freeze import (
    BASELINE,
    FIVE_PATHS,
    HMRC_TEN_PERCENT,
    OBR_THRESHOLDS,
    SCENARIOS,
    SURVEY_HOUSEHOLD_FLOOR,
    allocate,
    counts_row,
    decile_rows,
    gini,
    pay_band_rows,
    pay_bands,
    poverty_rows,
    scenario_changes,
    scenario_thresholds,
    thin,
    totals_row,
)
from thresholds import OBR_INDEXED, S57_PA, YEARS, scenarios

HERE = Path(__file__).resolve().parent
POST = HERE.parents[1] / "app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md"
TEXT = POST.read_text()
LABEL = "certified"
PERCENT = 100


def table(name: str) -> list:
    return list(csv.DictReader((HERE / f"national_{name}_{LABEL}.csv").open()))


TOTALS = table("totals")
BASELINES = table("baseline")
DECILES = table("deciles")
BANDS = table("pay_bands")
POVERTY = table("poverty")
COUNTS = table("counts")
META = json.loads((HERE / f"national_meta_{LABEL}.json").read_text())
FISCAL_YEARS = ("2026-27", "2027-28")
FIRST, LAST = FIVE_PATHS[0], FIVE_PATHS[-1]


def total(year: str, scenario: str) -> dict:
    return next(r for r in TOTALS if r["year"] == year and r["scenario"] == scenario)


def counts(year: str, scenario: str) -> dict:
    return next(r for r in COUNTS if r["year"] == year and r["scenario"] == scenario)


def baseline(year: str) -> dict:
    return next(r for r in BASELINES if r["year"] == year)


def poverty(year: str, scenario: str, measure: str, group: str = "all") -> dict:
    return next(
        r for r in POVERTY
        if r["year"] == year and r["scenario"] == scenario and r["measure"] == measure and r["group"] == group
    )


def decile(year: str, scenario: str, number: int) -> dict:
    return next(
        r for r in DECILES if r["year"] == year and r["scenario"] == scenario and int(r["decile"]) == number
    )


def band(year: str, scenario: str, label: str) -> dict:
    return next(r for r in BANDS if r["year"] == year and r["scenario"] == scenario and r["band"] == label)


def spread_bn(year: str, field: str, sign: float = 1) -> tuple[float, float]:
    values = [sign * float(total(year, s)[field]) for s in FIVE_PATHS]
    return min(values), max(values)


def bn(value: float) -> str:
    return f"£{value:.1f}bn"


def gbp(value: float) -> str:
    text = f"£{abs(value):,.0f}"
    return f"−{text}" if round(value) < 0 else text


def thousands(value_m: float) -> str:
    return f"{round(abs(value_m) * 1_000):,},000"


# The scenarios


def test_five_paths_move_only_the_allowance_and_the_primary_threshold():
    for name in FIVE_PATHS:
        moved = scenario_thresholds(name)
        assert len(moved) == 2
        allowance, threshold = next(iter(moved.values())), list(moved.values())[1]
        for year in YEARS:
            expected_allowance, expected_threshold = scenarios(year, S57_PA)[name]
            assert allowance[year] == expected_allowance
            assert threshold[year] * 52 == pytest.approx(expected_threshold)


def test_hmrc_scenario_raises_each_limit_by_10_percent():
    moved = scenario_thresholds(HMRC_TEN_PERCENT)
    assert len(moved) == 3
    for year in YEARS:
        allowance, band_width, starting = (values[year] for values in moved.values())
        assert allowance == pytest.approx(12_570 * 1.1)
        assert band_width == pytest.approx(37_700 * 1.1)
        assert starting == pytest.approx(5_000 * 1.1)


def test_baseline_moves_no_threshold():
    assert scenario_thresholds(BASELINE) == {}


def test_every_scenario_holds_capital_gains_static():
    for name in SCENARIOS:
        changes = scenario_changes(name)
        for key, expected in (("elasticity", 0), ("mtr_elasticity", 0), ("separate_badr_elasticity", False)):
            values = changes[f"gov.simulation.capital_gains_responses.{key}"]
            assert set(values.values()) == {expected}
            assert len(values) == len(YEARS)


def test_obr_scenario_takes_the_obrs_thresholds():
    moved = scenario_thresholds(OBR_THRESHOLDS)
    for year in YEARS:
        indexed = OBR_INDEXED[year]
        allowance = moved["gov.hmrc.income_tax.allowances.personal_allowance.amount"][year]
        band_width = moved["gov.hmrc.income_tax.rates.uk[1].threshold"][year]
        assert allowance == indexed["personal_allowance"]
        assert allowance + band_width == indexed["higher_rate_threshold"]
        assert moved["gov.hmrc.national_insurance.class_1.employee_scale[1].threshold"][year] * 52 == pytest.approx(
            indexed["primary_threshold"]
        )
        assert moved["gov.hmrc.income_tax.rates.uk[2].threshold"][year] == 150_000


# Adding up, on made-up records


unit_amounts = st.lists(st.floats(-2_000, 2_000, allow_nan=False), min_size=1, max_size=6)


@given(
    unit_amounts,
    st.lists(st.tuples(st.integers(0, 5), st.floats(-2_000, 2_000, allow_nan=False)), min_size=1, max_size=20),
)
def test_allocate_conserves_each_units_amount(amounts, people):
    amount = np.array(amounts)
    unit = np.array([u % len(amounts) for u, _ in people])
    extra = np.array([e for _, e in people])
    shares, left = allocate(amount, unit, extra)
    assigned = np.bincount(unit, weights=shares, minlength=len(amounts))
    # A unit whose members' extra tax and NI cancels to 50p can give members
    # shares far above its amount, so the tolerance scales with those shares.
    tolerance = 1e-6 * (1 + np.bincount(unit, weights=np.abs(shares), minlength=len(amounts)))
    assert np.all(np.abs(assigned + left - amount) <= tolerance)


incomes = st.lists(st.floats(0, 1e6, allow_nan=False), min_size=2, max_size=40)
weights = st.floats(0.5, 500, allow_nan=False)


@given(incomes, st.data())
def test_gini_stays_between_0_and_1_and_ignores_scale(values, data):
    x = np.array(values)
    w = np.array(data.draw(st.lists(weights, min_size=len(values), max_size=len(values))))
    result = gini(x, w)
    assert -1e-9 <= result <= 1 + 1e-9
    if x.sum() > 1:
        assert gini(3 * x, w) == pytest.approx(result, abs=1e-9)


@given(st.floats(1, 1e6, allow_nan=False), st.lists(weights, min_size=2, max_size=20))
def test_gini_of_equal_incomes_is_zero(level, w):
    assert gini(np.full(len(w), level), np.array(w)) == pytest.approx(0, abs=1e-9)


@given(st.lists(st.integers(1, 100_000), min_size=3, max_size=20), st.lists(st.integers(1, 5), min_size=20, max_size=20))
def test_gini_treats_a_weight_as_that_many_records(values, counts_of_each):
    x = np.array(values, dtype=float)
    w = np.array(counts_of_each[: len(values)], dtype=float)
    repeated = np.repeat(x, w.astype(int))
    assert gini(x, w) == pytest.approx(gini(repeated, np.ones_like(repeated)), abs=1e-9)


@given(st.lists(st.floats(1_000, 100_000, allow_nan=False), min_size=4, max_size=20))
def test_a_transfer_from_richer_to_poorer_lowers_gini(values):
    x = np.sort(np.array(values))
    if x[-1] - x[0] < 4:
        return
    after = x.copy()
    after[0] += 1
    after[-1] -= 1
    w = np.ones_like(x)
    assert gini(after, w) <= gini(x, w) + 1e-12


def test_income_tax_outside_scotland_stays_within_the_total():
    base, res = made_up_records()
    row = totals_row(base, res)
    assert 0 < row["extra_income_tax_outside_scottish_income_tax_bn"] < row["extra_income_tax_bn"]


def test_gini_floors_negative_income_at_zero():
    w = np.ones(3)
    assert gini(np.array([-500.0, 0.0, 100.0]), w) == gini(np.array([0.0, 0.0, 100.0]), w)


def test_gini_matches_microdf():
    microdf = pytest.importorskip("microdf")
    rng = np.random.default_rng(0)
    x, w = rng.lognormal(10, 1, 5_000) - 2_000, rng.uniform(1, 5, 5_000)
    assert gini(x, w) == pytest.approx(microdf.MicroSeries(np.maximum(x, 0), weights=w).gini(), abs=1e-12)


def test_thin_applies_the_floor_to_the_survey_households_behind_a_change():
    size = SURVEY_HOUSEHOLD_FLOOR + 5
    survey = np.arange(size, dtype=float)
    everyone = np.ones(size, dtype=bool)
    changed = np.zeros(size, dtype=bool)
    assert not thin(survey, everyone, changed)
    changed[: SURVEY_HOUSEHOLD_FLOOR - 1] = True
    assert thin(survey, everyone, changed)
    changed[SURVEY_HOUSEHOLD_FLOOR - 1] = True
    assert not thin(survey, everyone, changed)


@pytest.mark.parametrize("year", YEARS)
@given(pay=st.floats(0, 1e7, allow_nan=False))
def test_pay_bands_place_every_pay_in_one_band(year, pay):
    assert sum(low <= pay < high for _, low, high in pay_bands(year)) == 1


def made_up_records(people: int = 60) -> tuple[dict, dict]:
    """Sixty people, one in each household and family, each with a survey household
    of their own. The raised side's tax and NI fall, and UC falls for half."""
    rng = np.random.default_rng(1)
    index = np.arange(people)
    pay = rng.uniform(5_000, 120_000, people)
    weight = rng.uniform(100, 900, people)
    tax = 0.2 * np.maximum(pay - 12_570, 0)
    ni = 0.08 * np.maximum(pay - 12_570, 0)
    uc = np.where(index % 2 == 0, 3_000.0, 0.0)
    net = pay - tax - ni + uc
    base = {
        "h_household_weight": weight,
        "p_person_weight": weight,
        "h_household_net_income": net,
        "h_equiv_household_net_income": net,
        "h_household_count_people": np.ones(people),
        "h_household_market_income": pay,
        "h_household_benefits": uc,
        "h_household_tax": tax + ni,
        "h_income_tax": tax,
        "h_national_insurance": ni,
        "h_pension_contributions": np.zeros(people),
        "h_household_income_decile": index % 10 + 1,
        "h_survey_household": index.astype(float),
        "p_household_index": index,
        "p_benunit_index": index,
        "p_income_tax": tax,
        "p_national_insurance": ni,
        "p_employment_income": pay,
        "p_age": np.full(people, 30.0),
        "p_is_SP_age": np.zeros(people),
        "p_in_poverty_bhc": (net < 20_000).astype(float),
        "p_is_hbai_dependent_child": np.zeros(people),
        "p_pays_scottish_income_tax": (index % 12 == 0).astype(float),
        "u_universal_credit": uc,
        "u_benefits": uc,
        "u_benunit_weight": weight,
        "b_universal_credit": uc,
    }
    extra_tax = np.where(pay > 16_080, 702.0, 0.0)
    extra_ni = np.where(pay > 16_080, 281.0, 0.0)
    extra_uc = np.where(uc > 0, 0.55 * (extra_tax + extra_ni), 0.0)
    res = {
        **base,
        "h_income_tax": tax - extra_tax,
        "h_national_insurance": ni - extra_ni,
        "h_household_tax": tax + ni - extra_tax - extra_ni,
        "h_household_benefits": uc - extra_uc,
        "h_household_net_income": net + extra_tax + extra_ni - extra_uc,
        "h_equiv_household_net_income": net + extra_tax + extra_ni - extra_uc,
        "p_income_tax": tax - extra_tax,
        "p_national_insurance": ni - extra_ni,
        "p_in_poverty_bhc": ((net + extra_tax + extra_ni - extra_uc) < 20_000).astype(float),
        "u_universal_credit": uc - extra_uc,
        "u_benefits": uc - extra_uc,
        "b_universal_credit": uc - extra_uc,
    }
    return base, res


def test_deciles_add_up_to_the_total():
    base, res = made_up_records()
    rows = decile_rows(base, res)
    row = totals_row(base, res)
    added = sum(r["households_m"] * r["average_net_income_change"] for r in rows) / 1e3
    assert added == pytest.approx(row["net_income_change_bn"], rel=1e-9)
    assert row["net_income_change_bn"] == pytest.approx(row["extra_benefits_bn"] - row["extra_income_tax_and_ni_bn"])


def test_pay_bands_add_up_to_the_all_employees_row():
    base, res = made_up_records()
    rows = pay_band_rows(base, res, 2026)
    everyone, parts = rows[-1], rows[:-1]
    assert everyone["band"] == "all employees"
    assert sum(r["employees_m"] for r in parts) == pytest.approx(everyone["employees_m"])
    added = sum(r["employees_m"] * r["average_net_income_change"] for r in parts)
    assert added == pytest.approx(everyone["employees_m"] * everyone["average_net_income_change"])


def test_a_band_with_few_survey_households_on_uc_leaves_its_uc_cells_blank():
    base, res = made_up_records()
    rows = pay_band_rows(base, res, 2026)
    for row in rows:
        pay = base["p_employment_income"]
        low, high = next(((a, b) for label, a, b in [*pay_bands(2026), ("all employees", 0, np.inf)] if label == row["band"]))
        on_uc = ((pay >= low) & (pay < high) & (base["u_universal_credit"] > 0)).sum()
        blank = row["share_in_family_on_uc"] is None
        assert blank == (on_uc < SURVEY_HOUSEHOLD_FLOOR)
        assert blank == (row["average_net_income_change_on_uc"] is None)


def test_counts_leave_a_thin_share_blank():
    base, res = made_up_records()
    gained = dict(res)
    net = base["h_household_net_income"].copy()
    net[: SURVEY_HOUSEHOLD_FLOOR - 1] -= 50
    gained["h_household_net_income"] = net
    assert counts_row(base, gained)["share_households_higher_net_income"] is None
    net[: SURVEY_HOUSEHOLD_FLOOR] -= 50
    assert counts_row(base, gained)["share_households_higher_net_income"] is not None


def test_poverty_rows_count_people_who_cross_the_line():
    base, res = made_up_records()
    row = next(r for r in poverty_rows(base, res) if r["group"] == "all")
    frozen, raised = base["p_in_poverty_bhc"] > 0, res["p_in_poverty_bhc"] > 0
    weight = base["p_person_weight"]
    assert row["people_change_m"] == pytest.approx((weight[frozen].sum() - weight[raised].sum()) / 1e6)
    assert (row["rate_frozen"] - row["rate_raised"]) * weight.sum() / 1e6 == pytest.approx(row["people_change_m"])


# The published tables


def test_recorded_checks_all_hold():
    failed = [
        (where, check)
        for where, checks in META["checks"].items()
        for check, held in checks.items()
        if held is not True
    ]
    assert failed == []
    assert len(META["checks"]) == 2 * (len(FIVE_PATHS) + 3)


def test_recorded_run_held_the_thresholds_each_scenario_set():
    held = META["parameters_held"]
    for year in YEARS:
        y = str(year)
        for name in FIVE_PATHS:
            allowance, threshold = scenarios(year, S57_PA)[name]
            assert held[name][y]["personal_allowance"] == allowance
            assert held[name][y]["primary_threshold_week"] * 52 == pytest.approx(threshold, abs=0.01)
            assert held[name][y]["basic_rate_band"] == 37_700
            assert held[name][y]["additional_rate_threshold"] == 125_140
        indexed = OBR_INDEXED[year]
        obr = held[OBR_THRESHOLDS][y]
        assert obr["personal_allowance"] == indexed["personal_allowance"]
        assert obr["personal_allowance"] + obr["basic_rate_band"] == indexed["higher_rate_threshold"]
        assert obr["additional_rate_threshold"] == 150_000
        base = held[BASELINE][y]
        assert base["personal_allowance"] == 12_570
        assert base["basic_rate_band"] == 37_700
        assert base["primary_threshold_week"] == pytest.approx(241.73, abs=0.01)


@pytest.mark.parametrize("row", TOTALS, ids=lambda r: f"{r['year']} {r['scenario']}")
def test_totals_add_up(row):
    get = lambda key: float(row[key])
    assert get("extra_income_tax_and_ni_bn") == pytest.approx(get("extra_income_tax_bn") + get("extra_ni_bn"), abs=0.002)
    parts = ("uc", "housing_benefit", "pension_credit", "ctr", "income_support", "working_tax_credit",
             "child_tax_credit", "other_benefits")
    assert get("extra_benefits_bn") == pytest.approx(sum(get(f"extra_{p}_bn") for p in parts), abs=0.006)
    assert get("net_income_change_bn") == pytest.approx(
        get("extra_benefits_bn") - get("extra_income_tax_and_ni_bn") - get("extra_other_tax_bn"), abs=0.004
    )
    assert get("net_income_change_bn") < 0 < get("extra_income_tax_bn")


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_five_paths_share_one_income_tax_figure(year):
    assert len({total(year, s)["extra_income_tax_bn"] for s in FIVE_PATHS}) == 1


@pytest.mark.parametrize("year", YEARS)
def test_extra_ni_rises_with_the_primary_threshold(year):
    fy = f"{year}-{(year + 1) % 100}"
    ordered = sorted(FIVE_PATHS, key=lambda s: scenarios(year, S57_PA)[s][1])
    values = [float(total(fy, s)["extra_ni_bn"]) for s in ordered]
    assert values == sorted(values)


def test_higher_thresholds_bring_fewer_people_into_tax():
    for year in FISCAL_YEARS:
        for name in FIVE_PATHS:
            row = counts(year, name)
            assert float(row["income_taxpayers_frozen_m"]) > float(row["income_taxpayers_raised_m"])
    allowance_only = counts("2026-27", "allowance_only")
    assert allowance_only["ni_payers_frozen_m"] == allowance_only["ni_payers_raised_m"]


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", [*FIVE_PATHS, OBR_THRESHOLDS])
def test_deciles_add_up_to_the_totals(year, scenario):
    rows = [decile(year, scenario, d) for d in range(1, 11)]
    added = sum(float(r["households_m"]) * float(r["average_net_income_change"]) for r in rows) / 1e3
    assert added == pytest.approx(float(total(year, scenario)["net_income_change_bn"]), abs=0.05)
    assert sum(float(r["households_m"]) for r in rows) == pytest.approx(float(baseline(year)["households_m"]), abs=0.01)


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", [*FIVE_PATHS, OBR_THRESHOLDS])
def test_pay_bands_add_up(year, scenario):
    rows = [r for r in BANDS if r["year"] == year and r["scenario"] == scenario]
    everyone = next(r for r in rows if r["band"] == "all employees")
    parts = [r for r in rows if r is not everyone]
    assert len(parts) == 8
    assert sum(float(r["employees_m"]) for r in parts) == pytest.approx(float(everyone["employees_m"]), abs=0.01)
    added = sum(float(r["employees_m"]) * float(r["average_net_income_change"]) for r in parts)
    assert added == pytest.approx(float(everyone["employees_m"]) * float(everyone["average_net_income_change"]), abs=30)


def test_no_published_cell_rests_on_too_few_survey_households():
    for rows in (DECILES, BANDS, POVERTY):
        assert [r for r in rows if r["thin"] != "False"] == []
    assert META["survey_household_floor"] == SURVEY_HOUSEHOLD_FLOOR == 10


def test_poverty_people_follow_the_rates():
    for row in POVERTY:
        difference = float(row["rate_frozen"]) - float(row["rate_raised"])
        assert difference * float(row["people_change_m"]) >= 0


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", FIVE_PATHS)
def test_freeze_raises_absolute_poverty_and_lowers_relative_poverty(year, scenario):
    for measure in ("absolute_bhc", "absolute_ahc"):
        assert float(poverty(year, scenario, measure)["people_change_m"]) > 0
    for measure in ("relative_bhc", "relative_ahc"):
        assert float(poverty(year, scenario, measure)["people_change_m"]) < 0


# The post


def chart(title_start: str) -> dict:
    specs = [json.loads(block) for block in re.findall(r"```chart\n(.*?)\n```", TEXT, re.S)]
    return next(spec for spec in specs if spec["title"].startswith(title_start))
