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
    no_allowance_and_less_ni,
    on_uc_floor,
    pay_band_rows,
    pay_bands,
    poverty_rows,
    scenario_changes,
    scenario_thresholds,
    simple_workers,
    thin,
    totals_row,
    without_thin_values,
)
from thresholds import OBR_INDEXED, S57_PA, YEARS, scenarios

HERE = Path(__file__).resolve().parent
POST = HERE.parents[1] / "app/src/data/posts/articles/uk-threshold-freeze-national-living-wage.md"
POSTS = HERE.parents[1] / "app/src/data/posts/posts.json"
TEXT = POST.read_text()
LABEL = "certified"


def table(name: str, label: str = LABEL) -> list:
    return list(csv.DictReader((HERE / f"national_{name}_{label}.csv").open()))


TOTALS = table("totals")
BASELINES = table("baseline")
DECILES = table("deciles")
BANDS = table("pay_bands")
POVERTY = table("poverty")
COUNTS = table("counts")
LATEST_TOTALS = table("totals", "latest")
META = json.loads((HERE / f"national_meta_{LABEL}.json").read_text())
LATEST_META = json.loads((HERE / "national_meta_latest.json").read_text())
FISCAL_YEARS = ("2026-27", "2027-28")
FIRST, LAST = FIVE_PATHS[0], FIVE_PATHS[-1]
# The post's labels for the paths, the same in its household tables and its UK-wide tables.
PATH_LABELS = {
    "ni_tracks_allowance": "raised the NI threshold with the allowance",
    "ni_sep_cpi_from_jul22": "raised £242 a week by each September's CPI from April 2023",
    "ni_p2p_from_jul22": "raised £242 a week by CPI since July 2022",
    "allowance_only": "left the NI threshold at £12,570",
    "ni_sep_cpi_from_2021": "skipped the July 2022 rise and raised £184 a week by each September's CPI",
}


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
    return f"£{abs(value):.1f} billion"


def one_decimal(value: float) -> str:
    text = f"{abs(value):.1f}"
    return f"−{text}" if round(value, 1) < 0 else text


def gbp(value: float) -> str:
    text = f"£{abs(value):,.0f}"
    return f"−{text}" if round(value) < 0 else text


def thousands(value_m: float) -> str:
    return f"{round(abs(value_m) * 1_000):,},000"


def signed_thousands(value_m: float) -> str:
    return f"{'+' if value_m > 0 else '−'}{thousands(value_m)}"


def percent(share: float, places: int = 0) -> str:
    return f"{share:.{places}%}"


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


def test_a_thin_row_keeps_its_labels_and_loses_its_values():
    tag = {"year": "2026-27", "scenario": "s"}
    rows = [
        {**tag, "band": "a", "employees_m": 1.0, "value": 5.0, "thin": True},
        {**tag, "band": "b", "employees_m": 2.0, "value": 6.0, "thin": False},
    ]
    blanked, kept = without_thin_values(rows, ("band", "employees_m"))
    assert blanked == {**tag, "band": "a", "employees_m": 1.0, "value": None, "thin": True}
    assert kept == rows[1]


def test_uc_floor_marks_the_household_of_anyone_it_applies_to():
    base = {
        "h_household_weight": np.ones(3),
        "p_household_index": np.array([0, 0, 1, 2]),
        "p_uc_mif_applies": np.array([0.0, 1.0, 0.0, 0.0]),
    }
    assert on_uc_floor(base).tolist() == [True, False, False]


def test_less_ni_counts_only_someone_with_no_allowance_on_both_sides():
    base = {
        "h_household_weight": np.ones(4),
        "p_household_index": np.arange(4),
        "p_personal_allowance": np.array([0.0, 0.0, 12_570.0, 0.0]),
        "p_national_insurance": np.full(4, 100.0),
    }
    res = {
        "p_personal_allowance": np.array([0.0, 0.0, 0.0, 5_000.0]),
        "p_national_insurance": np.array([124.0, 100.0, 124.0, 124.0]),
    }
    assert no_allowance_and_less_ni(base, res).tolist() == [True, False, False, False]


def test_simple_workers_leave_out_someone_with_a_trading_loss():
    pay, zeros = np.full(2, 23_000.0), np.zeros(2)
    base = {
        "p_employment_income": pay,
        "p_total_income": pay,
        "p_benunit_index": np.arange(2),
        "p_marriage_allowance": zeros,
        "p_is_SP_age": zeros,
        "p_pays_scottish_income_tax": zeros,
        "p_pension_contributions": zeros,
        "p_allowances": np.full(2, 12_570.0),
        "p_personal_allowance": np.full(2, 12_570.0),
        "p_ni_class_1_income": pay,
        "p_trading_loss": np.array([0.0, 500.0]),
    }
    assert simple_workers(base, {"p_marriage_allowance": zeros}).tolist() == [True, False]


def test_simple_workers_leave_out_a_family_with_a_marriage_allowance_on_either_side():
    pay, zeros = np.full(3, 23_000.0), np.zeros(3)
    base = {
        "p_employment_income": pay,
        "p_total_income": pay,
        "p_benunit_index": np.array([0, 0, 1]),
        "p_marriage_allowance": zeros,
        "p_is_SP_age": zeros,
        "p_pays_scottish_income_tax": zeros,
        "p_pension_contributions": zeros,
        "p_allowances": np.full(3, 12_570.0),
        "p_personal_allowance": np.full(3, 12_570.0),
        "p_ni_class_1_income": pay,
        "p_trading_loss": zeros,
    }
    raised = {"p_marriage_allowance": np.array([1_608.0, 0.0, 0.0])}
    assert simple_workers(base, raised).tolist() == [False, False, True]


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
        "p_total_income": pay,
        "p_personal_allowance": np.full(people, 12_570.0),
        "p_uc_mif_applies": np.zeros(people),
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
        "p_personal_allowance": np.full(people, 16_080.0),
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


def test_decile_percent_takes_net_income_on_the_raised_side():
    base, res = made_up_records()
    rows = decile_rows(base, res)
    for row in rows:
        m = base["h_household_income_decile"] == row["decile"]
        w = base["h_household_weight"][m]
        raised = float(np.dot(w, res["h_household_net_income"][m]))
        frozen = float(np.dot(w, base["h_household_net_income"][m]))
        assert row["percent_net_income_change"] == pytest.approx(100 * (frozen - raised) / raised)


def test_counts_split_those_with_higher_net_income_by_why():
    base, res = made_up_records()
    gained = dict(res)
    net = base["h_household_net_income"].copy()
    net[:30] -= 50
    gained["h_household_net_income"] = net
    mif = np.zeros(len(net))
    mif[:15] = 1
    floor_base = {**base, "p_uc_mif_applies": mif}
    row = counts_row(floor_base, gained)
    w = base["h_household_weight"]
    assert row["share_of_those_higher_on_uc_minimum_income_floor"] == pytest.approx(w[:15].sum() / w[:30].sum())
    assert row["share_of_those_higher_with_no_allowance_and_less_ni"] is None
    mif[:25] = 1
    assert counts_row(floor_base, gained)["share_of_those_higher_on_uc_minimum_income_floor"] is None


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
    tables = ((DECILES, ("decile", "households_m")), (BANDS, ("band", "employees_m")), (POVERTY, ("measure", "group")))
    for rows, labels in tables:
        for row in rows:
            if row["thin"] != "False":
                assert row["scenario"] == HMRC_TEN_PERCENT
                values = {k: v for k, v in row.items() if k not in ("year", "scenario", "thin", *labels)}
                assert set(values.values()) == {""}
    assert META["survey_household_floor"] == SURVEY_HOUSEHOLD_FLOOR == 10


def test_poverty_people_follow_the_rates():
    for row in POVERTY:
        if row["thin"] == "False":
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


def post_table(heading: str) -> list:
    """The body rows of the table that follows a bold heading in the post."""
    after = TEXT.split(f"**{heading}**", 1)[1].lstrip("\n")
    lines = []
    for line in after.splitlines():
        if not line.startswith("|"):
            break
        lines.append([cell.strip() for cell in line.strip("|").split("|")])
    return lines[2:]


def tax_and_ni(year: str, scenario: str) -> float:
    return float(total(year, scenario)["extra_income_tax_and_ni_bn"])


def test_summary_spreads_match_the_totals():
    first, second = (spread_bn(year, "extra_income_tax_and_ni_bn") for year in FISCAL_YEARS)
    assert (
        f"Households pay {bn(first[0])} to {bn(first[1])} more income tax and NI in 2026-27 across the five paths, "
        f"and {bn(second[0])} to {bn(second[1])} more in 2027-28." in TEXT
    )


def test_about_3p_of_each_pound_comes_back_on_every_path():
    for year in FISCAL_YEARS:
        for scenario in FIVE_PATHS:
            assert 0.025 <= float(total(year, scenario)["extra_benefits_bn"]) / tax_and_ni(year, scenario) < 0.035
    assert TEXT.count("about 3p of each £1 back") == 2


def test_description_carries_the_uk_wide_spread():
    entry = next(e for e in json.loads(POSTS.read_text()) if e["filename"] == POST.name)
    low, high = spread_bn("2026-27", "extra_income_tax_and_ni_bn")
    assert f"We estimate UK households pay {bn(low)} to {bn(high)} more." in entry["description"]


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_totals_tables_match_the_results(year):
    expected = [
        [
            PATH_LABELS[s],
            *(
                one_decimal(float(total(year, s)[key]))
                for key in ("extra_income_tax_bn", "extra_ni_bn", "extra_benefits_bn", "net_income_change_bn")
            ),
        ]
        for s in FIVE_PATHS
    ]
    assert post_table(f"{year}, in £ billion") == expected


def test_uk_wide_tables_use_the_labels_of_the_household_tables():
    for label in PATH_LABELS.values():
        assert TEXT.count(f"| {label} ") == 4


def test_average_household_figures_match_the_results():
    row, year = total("2026-27", FIRST), "2026-27"
    average = -float(row["net_income_change_bn"]) / float(baseline(year)["households_m"]) * 1e3
    shares = counts(year, FIRST)
    lower, higher = float(shares["share_households_lower_net_income"]), float(shares["share_households_higher_net_income"])
    assert (
        f"With thresholds frozen, households have {gbp(average)} less net income on average in 2026-27 "
        f"than if the government had {PATH_LABELS[FIRST]}: "
        f"{percent(lower)} have less, {percent(1 - lower - higher)} have the same and {percent(higher, 1)} have more."
    ) in TEXT
    everyone = band(year, FIRST, "all employees")
    assert f"We estimate {percent(float(everyone['share_in_family_on_uc']))} of employees aged 21 to State Pension age live in a family on UC" in TEXT


def test_nearly_all_households_with_more_net_income_on_the_main_path_include_someone_on_the_uc_floor():
    for year in FISCAL_YEARS:
        assert float(counts(year, FIRST)["share_of_those_higher_on_uc_minimum_income_floor"]) > 0.9
    assert "More than 90% of the households with more net income include someone on UC's minimum income floor." in TEXT


def test_most_households_with_more_net_income_on_the_fifth_path_include_someone_with_no_allowance():
    row = counts("2026-27", LAST)
    higher = float(row["share_households_higher_net_income"])
    assert float(row["share_of_those_higher_with_no_allowance_and_less_ni"]) > 0.5
    fifth_threshold = scenarios(2026, S57_PA)[LAST][1]
    no_allowance_from = 100_000 + 2 * S57_PA[2026]
    less_ni = 0.08 * (12_570 - fifth_threshold)
    assert (
        f"With thresholds frozen, {percent(higher, 1)} of households have more net income in 2026-27 "
        f"than if the government had {PATH_LABELS[LAST]}. "
        f"Most of them include someone on more than {gbp(no_allowance_from)}, who has no allowance either way "
        f"and pays {gbp(less_ni)} less NI."
    ) in TEXT


def test_chart_of_deciles_matches_the_results():
    spec = chart("Households in the ninth income decile")
    assert [s["key"] for s in spec["series"]] == ["aligned", "allowanceOnly"]
    assert spec["series"][0]["name"] == f"If the government had {PATH_LABELS[FIRST]}"
    assert spec["series"][1]["name"] == f"If the government had {PATH_LABELS['allowance_only']}"
    assert len(spec["data"]) == 10
    for number, point in enumerate(spec["data"], start=1):
        assert point["aligned"] == round(float(decile("2026-27", FIRST, number)["percent_net_income_change"]), 2)
        assert point["allowanceOnly"] == round(float(decile("2026-27", "allowance_only", number)["percent_net_income_change"]), 2)
    for key in ("aligned", "allowanceOnly"):
        assert min(spec["data"], key=lambda p: p[key])["decile"] == "9th"
    assert f"PolicyEngine UK {META['policyengine_uk']}" in spec["source"]


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", FIVE_PATHS)
def test_ninth_decile_loses_the_largest_share_on_every_path(year, scenario):
    shares = {n: float(decile(year, scenario, n)["percent_net_income_change"]) for n in range(1, 11)}
    assert min(shares, key=shares.get) == 9


def test_decile_prose_matches_the_results():
    year = "2026-27"
    lowest, ninth, top = (decile(year, FIRST, n) for n in (1, 9, 10))
    share = lambda row: f"{abs(float(row['percent_net_income_change'])):.1f}%"
    expected = [
        f"Households in the ninth income decile have {share(ninth)} less net income in 2026-27",
        f"households in the lowest decile have {share(lowest)} less",
        f"households in the lowest decile pay {gbp(float(lowest['average_extra_income_tax_and_ni']))} more income tax and NI on average in 2026-27 "
        f"than if the government had {PATH_LABELS[FIRST]}. "
        f"They receive {gbp(float(lowest['average_extra_benefits']))} more in benefits and have {share(lowest)} less net income",
        f"Those in the ninth decile lose the largest share: {share(ninth)}, or {gbp(abs(float(ninth['average_net_income_change'])))}.",
        f"households in the top decile lose {share(top)}, or {gbp(abs(float(top['average_net_income_change'])))}.",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    fifth, sixth, second = (decile(year, FIRST, n) for n in (5, 6, 2))
    assert f"{share(fifth)} and {share(sixth)} in the fifth and sixth deciles, against {share(second)} in the second" in TEXT


def test_pay_band_table_matches_the_results():
    year = "2026-27"
    rows = [r for r in BANDS if r["year"] == year and r["scenario"] == FIRST]
    expected = []
    for row in rows:
        blank = row["share_in_family_on_uc"] == ""
        expected.append(
            [
                row["band"][0].upper() + row["band"][1:],
                f"{float(row['employees_m']):.1f}",
                "–" if blank else percent(float(row["share_in_family_on_uc"])),
                gbp(float(row["average_extra_income_tax_and_ni"])),
                gbp(float(row["average_net_income_change"])),
                "–" if blank else gbp(float(row["average_net_income_change_on_uc"])),
            ]
        )
    assert post_table("Employees by annual pay, 2026-27, if the government had raised the NI threshold with the allowance") == expected


def test_pay_band_prose_matches_the_results():
    year = "2026-27"
    middle = band(year, FIRST, "£20,000 to £25,000")
    lowest = band(year, FIRST, "up to £12,570")
    extra, net = float(middle["average_extra_income_tax_and_ni"]), float(middle["average_net_income_change"])
    on_uc = float(middle["average_net_income_change_on_uc"])
    not_on_uc = float(middle["average_net_income_change_not_on_uc"])
    expected = [
        f"On that path, the {float(middle['employees_m']):.1f} million employees on £20,000 to £25,000, a band that includes full-time pay at the National Living Wage, "
        f"pay {gbp(extra)} more income tax and NI on average in 2026-27 and have {gbp(abs(net))} less net income.",
        f"We estimate {float(middle['employees_m']):.1f} million of them earn £20,000 to £25,000 in 2026-27",
        f"They pay {gbp(extra)} more income tax and NI on average than if the government had raised the NI threshold with the allowance, and have {gbp(abs(net))} less net income.",
        f"The {percent(float(middle['share_in_family_on_uc']))} in a family on UC have {gbp(abs(on_uc))} less, and the rest have {gbp(abs(not_on_uc))} less.",
        f"Employees on up to £12,570 pay {gbp(float(lowest['average_extra_income_tax_and_ni']))} more on average because "
        f"{percent(float(lowest['share_with_total_income_above_frozen_allowance']))} of them have other income",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    assert extra > 983


def test_poverty_table_matches_the_results():
    year = "2026-27"
    names = {
        "absolute_bhc": "Absolute poverty, before housing costs",
        "absolute_ahc": "Absolute poverty, after housing costs",
        "relative_bhc": "Relative poverty, before housing costs",
        "relative_ahc": "Relative poverty, after housing costs",
    }
    expected = []
    for measure, name in names.items():
        everyone = poverty(year, FIRST, measure)
        children = poverty(year, FIRST, measure, "children")
        expected.append(
            [
                name,
                percent(float(everyone["rate_frozen"]), 1),
                percent(float(everyone["rate_raised"]), 1),
                signed_thousands(float(everyone["people_change_m"])),
                signed_thousands(float(children["people_change_m"])),
            ]
        )
    assert post_table("2026-27, if the government had raised the NI threshold with the allowance") == expected


def test_poverty_prose_matches_the_results():
    year = "2026-27"
    people = [float(poverty(year, s, "absolute_bhc")["people_change_m"]) for s in FIVE_PATHS]
    children = [float(poverty(year, s, "absolute_bhc", "children")["people_change_m"]) for s in FIVE_PATHS]
    assert (
        f"Across the five paths, we estimate {thousands(min(people))} to {thousands(max(people))} more people, "
        f"including {thousands(min(children))} to {thousands(max(children))} children, fall below the absolute line"
    ) in TEXT
    absolute = float(poverty(year, FIRST, "absolute_bhc")["people_change_m"])
    relative = float(poverty(year, FIRST, "relative_bhc")["people_change_m"])
    assert (
        f"On that path, {thousands(absolute)} more people fall below the absolute poverty line before housing costs in 2026-27, "
        f"and {thousands(relative)} fewer fall below the relative line"
    ) in TEXT


def test_gini_prose_matches_the_results():
    row = total("2026-27", FIRST)
    assert f"the Gini index of net income, adjusted for household size, rises from {float(row['gini_raised']):.3f} to {float(row['gini_frozen']):.3f} with thresholds frozen" in TEXT
    obr = total("2026-27", OBR_THRESHOLDS)
    assert (
        f"The Gini index would reach {float(obr['gini_raised']):.3f}, against {float(obr['gini_frozen']):.3f} with thresholds frozen, "
        "the opposite direction from our five paths."
    ) in TEXT


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_thresholds_frozen_move_the_gini_index_opposite_ways_on_the_paths_and_the_obrs_levels(year):
    for scenario in FIVE_PATHS:
        assert float(total(year, scenario)["gini_frozen"]) > float(total(year, scenario)["gini_raised"])
    assert float(total(year, OBR_THRESHOLDS)["gini_frozen"]) < float(total(year, OBR_THRESHOLDS)["gini_raised"])


# Published figures the post compares with, from the OBR's October 2026 receipts
# tables (4.17, 4.18), its October 2026 outlook (Table A.5), its November 2025 outlook
# (Box 3.3, Table A) and HMRC's June 2025 ready reckoner.
ACTUAL_ALLOWANCE = 12_570
OBR_YIELD = {"2026-27": 32.667158242427405 + 0.91, "2027-28": 38.22560300197248 + 0.94}
OBR_BROUGHT_IN = {"2026-27": 4.83, "2027-28": 5.3}
OBR_PENSION_TAX_ALLOWANCE = {"2026-27": 0, "2027-28": 0.289}
OBR_RECEIPTS = {"2026-27": 365.4, "2027-28": 392.2}
OBR_EMPLOYEE_NI = {"2026-27": -1.3, "2027-28": -0.5}
HMRC_TEN_PERCENT_COST = {"2026-27": 14.4, "2027-28": 17.7}


def test_obr_thresholds_in_the_post_match_the_scenario():
    first, second = OBR_INDEXED[2026], OBR_INDEXED[2027]
    expected = (
        f"it puts the Personal Allowance at {gbp(first['personal_allowance'])} and {gbp(second['personal_allowance'])}, "
        f"the higher rate threshold at {gbp(first['higher_rate_threshold'])} and {gbp(second['higher_rate_threshold'])} "
        f"and the NI primary threshold at {gbp(first['primary_threshold'])} and {gbp(second['primary_threshold'])}, "
        "with the additional rate threshold back at £150,000."
    )
    assert expected in TEXT


def test_obr_taxpayer_comparison_matches_the_results():
    brought = {
        year: float(counts(year, OBR_THRESHOLDS)["income_taxpayers_frozen_m"])
        - float(counts(year, OBR_THRESHOLDS)["income_taxpayers_raised_m"])
        for year in FISCAL_YEARS
    }
    first, second = FISCAL_YEARS
    assert (
        f"we estimate {brought[first]:.1f} million more people pay income tax in 2026-27 with thresholds frozen "
        f"and {brought[second]:.1f} million more in 2027-28. The OBR estimates {OBR_BROUGHT_IN[first]:.1f} million "
        f"and {OBR_BROUGHT_IN[second]:.1f} million, after it takes off {OBR_PENSION_TAX_ALLOWANCE[second]:.1f} million "
        "for the Pension Tax Allowance in 2027-28"
    ) in TEXT


def test_obr_yield_comparison_matches_the_results():
    first, second = FISCAL_YEARS
    ours = {year: float(total(year, OBR_THRESHOLDS)["extra_income_tax_bn"]) for year in FISCAL_YEARS}
    gaps = {f"{ours[year] / OBR_YIELD[year] - 1:.0%}" for year in FISCAL_YEARS}
    assert gaps == {"26%"}
    assert (
        f"In its Table 4.17, the OBR puts the yield from freezing the income tax thresholds at {bn(OBR_YIELD[first])} and {bn(OBR_YIELD[second])}. "
        f"Our estimate against those levels, {bn(ours[first])} and {bn(ours[second])}, exceeds that by 26% in each year."
    ) in TEXT
    trail = [1 - float(baseline(year)["income_tax_bn"]) / OBR_RECEIPTS[year] for year in FISCAL_YEARS]
    assert "Our baseline income tax receipts trail [its forecast]" in TEXT
    assert f"by {trail[0]:.0%} and {trail[1]:.0%}." in TEXT


def test_obr_top_decile_comparison_matches_the_results():
    top = float(decile("2026-27", OBR_THRESHOLDS, 10)["average_net_income_change"])
    assert f"With its levels, households in the top decile would have {gbp(abs(top))} more net income on average" in TEXT
    assert top < 0
    assert f"exceeds the {gbp(S57_PA[2026] + 37_700)} on our five paths in 2026-27" in TEXT
    assert OBR_INDEXED[2026]["higher_rate_threshold"] > S57_PA[2026] + 37_700
    assert f"exceeds their {gbp(100_000 + 2 * ACTUAL_ALLOWANCE)}" in TEXT


def test_obr_employee_ni_comparison_matches_the_results():
    first, second = (float(total(year, LAST)["extra_ni_bn"]) for year in FISCAL_YEARS)
    assert first < 0 < second
    assert OBR_EMPLOYEE_NI["2026-27"] < 0 and OBR_EMPLOYEE_NI["2027-28"] < 0
    assert (
        f"the OBR puts employee NI {bn(OBR_EMPLOYEE_NI['2026-27'])} and {bn(OBR_EMPLOYEE_NI['2027-28'])} lower with thresholds frozen in those years. "
        f"On our closest path, which skips the July 2022 rise, we estimate {bn(first)} less in 2026-27 and {bn(second)} more in 2027-28."
    ) in TEXT


def test_hmrc_comparison_matches_the_results():
    first, second = FISCAL_YEARS
    ours = {year: float(total(year, HMRC_TEN_PERCENT)["extra_income_tax_outside_scottish_income_tax_bn"]) for year in FISCAL_YEARS}
    above = ours[first] / HMRC_TEN_PERCENT_COST[first] - 1
    below = 1 - ours[second] / HMRC_TEN_PERCENT_COST[second]
    assert above > 0 and below > 0
    assert (
        f"at {bn(HMRC_TEN_PERCENT_COST[first])} in 2026-27 and {bn(HMRC_TEN_PERCENT_COST[second])} in 2027-28. "
        "HMRC includes behavioural responses and leaves out the income tax devolved to Scotland and Wales. "
        f"We estimate {bn(ours[first])} and {bn(ours[second])}, with no behavioural response and without Scottish income tax, "
        f"so our figure exceeds HMRC's by {above:.0%} in 2026-27 and trails it by {below:.0%} in 2027-28."
    ) in TEXT


def test_sensitivity_to_the_model_version_matches_the_results():
    assert LATEST_META["policyengine_uk"] == "2.175.5"
    assert LATEST_META["dataset_sha256"] == META["dataset_sha256"]
    assert all(held is True for checks in LATEST_META["checks"].values() for held in checks.values())
    latest = {
        r["year"]: float(r["net_income_change_bn"]) for r in LATEST_TOTALS if r["scenario"] == FIRST
    }
    first, second = FISCAL_YEARS
    certified = {year: float(total(year, FIRST)["net_income_change_bn"]) for year in FISCAL_YEARS}
    assert (
        f"With PolicyEngine UK {LATEST_META['policyengine_uk']}, which has it, we estimate households have "
        f"{bn(latest[first])} and {bn(latest[second])} less net income than if the government had {PATH_LABELS[FIRST]}. "
        f"In the tables above, that comes to {bn(certified[first])} and {bn(certified[second])}."
    ) in TEXT


def test_post_names_the_versions_and_the_dataset_it_ran_on():
    assert META["policyengine_uk"] == "2.151.0"
    assert META["dataset"].startswith("microcosm-uk-2024-25-national-")
    assert f"with PolicyEngine UK {META['policyengine_uk']} and its take-up assumptions" in TEXT
    assert "`policyengine` 6.11.1" in TEXT
