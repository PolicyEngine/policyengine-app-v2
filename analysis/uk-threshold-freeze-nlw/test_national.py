"""Invariants of the national figures, and the post's use of them.

    pytest analysis/uk-threshold-freeze-nlw

Needs numpy, hypothesis and the national_*_certified files that national_freeze.py
writes. Runs no model code and reads no microdata.
"""

import csv
import json
import math
import re
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

import disclosure
from national_freeze import (
    ALL_EMPLOYEES,
    BASELINE,
    COMPARISONS,
    FIVE_PATHS,
    FROZEN,
    HMRC_TEN_PERCENT,
    HOUSEHOLDS_KEY,
    LABELS,
    OBR_THRESHOLDS,
    SCENARIOS,
    SURVEY_HOUSEHOLD_FLOOR,
    TABLE_NAMES,
    allocate,
    baseline_table,
    binding_sources,
    column_decimals,
    counts_table,
    decile_table,
    decimals,
    disclose,
    disclosure_summary,
    figures,
    gini,
    global_key,
    no_allowance_and_less_ni,
    on_uc_floor,
    pay_band_table,
    path_rank,
    pay_bands,
    poverty_table,
    published_rows,
    published_value,
    record_spaces,
    scenario_changes,
    scenario_differences,
    scenario_tables,
    scenario_thresholds,
    share_split,
    simple_workers,
    totals_table,
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
META = json.loads((HERE / f"national_meta_{LABEL}.json").read_text())
FISCAL_YEARS = ("2026-27", "2027-28")
FIRST, LAST = FIVE_PATHS[0], FIVE_PATHS[-1]
# Columns of the published CSVs that hold no figure.
NOT_FIGURES = {"year", "scenario", "suppressed", "approximate", *LABELS}
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


def figure(row: dict, key: str):
    """A published figure, or None where we withheld it."""
    return None if row[key] == "" else float(row[key])


def named(row: dict, column: str) -> set:
    return set(filter(None, row[column].split(";")))


def spread_bn(year: str, field: str, sign: float = 1) -> tuple[float, float]:
    values = [sign * float(total(year, s)[field]) for s in FIVE_PATHS]
    return min(values), max(values)


def to_places(value: float, places: int) -> Decimal:
    """A figure as the post prints it: the CSV's figure rounded half away from
    zero, so 0.24 becomes 0.2 and −0.26 becomes −0.3. A CSV figure halfway
    between two of the post's, such as 0.25, could come from an unrounded figure
    on either side, so the post prints it as the CSV does."""
    exact = Decimal(repr(float(value)))
    rounded = exact.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    if abs(exact - rounded) == Decimal(5).scaleb(-places - 1):
        return exact.quantize(Decimal(1).scaleb(-places - 1))
    return rounded


def bn(value: float) -> str:
    return f"£{abs(to_places(value, 1))} billion"


def whole_bn(value: float) -> str:
    return f"£{abs(to_places(value, 0))} billion"


def millions(value_bn: float) -> str:
    return f"£{abs(to_places(1_000 * Decimal(repr(float(value_bn))), 0)):,} million"


def two_places(value: float) -> str:
    rounded = to_places(value, 2)
    return f"−{abs(rounded)}" if rounded < 0 else f"{abs(rounded)}"


def one_decimal(value: float) -> str:
    rounded = to_places(value, 1)
    return f"−{abs(rounded)}" if rounded < 0 else f"{abs(rounded)}"


def gbp(value: float) -> str:
    rounded = to_places(value, 0)
    return f"−£{abs(rounded):,}" if rounded < 0 else f"£{abs(rounded):,}"


def thousands(value_m: float) -> str:
    return f"{round(abs(value_m) * 1_000):,},000"


def signed_thousands(value_m: float) -> str:
    return f"{'+' if value_m > 0 else '−'}{thousands(value_m)}"


def percent(share: float, places: int = 0) -> str:
    return f"{to_places(100 * Decimal(repr(float(share))), places)}%"


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
    row = totals_table(base, res).rows[0]
    assert 0 < row["extra_income_tax_outside_scottish_income_tax_bn"] < row["extra_income_tax_bn"]


def test_gini_floors_negative_income_at_zero():
    w = np.ones(3)
    assert gini(np.array([-500.0, 0.0, 100.0]), w) == gini(np.array([0.0, 0.0, 100.0]), w)


def test_gini_matches_microdf():
    microdf = pytest.importorskip("microdf")
    rng = np.random.default_rng(0)
    x, w = rng.lognormal(10, 1, 5_000) - 2_000, rng.uniform(1, 5, 5_000)
    assert gini(x, w) == pytest.approx(microdf.MicroSeries(np.maximum(x, 0), weights=w).gini(), abs=1e-12)


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


def test_a_change_of_one_pound_or_less_counts_as_none():
    """A household has more or less net income only when its net income changes by
    more than £1 a year, as PolicyEngine's disclosure layer counts it."""
    import national_freeze

    assert national_freeze.CHANGE_TOLERANCE == 1.0
    changes = np.array([-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5])
    n = len(changes)
    zeros = np.zeros(n)
    base = {
        "p_person_weight": np.ones(n),
        "h_household_weight": np.ones(n),
        "p_household_index": np.arange(n),
        "p_income_tax": zeros,
        "p_national_insurance": zeros,
        "p_uc_mif_applies": zeros,
        "p_personal_allowance": np.full(n, 12_570.0),
        "h_household_net_income": 20_000.0 + changes,
    }
    res = {
        "p_income_tax": zeros,
        "p_national_insurance": zeros,
        "p_personal_allowance": np.full(n, 16_080.0),
        "h_household_net_income": np.full(n, 20_000.0),
    }
    row = counts_table(base, res).rows[0]
    assert row["share_households_lower_net_income"] == pytest.approx(1 / n)
    assert row["share_households_higher_net_income"] == pytest.approx(1 / n)

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
    zeros = np.zeros(people)
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
        "h_pension_contributions": zeros,
        "h_household_income_decile": index % 10 + 1,
        "h_survey_household": index.astype(float),
        "p_household_index": index,
        "p_benunit_index": index,
        "p_income_tax": tax,
        "p_national_insurance": ni,
        "p_employment_income": pay,
        "p_age": np.full(people, 30.0),
        "p_is_SP_age": zeros,
        "p_in_poverty_bhc": (net < 20_000).astype(float),
        "p_is_hbai_dependent_child": (index % 4 == 0).astype(float),
        "p_pays_scottish_income_tax": (index % 12 == 0).astype(float),
        "p_total_income": pay,
        "p_personal_allowance": np.full(people, 12_570.0),
        "p_uc_mif_applies": zeros,
        "u_universal_credit": uc,
        "u_benefits": uc,
        "u_benunit_weight": weight,
        "b_universal_credit": uc,
        "b_housing_benefit": zeros,
        "b_council_tax_benefit": zeros,
        "b_pension_credit": zeros,
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
    rows = decile_table(base, res).rows
    row = totals_table(base, res).rows[0]
    added = sum(r["households_m"] * r["average_net_income_change"] for r in rows) / 1e3
    assert added == pytest.approx(row["net_income_change_bn"], rel=1e-9)
    assert row["net_income_change_bn"] == pytest.approx(row["extra_benefits_bn"] - row["extra_income_tax_and_ni_bn"])


def test_decile_percent_takes_net_income_on_the_raised_side():
    base, res = made_up_records()
    for row in decile_table(base, res).rows:
        m = base["h_household_income_decile"] == row["decile"]
        w = base["h_household_weight"][m]
        raised = float(np.dot(w, res["h_household_net_income"][m]))
        frozen = float(np.dot(w, base["h_household_net_income"][m]))
        assert row["percent_net_income_change"] == pytest.approx(100 * (frozen - raised) / raised)


def counts_cell_passes(base: dict, res: dict, column: str) -> bool:
    cell, _ = counts_table(base, res).cells[("", column)]
    return disclosure.passes(disclosure.supports_of(cell, record_spaces(base)))


def test_counts_split_those_with_higher_net_income_by_why():
    base, res = made_up_records()
    gained = dict(res)
    net = base["h_household_net_income"].copy()
    net[:30] -= 50
    gained["h_household_net_income"] = net
    mif = np.zeros(len(net))
    mif[:15] = 1
    floor_base = {**base, "p_uc_mif_applies": mif}
    row = counts_table(floor_base, gained).rows[0]
    w = base["h_household_weight"]
    assert row["share_of_those_higher_on_uc_minimum_income_floor"] == pytest.approx(w[:15].sum() / w[:30].sum())
    assert row["share_of_those_higher_with_no_allowance_and_less_ni"] == 0
    floor = "share_of_those_higher_on_uc_minimum_income_floor"
    assert counts_cell_passes(floor_base, gained, floor)
    # A share with no household behind it rests on the rest of its group.
    assert counts_cell_passes(floor_base, gained, "share_of_those_higher_with_no_allowance_and_less_ni")
    mif[:25] = 1
    # 25 of the 30 households with more net income: the other 5 are too few.
    assert not counts_cell_passes(floor_base, gained, floor)


def test_a_share_of_households_needs_ten_survey_households_with_more_net_income():
    base, res = made_up_records()
    gained = dict(res)
    net = base["h_household_net_income"].copy()
    gained["h_household_net_income"] = net
    net[: SURVEY_HOUSEHOLD_FLOOR - 1] -= 50
    assert not counts_cell_passes(base, gained, "share_households_higher_net_income")
    net[SURVEY_HOUSEHOLD_FLOOR - 1] -= 50
    assert counts_cell_passes(base, gained, "share_households_higher_net_income")


def test_pay_bands_add_up_to_the_all_employees_row():
    base, res = made_up_records()
    rows = pay_band_table(base, res, 2026).rows
    everyone, parts = rows[-1], rows[:-1]
    assert everyone["band"] == ALL_EMPLOYEES
    assert sum(r["employees_m"] for r in parts) == pytest.approx(everyone["employees_m"])
    added = sum(r["employees_m"] * (r["average_net_income_change"] or 0) for r in parts)
    assert added == pytest.approx(everyone["employees_m"] * everyone["average_net_income_change"])


def test_poverty_rows_count_people_who_cross_the_line():
    base, res = made_up_records()
    row = next(r for r in poverty_table(base, res).rows if r["group"] == "all")
    frozen, raised = base["p_in_poverty_bhc"] > 0, res["p_in_poverty_bhc"] > 0
    weight = base["p_person_weight"]
    assert row["people_change_m"] == pytest.approx((weight[frozen].sum() - weight[raised].sum()) / 1e6)
    assert (row["rate_frozen"] - row["rate_raised"]) * weight.sum() / 1e6 == pytest.approx(row["people_change_m"])


# What we publish, on made-up records


def made_up_world(
    people: int = 600, records_per_survey_household: int = 3, top_earners: int | None = None
) -> tuple[dict, dict]:
    """Made-up people, one in each household and family, with three households to
    each survey household. Three people on UC earn over £100,000, too few to show.
    Scenario a raises both thresholds to £16,080, b the NI threshold to £15,600
    alone with the allowance, and c leaves the NI threshold at £12,570. With
    `top_earners`, only that many people earn over £100,000."""
    rng = np.random.default_rng(1)
    index = np.arange(people)
    pay = rng.uniform(5_000, 160_000, people)
    if top_earners is not None:
        pay = np.where(pay > 100_000, rng.uniform(5_000, 100_000, people), pay)
        pay[rng.choice(people, top_earners, replace=False)] = rng.uniform(100_000, 160_000, top_earners)
    weight = rng.uniform(100, 900, people)
    tax = 0.2 * np.maximum(pay - 12_570, 0)
    ni = 0.08 * np.maximum(pay - 12_570, 0)
    uc = np.where(rng.uniform(size=people) < 0.3, 3_000.0, 0.0)
    uc[pay > 100_000] = 0
    uc[np.flatnonzero(pay > 100_000)[:3]] = 3_000.0
    net = pay - tax - ni + uc
    zeros = np.zeros(people)
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
        "h_pension_contributions": zeros,
        "h_household_income_decile": np.ceil(10 * (np.argsort(np.argsort(net)) + 1) / people),
        "h_survey_household": (index // records_per_survey_household).astype(float),
        "p_household_index": index,
        "p_benunit_index": index,
        "p_income_tax": tax,
        "p_national_insurance": ni,
        "p_employment_income": pay,
        "p_age": np.full(people, 30.0),
        "p_is_SP_age": zeros,
        "p_in_poverty_bhc": (net < 20_000).astype(float),
        "p_is_hbai_dependent_child": (index % 4 == 0).astype(float),
        "p_pays_scottish_income_tax": (index % 12 == 0).astype(float),
        "p_total_income": pay,
        "p_personal_allowance": np.full(people, 12_570.0),
        "p_uc_mif_applies": zeros,
        "u_universal_credit": uc,
        "u_benefits": uc,
        "u_benunit_weight": weight,
        "b_universal_credit": uc,
        "b_housing_benefit": zeros,
        "b_council_tax_benefit": zeros,
        "b_pension_credit": zeros,
    }

    def raised(allowance: float, threshold: float) -> dict:
        t = 0.2 * np.maximum(pay - allowance, 0)
        n = 0.08 * np.maximum(pay - threshold, 0)
        extra = (tax - t) + (ni - n)
        u = np.where(uc > 0, np.maximum(uc - 0.55 * extra, 0), 0.0)
        income = pay - t - n + u
        return {
            **base,
            "h_income_tax": t,
            "h_national_insurance": n,
            "h_household_tax": t + n,
            "h_household_benefits": u,
            "h_household_net_income": income,
            "h_equiv_household_net_income": income,
            "p_income_tax": t,
            "p_national_insurance": n,
            "p_in_poverty_bhc": (income < 20_000).astype(float),
            "p_personal_allowance": np.full(people, float(allowance)),
            "u_universal_credit": u,
            "u_benefits": u,
            "b_universal_credit": u,
        }

    return base, {"a": raised(16_080, 16_080), "b": raised(16_080, 15_600), "c": raised(16_080, 12_570)}


def world_tables(base: dict, results: dict) -> dict:
    tables = {("baseline", FROZEN): baseline_table(base, 2026)}
    for scenario, res in results.items():
        tables |= scenario_tables(base, res, scenario, 2026)
    return tables


@pytest.fixture(scope="module")
def world():
    base, results = made_up_world()
    tables = world_tables(base, results)
    spaces = record_spaces(base)
    found = disclose(tables, spaces, list(results))
    return SimpleNamespace(
        base=base,
        results=results,
        tables=tables,
        spaces=spaces,
        found=found,
        withheld=found.withheld,
        sides=found.sides,
        cells=found.cells,
    )


def test_every_link_holds_record_by_record(world):
    """Each link we give the reader is a true identity: its signed parts cancel in
    every record."""
    cells, links, _ = figures(world.tables, list(world.results))
    assert links
    for link in links:
        members = [(cells[key], sign) for key, sign in link]
        (space,) = {cell.space for cell, _ in members}
        residual = np.zeros(len(world.spaces[space][0]))
        for cell, sign in members:
            np.add.at(residual, cell.index, sign * cell.parts)
        largest = max(float(np.abs(cell.parts).max(initial=0.0)) for cell, _ in members)
        assert np.abs(residual).max(initial=0.0) <= 1e-9 * max(1.0, largest), link


def test_each_published_figure_is_what_its_cell_gives_rounded(world):
    """The figures the reader works from are the ones the CSVs print, and each is
    its records' total over its unit, rounded to its cell's places."""
    cells, _, values = figures(world.tables, list(world.results))
    checked = 0
    for (table, scope), t in world.tables.items():
        for row, out in zip(t.rows, published_rows(table, scope, t, set(), world.sides)):
            for column, printed in out.items():
                if column in NOT_FIGURES:
                    continue
                key = global_key(table, scope, (row["_row"], column), t.cells[(row["_row"], column)][1])
                assert values[key] == printed, key
                if printed is not None and not column.startswith("gini_"):
                    assert cells[key].decimals == decimals(column, key[1]), key
                    exact = disclosure.figure_of(cells[key], world.spaces)
                    assert abs(exact - printed) <= 0.5 * 10.0 ** -cells[key].decimals + 1e-9, key
                    checked += 1
    assert checked > 100


def test_comparison_scenarios_publish_one_place_fewer():
    for column in ("extra_ni_bn", "people_change_m", "share_x", "rate_raised", "average_x", "percent_x", "gini_x"):
        assert decimals(column) == decimals(column, FROZEN) == decimals(column, FIRST) == column_decimals(column)
        for scope in COMPARISONS:
            assert decimals(column, scope) == column_decimals(column) - 1
    assert set(COMPARISONS) == {OBR_THRESHOLDS, HMRC_TEN_PERCENT}


@pytest.fixture(scope="module")
def comparison_world():
    """The made-up world with one path renamed as the OBR's comparison scenario."""
    base, results = made_up_world()
    results = {"a": results["a"], OBR_THRESHOLDS: results["c"]}
    tables = world_tables(base, results)
    spaces = record_spaces(base)
    return SimpleNamespace(tables=tables, spaces=spaces, found=disclose(tables, spaces, list(results)))


def test_a_comparison_scenarios_own_figures_round_one_place_coarser(comparison_world):
    """The reader works from the coarser figures we print for a comparison
    scenario; a figure the same in every scenario prints alike in each row."""
    w = comparison_world
    cells, _, values = figures(w.tables, ["a", OBR_THRESHOLDS])
    printed = {}
    coarse = shared = 0
    for (table, scope), t in w.tables.items():
        for row, out in zip(t.rows, published_rows(table, scope, t, set(), w.found.sides)):
            for column, value in out.items():
                if column in NOT_FIGURES:
                    continue
                key = global_key(table, scope, (row["_row"], column), t.cells[(row["_row"], column)][1])
                places = column_decimals(column) - (key[1] == OBR_THRESHOLDS)
                assert cells[key].decimals == places, key
                assert values[key] == value, key
                if value is not None:
                    assert value == round(value, places), key
                coarse += key[1] == OBR_THRESHOLDS
                if key[1] == FROZEN and scope != FROZEN:
                    shared += 1
                    assert printed.setdefault(key, value) == value, key
    assert coarse > 30 and shared > 5


def test_shared_figures_rest_on_the_frozen_side_alone(world):
    """A figure the same in every scenario must come out the same from each."""
    first, last = (
        {table: t for (table, _), t in scenario_tables(world.base, world.results[s], s, 2026).items()}
        for s in ("a", "c")
    )
    shared = 0
    for table, t in first.items():
        for local, (cell, is_shared) in t.cells.items():
            other, other_shared = last[table].cells[local]
            assert is_shared == other_shared, local
            if is_shared:
                shared += 1
                assert np.array_equal(cell.index, other.index) and np.array_equal(cell.parts, other.parts), local
        for row, other_row in zip(t.rows, last[table].rows):
            for column, value in row.items():
                if column not in LABELS and column != "_row" and t.cells[(row["_row"], column)][1]:
                    assert value == other_row[column], (table, row["_row"], column)
    assert shared > 0


def test_published_rows_blank_exactly_the_withheld_figures(world):
    blanks = set()
    for (table, scope), t in world.tables.items():
        for row, out in zip(t.rows, published_rows(table, scope, t, world.withheld, world.sides)):
            suppressed, rough = named(out, "suppressed"), named(out, "approximate")
            for column, value in out.items():
                if column in NOT_FIGURES:
                    continue
                key = global_key(table, scope, (row["_row"], column), t.cells[(row["_row"], column)][1])
                withheld = key in world.withheld
                assert withheld == (column in suppressed), key
                # A share of no one stays blank too, but no rule withholds it.
                assert value == (None if withheld else published_value(column, row[column], key[1])), key
                assert (column in rough) == (not withheld and disclosure.approximate(world.sides[key]))
                if withheld:
                    blanks.add(key)
    assert world.withheld and blanks == world.withheld


def test_no_shown_figure_fails_and_no_reader_can_narrow_one(world):
    hidden = world.withheld | {key for key, cell in world.cells.items() if not cell.published}
    for key in world.cells:
        if key not in hidden:
            assert disclosure.passes(world.sides[key]), key
    # The reader again, from fresh cells and every link a reader can use.
    cells, links, values = figures(world.tables, list(world.results))
    links |= scenario_differences(cells, world.spaces, list(world.results))
    reader = disclosure.Reader(cells, sorted(links, key=str), world.spaces, values)
    disclosure.audit(reader, hidden)
    assert world.found.protection
    for row in world.found.protection:
        for distance in (row["below"], row["above"]):
            assert distance is None or distance >= row["margin"] * (1 - 1e-6) - 1e-6, row


@pytest.fixture(scope="module")
def thin_band_world():
    """1,800 made-up people, 20 of them on over £100,000 and three of those on UC.
    Of the UC shares by band, only that band's fails the rules."""
    base, results = made_up_world(people=1_800, top_earners=20)
    found = disclose(world_tables(base, results), record_spaces(base), list(results))
    return SimpleNamespace(base=base, results=results, found=found)


def test_a_thin_band_on_uc_takes_its_complements_with_it(thin_band_world):
    """The UC share of those on over £100,000 fails, and the row for all employees
    would give it away, so a share in that column that passes on its own goes
    blank with it."""
    found = thin_band_world.found
    column = [label for label, _, _ in pay_bands(2026)] + [ALL_EMPLOYEES]
    key = lambda label: ("pay_bands", FROZEN, label, "share_in_family_on_uc")
    top = key("over £100,000")
    failing = [key(label) for label in column if not disclosure.passes(found.sides[key(label)])]
    assert failing == [top] and top in found.withheld
    hidden = [key(label) for label in column if key(label) in found.withheld]
    assert any(disclosure.passes(found.sides[k]) for k in hidden if k != top), hidden


def test_the_row_for_all_employees_adds_up_the_bands_in_every_column(thin_band_world):
    t = pay_band_table(thin_band_world.base, thin_band_world.results["a"], 2026)
    bands = [label for label, _, _ in pay_bands(2026)]
    columns = [column for column in t.rows[0] if column not in ("_row", "band")]
    assert "share_in_family_on_uc" in columns
    for column in columns:
        assert (((ALL_EMPLOYEES, column), 1), *(((label, column), -1) for label in bands)) in t.links, column


def test_the_reader_gets_every_family_of_identities(world):
    """In the made-up world, dropping one of these families of links changes no
    figure we withhold, so we check that each reaches the reader: each total adds up
    its column of deciles, the households with less, more and the same net income
    make up all households, the change in net income adds up its parts, the people
    in poverty add up children and adults, each pay band's figures add up, and the
    row for all employees adds up the bands in every column."""
    _, links, _ = figures(world.tables, list(world.results))
    links = {frozenset(link) for link in links}
    deciles = sorted({local[0] for local in world.tables[("deciles", "a")].cells}, key=str)
    measures = 0
    for scope in world.results:
        totals = world.tables[("totals", scope)].cells
        total = lambda column: global_key("totals", scope, ("", column), totals[("", column)][1])
        for column, average in DECILE_TOTALS.items():
            assert frozenset({(total(column), 1), *((("deciles", scope, r, average), -1) for r in deciles)}) in links
        assert (
            frozenset(
                {
                    (("counts", scope, "", "share_households_lower_net_income"), 1),
                    (("counts", scope, "", "share_households_higher_net_income"), 1),
                    (("counts", scope, "", "_share_households_same_net_income"), 1),
                    (HOUSEHOLDS_KEY, -1),
                }
            )
            in links
        )
        net = {
            (total("net_income_change_bn"), 1),
            (total("extra_benefits_bn"), -1),
            (total("extra_income_tax_and_ni_bn"), 1),
            (total("extra_other_tax_bn"), 1),
        }
        assert frozenset(net) in links
        poverty = world.tables[("poverty", scope)].cells
        for measure in {row.rsplit("/", 1)[0] for row, _ in poverty if row.endswith("/children")}:
            measures += 1
            for column in ("rate_frozen", "rate_raised", "people_change_m"):
                local = lambda group: (f"{measure}/{group}", column)
                key = lambda group: global_key("poverty", scope, local(group), poverty[local(group)][1])
                assert frozenset({(key("all"), 1), (key("children"), -1), (key("_adults"), -1)}) in links
        bands = world.tables[("pay_bands", scope)].cells
        band = lambda label, column: global_key("pay_bands", scope, (label, column), bands[(label, column)][1])
        labels = [label for label, _, _ in pay_bands(2026)]
        for label in [*labels, ALL_EMPLOYEES]:
            for link in BAND_ROW_LINKS:
                assert frozenset((band(label, column), sign) for column, sign in link.items()) in links, (label, link)
        for column in BAND_COLUMNS:
            whole = (band(ALL_EMPLOYEES, column), 1)
            assert frozenset({whole, *((band(label, column), -1) for label in labels)}) in links, column
    assert measures


def with_four_on_less_uc(base: dict, a: dict, amount: float) -> dict:
    """Scenario a, except that four people on UC get `amount` less of it with
    thresholds raised."""
    four = np.flatnonzero(base["u_universal_credit"] > 0)[:4]
    d = {key: value.copy() for key, value in a.items()}
    for key in (
        "u_universal_credit",
        "u_benefits",
        "b_universal_credit",
        "h_household_benefits",
        "h_household_net_income",
        "h_equiv_household_net_income",
    ):
        d[key][four] -= amount
    d["p_in_poverty_bhc"] = (d["h_household_net_income"] < 20_000).astype(float)
    return d


UC_DIFFERENCE = ("totals", "a less d", "", "extra_uc_bn")
UC_TOTALS = {("totals", "a", "", "extra_uc_bn"), ("totals", "d", "", "extra_uc_bn")}


def protection_of(found, key) -> dict:
    return next(row for row in found.protection if row["members"] == [["|".join(map(str, key)), 1]])


def nearest_bound(row) -> float:
    """How close the reader's nearer bound comes to the true value. A bound the
    reader cannot set at all comes back as None."""
    return min(float("inf") if distance is None else distance for distance in (row["below"], row["above"]))


def test_rounding_keeps_a_thin_difference_between_two_scenarios_out_of_reach():
    """Subtracting a's UC total from d's would show four people's £500s, but
    rounding each total to £10 million leaves a reader far wider bounds."""
    base, results = made_up_world()
    d = with_four_on_less_uc(base, results["a"], 500)
    found = disclose(world_tables(base, {"a": results["a"], "d": d}), record_spaces(base), ["a", "d"])
    assert UC_DIFFERENCE in found.cells and not disclosure.passes(found.sides[UC_DIFFERENCE])
    assert not UC_TOTALS & found.withheld
    row = protection_of(found, UC_DIFFERENCE)
    assert nearest_bound(row) >= row["margin"]


def test_a_thin_difference_wider_than_the_rounding_takes_a_total_with_it():
    """A made-up £200,000 each, more than any UC award, puts each of the four's
    part above the £10 million the two rounded totals leave a reader, so one of
    the two totals goes blank."""
    base, results = made_up_world()
    d = with_four_on_less_uc(base, results["a"], 200_000)
    found = disclose(world_tables(base, {"a": results["a"], "d": d}), record_spaces(base), ["a", "d"])
    # d comes after a in our list, so its total goes and a's stays.
    assert ("totals", "d", "", "extra_uc_bn") in found.withheld
    assert ("totals", "a", "", "extra_uc_bn") not in found.withheld
    row = protection_of(found, UC_DIFFERENCE)
    assert row["margin"] > 1e7
    assert nearest_bound(row) >= row["margin"]


def test_we_withhold_from_later_paths_first_and_the_baseline_last():
    rank = path_rank(list(FIVE_PATHS))
    key = lambda scope: ("totals", scope, "", "extra_ni_bn")
    ranks = [rank(key(scope)) for scope in FIVE_PATHS]
    assert ranks == sorted(ranks, reverse=True) and len(set(ranks)) == len(FIVE_PATHS)
    assert rank(("baseline", FROZEN, "", "income_tax_bn")) > max(ranks)
    with pytest.raises(KeyError):
        rank(key("a less d"))


def test_withholding_on_made_up_records_is_deterministic(world):
    again = disclose(world_tables(world.base, world.results), world.spaces, list(world.results))
    assert again.withheld == world.withheld


def test_disclosure_summary_splits_what_we_withhold(world):
    summary = disclosure_summary(world.cells, world.sides, world.withheld, world.found.first)
    failing = summary["withheld_failing_the_rules"]
    split = summary["withheld_by_policyengines_share_rule"]
    complements = summary["withheld_to_keep_a_failing_figure_out_of_reach"]
    assert summary["withheld"] == failing + split + complements == len(world.withheld)
    assert failing > 0 and complements > 0
    assert summary["figures"] == sum(cell.published for cell in world.cells.values())


def three_shares(lower: int, higher: int, same: int) -> tuple[dict, dict]:
    """Shares of households with lower, higher and the same net income, one
    record to each survey household."""
    n = lower + higher + same
    position = np.arange(n)
    everyone = np.ones(n, dtype=bool)
    masks = (position < lower, (position >= lower) & (position < lower + higher), position >= lower + higher)
    columns = (
        "share_households_lower_net_income",
        "share_households_higher_net_income",
        "_share_households_same_net_income",
    )
    cells = {("counts", "a", "", c): disclosure.share_cell("households", m, everyone) for c, m in zip(columns, masks)}
    return cells, {"households": (np.ones(n), position.astype(float))}


def test_the_share_rule_withholds_what_policyengines_layer_withholds():
    lower = ("counts", "a", "", "share_households_lower_net_income")
    higher = ("counts", "a", "", "share_households_higher_net_income")
    # Five households keep the same net income: the layer withholds the share
    # with higher net income, which rests on fewer households.
    assert share_split(*three_shares(40, 15, 5), ["a"]) == {higher}
    # On a tie it withholds the share with lower net income.
    assert share_split(*three_shares(27, 27, 6), ["a"]) == {lower}
    # When the third share passes, or one of the others fails, it adds nothing.
    assert share_split(*three_shares(40, 15, 12), ["a"]) == set()
    assert share_split(*three_shares(40, 8, 5), ["a"]) == set()


# The first example imports policyengine, which takes far longer than any later one.
@settings(deadline=None)
@given(st.lists(st.tuples(st.integers(0, 40), st.floats(0, 40, allow_nan=False)), min_size=1, max_size=3))
def test_binding_sources_matches_policyengine(pairs):
    layer = pytest.importorskip("policyengine.disclosure.support")
    ours = tuple(disclosure.Support(n, n_eff, 0.2) for n, n_eff in pairs)
    theirs = tuple(layer.Support(n, n_eff, 0.2) for n, n_eff in pairs)
    assert binding_sources(ours) == layer.binding_support(theirs).n_sources


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


@pytest.mark.parametrize("name", TABLE_NAMES)
def test_withheld_figures_are_blank_and_named(name):
    for row in table(name):
        figures_in_row = set(row) - NOT_FIGURES
        blank = {column for column in figures_in_row if row[column] == ""}
        assert blank == named(row, "suppressed")
        assert named(row, "approximate") <= figures_in_row - blank


def test_disclosure_follows_policyengines_rules():
    assert META["disclosure"]["rules"] == {
        "minimum_survey_households": 10,
        "maximum_share_of_one_household": 0.5,
        "minimum_error_for_one_household_p_percent_rule": 0.1,
        "change_of_at_most_counts_as_none_gbp": 1.0,
    }
    # Never finer than PolicyEngine's minimum bases: £1,000 for totals, £1 for
    # averages, 0.0001 for relative changes and 0.001 for shares.
    assert META["disclosure"]["decimal_places"] == {
        "totals_in_gbp_bn": 2,
        "counts_in_millions": 3,
        "shares_and_rates": 3,
        "averages_in_gbp": 0,
        "percentage_changes": 2,
        "gini_indexes": 5,
    }
    assert META["disclosure"]["comparison_scenarios"] == {
        "scenarios": ["obr_thresholds", "hmrc_ten_percent"],
        "decimal_places_fewer": 1,
    }


def test_readme_figures_match_the_results():
    """The README's counts of withheld and approximate figures, and the share it
    cites, come from the certified tables."""
    readme = (HERE / "README.md").read_text()
    first, second = (META["disclosure"]["figures"][year] for year in FISCAL_YEARS)
    assert first["figures"] == second["figures"]
    assert (
        f"In 2026-27, we withhold {first['withheld']} of {first['figures']:,} figures: "
        f"{first['withheld_failing_the_rules']} that fail the rules and "
        f"{first['withheld_to_keep_a_failing_figure_out_of_reach']} that would let a reader work one of those out. "
        f"In 2027-28, we withhold {second['withheld']}: {second['withheld_failing_the_rules']} and "
        f"{second['withheld_to_keep_a_failing_figure_out_of_reach']}."
    ) in readme
    assert (
        f"`approximate` column: {first['shown_on_fewer_than_30_effective_survey_households']} figures in 2026-27 and "
        f"{second['shown_on_fewer_than_30_effective_survey_households']} in 2027-28."
    ) in readme
    last = counts("2026-27", LAST)
    assert (
        f"We estimate {percent(float(last['share_households_higher_net_income']), 1)} of households have more net income "
        f"on that path in 2026-27, and {percent(float(last['share_of_those_higher_with_no_allowance_and_less_ni']))} of them "
        "include such a person"
    ) in readme
    floor = "share_of_those_higher_on_uc_minimum_income_floor"
    assert counts("2027-28", FIRST)[floor] == "" and "We withhold the share for 2027-28." in readme


def test_decimal_places_follow_from_each_columns_name():
    """The code, not only the meta, gives each kind of column its places, and the
    comparison scenarios one place fewer."""
    places = {
        "totals_in_gbp_bn": decimals("extra_income_tax_bn"),
        "counts_in_millions": decimals("households_m"),
        "shares_and_rates": decimals("share_in_family_on_uc"),
        "averages_in_gbp": decimals("average_net_income_change"),
        "percentage_changes": decimals("percent_net_income_change"),
        "gini_indexes": decimals("gini_frozen"),
    }
    assert places == META["disclosure"]["decimal_places"]
    assert decimals("rate_frozen") == decimals("share_in_family_on_uc")
    assert decimals("people_change_m") == decimals("households_m")
    for column in ("extra_ni_bn", "employees_m", "rate_raised", "average_extra_ni", "percent_net_income_change"):
        for scenario in COMPARISONS:
            assert decimals(column, scenario) == decimals(column) - 1, (column, scenario)
        for scenario in FIVE_PATHS:
            assert decimals(column, scenario) == decimals(column), (column, scenario)


def shared_columns(world) -> dict:
    """The columns of each table whose figures are the same in every scenario."""
    found: dict = {name: set() for name in TABLE_NAMES}
    for (name, _), t in world.tables.items():
        found[name] |= {column for (_, column), (_, shared) in t.cells.items() if shared}
    return found


@pytest.mark.parametrize("name", TABLE_NAMES)
def test_csv_figures_carry_their_cells_rounding(name, world):
    """A comparison scenario's own figures carry one place fewer than the paths';
    a figure the same in every scenario prints the same in each scenario's row."""
    shared = shared_columns(world)[name]
    rows = table(name)
    place = lambda row: (row["year"], *(row.get(label) for label in LABELS))
    first = {place(row): row for row in rows if row.get("scenario") == FIRST}
    for row in rows:
        scope = row.get("scenario", FROZEN)
        for column in set(row) - NOT_FIGURES:
            if row[column] == "":
                continue
            value = float(row[column])
            if column in shared:
                assert value == round(value, decimals(column)), (name, column)
                twin = first.get(place(row))
                if twin is not None and twin[column] != "":
                    assert row[column] == twin[column], (name, column)
            else:
                assert value == round(value, decimals(column, scope)), (name, column, scope)


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_disclosure_summary_matches_the_tables(year, world):
    summary = META["disclosure"]["figures"][year]
    failing = summary["withheld_failing_the_rules"]
    assert summary["withheld"] == (
        failing
        + summary["withheld_by_policyengines_share_rule"]
        + summary["withheld_to_keep_a_failing_figure_out_of_reach"]
    )
    # Count each figure once: the tables repeat a figure that is the same in every
    # scenario on each scenario's row, and it reads the same on all of them.
    shared = shared_columns(world)
    found: dict = {}
    for name in TABLE_NAMES:
        for row in table(name):
            if row["year"] != year:
                continue
            label = tuple(row[column] for column in LABELS if column in row)
            suppressed, rough = named(row, "suppressed"), named(row, "approximate")
            for column, value in row.items():
                if column in (*LABELS, "year", "scenario", "suppressed", "approximate"):
                    continue
                scope = FROZEN if name == "baseline" or column in shared[name] else row["scenario"]
                found.setdefault((name, scope, label, column), set()).add((value, column in suppressed, column in rough))
    assert all(len(states) == 1 for states in found.values())
    states = [next(iter(states)) for states in found.values()]
    assert len(states) == summary["figures"]
    assert sum(withheld for _, withheld, _ in states) == summary["withheld"]
    assert sum(rough for _, _, rough in states) == summary["shown_on_fewer_than_30_effective_survey_households"]


BENEFIT_PARTS = (
    "uc",
    "housing_benefit",
    "pension_credit",
    "ctr",
    "income_support",
    "working_tax_credit",
    "child_tax_credit",
    "other_benefits",
)


def half_unit(column: str, scenario: str) -> float:
    """Half a unit in the last place of a published figure. A comparison
    scenario's own figures carry one place fewer, so for them we allow the
    coarser rounding throughout."""
    return 0.5 * 10.0 ** -decimals(column, scenario)


# Written out here rather than read from national_freeze.py, so a margin or a
# link dropped there fails a test.
DECILE_TOTALS = {
    "net_income_change_bn": "average_net_income_change",
    "extra_income_tax_and_ni_bn": "average_extra_income_tax_and_ni",
    "extra_benefits_bn": "average_extra_benefits",
    "extra_other_tax_bn": "_average_extra_other_tax",
}
BAND_ROW_LINKS = (
    {"average_extra_income_tax_and_ni": 1, "average_extra_income_tax": -1, "average_extra_ni": -1},
    {"average_net_income_change": 1, "average_benefit_change": -1, "average_extra_income_tax_and_ni": 1},
    {"average_net_income_change": 1, "average_net_income_change_on_uc": -1, "average_net_income_change_not_on_uc": -1},
)
BAND_COLUMNS = (
    "employees_m",
    "share_in_family_on_uc",
    "share_with_total_income_above_frozen_allowance",
    "average_extra_income_tax",
    "average_extra_ni",
    "average_extra_income_tax_and_ni",
    "average_benefit_change",
    "average_net_income_change",
    "average_net_income_change_on_uc",
    "average_net_income_change_not_on_uc",
)

PAY_BAND_MEANS = (
    "share_in_family_on_uc",
    "share_with_total_income_above_frozen_allowance",
    "average_extra_income_tax",
    "average_extra_ni",
    "average_extra_income_tax_and_ni",
    "average_benefit_change",
    "average_net_income_change",
)


def identity_failures(bands: list, deciles: list, totals: list) -> tuple[int, list]:
    """Check, within the rounding of every figure involved, that in each pay band
    income tax plus NI gives the total, benefits less income tax and NI give the
    change in net income, and the averages on and off UC, weighted by the UC
    share, give the band's average; that the row for all employees averages the
    bands, weighted by employees; and that each column of deciles, weighted by
    households, adds up to its total. Returns the number of identities checked and
    those that fail. A product of two rounded figures, x and y, can stray from the
    true one by |x| half-units of y plus (|y| + a half-unit) half-units of x."""
    checked, failures = 0, []

    def check(label: tuple, lhs: float, rhs: float, slack: float) -> None:
        nonlocal checked
        checked += 1
        if abs(lhs - rhs) > slack + 1e-9:
            failures.append((label, lhs, rhs, slack))

    groups: dict = {}
    for row in bands:
        scenario = row["scenario"]
        groups.setdefault((row["year"], scenario), []).append(row)
        h = half_unit("average_net_income_change", scenario)
        tax, ni, both, benefits, net, on, off, share = (
            figure(row, column)
            for column in (
                "average_extra_income_tax",
                "average_extra_ni",
                "average_extra_income_tax_and_ni",
                "average_benefit_change",
                "average_net_income_change",
                "average_net_income_change_on_uc",
                "average_net_income_change_not_on_uc",
                "share_in_family_on_uc",
            )
        )
        label = (row["year"], scenario, row["band"])
        if None not in (tax, ni, both):
            check((*label, "income tax + NI"), tax + ni, both, 3 * h)
        if None not in (benefits, both, net):
            check((*label, "benefits - income tax and NI"), benefits - both, net, 3 * h)
        if None not in (on, off, share, net):
            hs = half_unit("share_in_family_on_uc", scenario)
            check((*label, "on and off UC"), on * share + off * (1 - share), net, 2 * h + hs * (abs(on - off) + 2 * h))
    for (year, scenario), rows in groups.items():
        [every] = [row for row in rows if row["band"] == ALL_EMPLOYEES]
        parts = [row for row in rows if row is not every]
        he = half_unit("employees_m", scenario)
        employees = [float(row["employees_m"]) for row in parts]
        everyone = float(every["employees_m"])
        check((year, scenario, ALL_EMPLOYEES, "employees_m"), sum(employees), everyone, (len(parts) + 1) * he)
        for column in PAY_BAND_MEANS:
            values, whole = [figure(row, column) for row in parts], figure(every, column)
            if None in values or whole is None:
                continue
            hv = half_unit(column, scenario)
            lhs = sum(e * v for e, v in zip(employees, values))
            slack = sum((e + he) * hv + abs(v) * he for e, v in zip(employees, values))
            check((year, scenario, ALL_EMPLOYEES, column), lhs, everyone * whole, slack + (everyone + he) * hv + abs(whole) * he)
    by_scenario: dict = {}
    for row in deciles:
        by_scenario.setdefault((row["year"], row["scenario"]), []).append(row)
    totals_of = {(row["year"], row["scenario"]): row for row in totals}
    for (year, scenario), rows in by_scenario.items():
        households = [float(row["households_m"]) for row in rows]
        hh = half_unit("households_m", scenario)
        for column, average in DECILE_TOTALS.items():
            if average not in rows[0]:
                continue
            values, whole = [figure(row, average) for row in rows], figure(totals_of[(year, scenario)], column)
            if None in values or whole is None:
                continue
            hv = half_unit(average, scenario)
            lhs = sum(h * v for h, v in zip(households, values)) / 1e3
            slack = sum((h + hh) * hv + abs(v) * hh for h, v in zip(households, values)) / 1e3 + half_unit(column, scenario)
            check((year, scenario, "deciles", column), lhs, whole, slack)
    return checked, failures


def test_published_figures_obey_their_identities_within_rounding():
    checked, failures = identity_failures(BANDS, DECILES, TOTALS)
    assert not failures, failures[:5]
    assert checked >= 400


@pytest.mark.parametrize(
    "name, row_label, column",
    [
        ("pay_bands", "£25,000 to £30,000", "average_extra_income_tax"),
        ("pay_bands", ALL_EMPLOYEES, "share_in_family_on_uc"),
        ("deciles", "4", "average_extra_benefits"),
    ],
)
def test_the_identities_catch_a_small_slip(name, row_label, column):
    """£10 on one band's or decile's average, or 0.01 on the share for all
    employees, breaks an identity."""
    tables = {"pay_bands": [dict(row) for row in BANDS], "deciles": [dict(row) for row in DECILES]}
    label = "band" if name == "pay_bands" else "decile"
    [row] = [r for r in tables[name] if r["year"] == "2026-27" and r["scenario"] == FIRST and r[label] == row_label]
    row[column] = str(float(row[column]) + (0.01 if column.startswith("share_") else 10))
    _, failures = identity_failures(tables["pay_bands"], tables["deciles"], TOTALS)
    assert failures


def holds_within_rounding(row: dict, scenario: str, whole: str, parts: dict) -> bool:
    """Whether a published figure equals the signed sum of its published parts
    within the rounding of all of them. Returns None when one of them stays
    blank, which leaves the identity out of a reader's reach as well."""
    values = {key: figure(row, key) for key in (whole, *parts)}
    if None in values.values():
        for key, value in values.items():
            assert value is not None or key in named(row, "suppressed"), key
        return None
    slack = sum(half_unit(key, scenario) for key in values) + 1e-9
    return abs(values[whole] - sum(sign * values[key] for key, sign in parts.items())) <= slack


@pytest.mark.parametrize("row", TOTALS, ids=lambda r: f"{r['year']} {r['scenario']}")
def test_totals_add_up(row):
    s = row["scenario"]
    checks = [
        holds_within_rounding(row, s, "extra_income_tax_and_ni_bn", {"extra_income_tax_bn": 1, "extra_ni_bn": 1}),
        holds_within_rounding(row, s, "extra_benefits_bn", {f"extra_{part}_bn": 1 for part in BENEFIT_PARTS}),
        holds_within_rounding(
            row, s, "net_income_change_bn", {"extra_benefits_bn": 1, "extra_income_tax_and_ni_bn": -1, "extra_other_tax_bn": -1}
        ),
    ]
    assert False not in checks
    # We withhold the other benefits on every row, so only the tax and net income identities stay in reach.
    if s in FIVE_PATHS:
        assert checks[0] is True and checks[2] is True
    assert figure(row, "net_income_change_bn") < 0 < figure(row, "extra_income_tax_bn")


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
    households = [figure(r, "households_m") for r in rows]
    averages = [figure(r, "average_net_income_change") for r in rows]
    assert None not in households
    assert sum(households) == pytest.approx(float(baseline(year)["households_m"]), abs=11 * half_unit("households_m", FROZEN))
    if None in averages:
        assert all(a is not None or "average_net_income_change" in named(r, "suppressed") for a, r in zip(averages, rows))
        assert scenario not in FIVE_PATHS
        return
    added = sum(h * a for h, a in zip(households, averages)) / 1e3
    slack = (
        sum(h * half_unit("average_net_income_change", scenario) + abs(a) * half_unit("households_m", FROZEN) for h, a in zip(households, averages))
        / 1e3
        + half_unit("net_income_change_bn", scenario)
    )
    assert abs(added - float(total(year, scenario)["net_income_change_bn"])) <= slack


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", [*FIVE_PATHS, OBR_THRESHOLDS])
def test_pay_bands_add_up(year, scenario):
    rows = [r for r in BANDS if r["year"] == year and r["scenario"] == scenario]
    everyone = next(r for r in rows if r["band"] == ALL_EMPLOYEES)
    parts = [r for r in rows if r is not everyone]
    assert len(parts) == 8
    unit = half_unit("employees_m", FROZEN)
    assert sum(float(r["employees_m"]) for r in parts) == pytest.approx(float(everyone["employees_m"]), abs=9 * unit)
    averages = [figure(r, "average_net_income_change") for r in (*parts, everyone)]
    if None in averages:
        assert all(a is not None or "average_net_income_change" in named(r, "suppressed") for a, r in zip(averages, (*parts, everyone)))
        return
    employees = [float(r["employees_m"]) for r in (*parts, everyone)]
    added = sum(e * a for e, a in zip(employees[:-1], averages[:-1]))
    slack = sum(e * half_unit("average_net_income_change", scenario) + abs(a) * unit for e, a in zip(employees, averages))
    assert abs(added - employees[-1] * averages[-1]) <= slack


def test_poverty_people_follow_the_rates():
    checked = 0
    for row in POVERTY:
        s = row["scenario"]
        frozen, raised, people = (figure(row, key) for key in ("rate_frozen", "rate_raised", "people_change_m"))
        if None in (frozen, raised, people):
            continue
        # Only a gap wider than the rounding of both rates fixes the sign of the change.
        if abs(frozen - raised) > half_unit("rate_frozen", FROZEN) + half_unit("rate_raised", s) and abs(people) > half_unit("people_change_m", s):
            assert (frozen - raised) * people > 0, (row["year"], s, row["measure"], row["group"])
            checked += 1
    assert checked > 50


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", FIVE_PATHS)
def test_freeze_raises_absolute_poverty_and_lowers_relative_poverty(year, scenario):
    for measures, sign in ((("absolute_bhc", "absolute_ahc"), 1), (("relative_bhc", "relative_ahc"), -1)):
        for measure in measures:
            row = poverty(year, scenario, measure)
            people = figure(row, "people_change_m")
            if people is None:
                assert "people_change_m" in named(row, "suppressed")
            else:
                assert sign * people > 0, measure
            frozen, raised = figure(row, "rate_frozen"), figure(row, "rate_raised")
            if frozen is not None and raised is not None:
                slack = half_unit("rate_frozen", FROZEN) + half_unit("rate_raised", scenario)
                assert sign * (frozen - raised) > -slack, measure


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


def one_place(value: float) -> str:
    return f"{to_places(value, 1)}"


def three_places(value: float) -> str:
    return f"{to_places(value, 3)}"


def whole_percent(share: float) -> str:
    """A ratio of published figures, as a whole percentage."""
    return f"{to_places(100 * share, 0)}%"


def share_of_net_income(row: dict) -> str:
    return f"{abs(to_places(float(row['percent_net_income_change']), 1))}%"


def test_summary_spreads_match_the_totals():
    first, second = (spread_bn(year, "extra_income_tax_and_ni_bn") for year in FISCAL_YEARS)
    assert (
        f"Households pay {whole_bn(first[0])} to {whole_bn(first[1])} more income tax and NI in 2026-27 across the five paths, "
        f"and {whole_bn(second[0])} to {whole_bn(second[1])} more in 2027-28." in TEXT
    )


def test_about_3p_more_in_benefits_for_each_pound_on_every_path():
    for year in FISCAL_YEARS:
        for scenario in FIVE_PATHS:
            assert 0.025 <= float(total(year, scenario)["extra_benefits_bn"]) / tax_and_ni(year, scenario) < 0.035
    assert "They receive about 3p more in benefits for each £1 of extra income tax and NI." in TEXT
    assert (
        "For each £1 of extra income tax and NI, households receive about 3p more in UC, Housing Benefit, "
        "Pension Credit and Council Tax Reduction."
    ) in TEXT
    assert "3p of each £1 back" not in TEXT


def test_description_carries_the_uk_wide_spread():
    entry = next(e for e in json.loads(POSTS.read_text()) if e["filename"] == POST.name)
    low, high = spread_bn("2026-27", "extra_income_tax_and_ni_bn")
    assert (
        f"We estimate UK households pay {whole_bn(low)} to {whole_bn(high)} more income tax and NI in 2026-27."
        in entry["description"]
    )


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_totals_tables_match_the_results(year):
    expected = [
        [
            PATH_LABELS[s],
            *(
                two_places(float(total(year, s)[key]))
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
    # A ratio of two rounded figures: the post rounds it to £10, which holds across
    # both figures' rounding.
    change, count = float(row["net_income_change_bn"]), float(baseline(year)["households_m"])
    change_half, count_half = half_unit("net_income_change_bn", FIRST), half_unit("households_m", FROZEN)
    ends = [-(change + a) / (count + b) * 1e3 for a in (-change_half, change_half) for b in (-count_half, count_half)]
    assert len({round(end, -1) for end in ends}) == 1
    assert (
        f"On average, they have about {gbp(round(average, -1))} less net income in 2026-27 "
        f"than if the government had {PATH_LABELS[FIRST]}: "
        f"{percent(lower)} have less and about {percent(higher, 1)} have more. "
        f"The other {percent(1 - lower - higher)} have the same net income to within £1 a year."
    ) in TEXT
    # The post hedges the share with more net income because it rests on few survey households.
    assert "share_households_higher_net_income" in named(shares, "approximate")
    assert "share_households_lower_net_income" not in named(shares, "approximate")
    everyone = band(year, FIRST, "all employees")
    assert (
        f"We estimate {percent(float(everyone['share_in_family_on_uc']))} of employees aged 21 to State Pension age "
        "live in a family on UC with thresholds frozen."
    ) in TEXT


def test_nearly_all_households_with_more_net_income_on_the_main_path_include_someone_on_the_uc_floor():
    floor = "share_of_those_higher_on_uc_minimum_income_floor"
    assert float(counts("2026-27", FIRST)[floor]) > 0.9
    later = counts("2027-28", FIRST)
    assert (later[floor] == "" and floor in named(later, "suppressed")) or float(later[floor]) > 0.9
    assert (
        "We estimate that more than 90% of the households with more net income in 2026-27 include someone on UC's "
        "minimum income floor."
    ) in TEXT


def test_most_households_with_more_net_income_on_the_fifth_path_include_someone_with_no_allowance():
    row = counts("2026-27", LAST)
    higher = float(row["share_households_higher_net_income"])
    assert float(row["share_of_those_higher_with_no_allowance_and_less_ni"]) > 0.5
    fifth_threshold = scenarios(2026, S57_PA)[LAST][1]
    no_allowance_from = 100_000 + 2 * S57_PA[2026]
    less_ni = 0.08 * (12_570 - fifth_threshold)
    assert (
        f"We estimate {percent(higher, 1)} of households have more net income with thresholds frozen in 2026-27 "
        f"than if the government had {PATH_LABELS[LAST]}. "
        f"Most of them include someone on more than {gbp(no_allowance_from)}, who has no allowance either way "
        f"and pays up to {gbp(less_ni)} less NI."
    ) in TEXT
    assert "share_households_higher_net_income" not in named(row, "approximate")


def test_the_post_hedges_both_breakdowns_of_who_has_more_net_income():
    first, last = counts("2026-27", FIRST), counts("2026-27", LAST)
    assert "share_of_those_higher_on_uc_minimum_income_floor" in named(first, "approximate")
    assert "share_of_those_higher_with_no_allowance_and_less_ni" in named(last, "approximate")
    assert (
        "On both paths, our breakdown of why households have more net income rests on the equivalent of fewer than "
        "30 survey households, so treat it as approximate."
    ) in TEXT


def test_chart_of_deciles_matches_the_results():
    spec = chart("Households in the ninth income decile")
    assert [s["key"] for s in spec["series"]] == ["aligned", "allowanceOnly"]
    assert spec["series"][0]["name"] == f"If the government had {PATH_LABELS[FIRST]}"
    assert spec["series"][1]["name"] == f"If the government had {PATH_LABELS['allowance_only']}"
    assert [point["decile"] for point in spec["data"]] == [str(number) for number in range(1, 11)]
    assert "by income decile (1 = lowest)" in spec["subtitle"]
    for number, point in enumerate(spec["data"], start=1):
        for key, scenario in (("aligned", FIRST), ("allowanceOnly", "allowance_only")):
            row = decile("2026-27", scenario, number)
            assert point[key] == round(float(row["percent_net_income_change"]), 2)
            assert "percent_net_income_change" not in named(row, "approximate")
    for key in ("aligned", "allowanceOnly"):
        assert min(spec["data"], key=lambda p: p[key])["decile"] == "9"
    assert f"PolicyEngine UK {META['policyengine_uk']}" in spec["source"]


@pytest.mark.parametrize("year", FISCAL_YEARS)
@pytest.mark.parametrize("scenario", FIVE_PATHS)
def test_ninth_decile_loses_the_largest_share_on_every_path(year, scenario):
    shares = {n: float(decile(year, scenario, n)["percent_net_income_change"]) for n in range(1, 11)}
    assert min(shares, key=shares.get) == 9


def test_decile_prose_matches_the_results():
    year = "2026-27"
    lowest, ninth, top = (decile(year, FIRST, n) for n in (1, 9, 10))
    share = share_of_net_income
    expected = [
        f"Households in the ninth income decile have {share(ninth)} less net income in 2026-27",
        f"households in the lowest decile have {share(lowest)} less",
        "With thresholds frozen, we rank people into deciles by their household's income on the Households Below Average "
        "Income (HBAI) measure before housing costs, which we adjust for household size.",
        f"We estimate households in the lowest decile pay {gbp(float(lowest['average_extra_income_tax_and_ni']))} more income tax and NI "
        f"on average in 2026-27 than if the government had {PATH_LABELS[FIRST]}. "
        f"They receive {gbp(float(lowest['average_extra_benefits']))} more in benefits and have {share(lowest)} less net income.",
        f"Those in the ninth decile lose the largest share: {share(ninth)}, or {gbp(abs(float(ninth['average_net_income_change'])))}.",
        f"We estimate households in the top decile lose {share(top)}, or {gbp(abs(float(top['average_net_income_change'])))}.",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    fifth, sixth, second = (decile(year, FIRST, n) for n in (5, 6, 2))
    assert (
        f"Households in the fifth and sixth deciles lose {share(fifth)} and {share(sixth)} of their household net income, "
        f"against {share(second)} in the second."
    ) in TEXT
    cited = {
        1: ("percent_net_income_change", "average_extra_income_tax_and_ni", "average_extra_benefits"),
        2: ("percent_net_income_change",),
        5: ("percent_net_income_change",),
        6: ("percent_net_income_change",),
        9: ("percent_net_income_change", "average_net_income_change"),
        10: ("percent_net_income_change", "average_net_income_change"),
    }
    for number, columns in cited.items():
        assert not named(decile(year, FIRST, number), "approximate") & set(columns), number


def test_the_examples_beside_the_deciles_keep_to_taxpayers_outside_scotland():
    assert "For example, outside Scotland, a worker on £55,000 pays 40p on each £1 of the £3,510 between the allowances" in TEXT
    gap = S57_PA[2026] - 12_570
    assert gap == 3_510 and round(0.4 * gap) == 1_404
    assert "or £1,404 more income tax, because the higher rate threshold rises with the allowance." in TEXT


def test_deciles_rank_households_on_the_frozen_side():
    base, res = made_up_records()
    reversed_deciles = {**res, "h_household_income_decile": 11 - base["h_household_income_decile"]}
    assert decile_table(base, reversed_deciles).rows == decile_table(base, res).rows


def test_gini_takes_equivalised_net_income_weighted_by_people():
    base, res = made_up_records()
    rng = np.random.default_rng(7)
    people = rng.integers(1, 5, len(base["h_household_weight"])).astype(float)
    scale = np.sqrt(people)
    base = {**base, "h_household_count_people": people, "h_equiv_household_net_income": base["h_household_net_income"] / scale}
    res = {**res, "h_household_count_people": people, "h_equiv_household_net_income": res["h_household_net_income"] / scale}
    row = totals_table(base, res).rows[0]
    weights = base["h_household_weight"] * people
    assert row["gini_frozen"] == pytest.approx(gini(base["h_equiv_household_net_income"], weights))
    assert row["gini_raised"] == pytest.approx(gini(res["h_equiv_household_net_income"], weights))
    assert row["gini_frozen"] != pytest.approx(gini(base["h_household_net_income"], weights))


def test_pay_band_table_matches_the_results():
    year = "2026-27"
    rows = [r for r in BANDS if r["year"] == year and r["scenario"] == FIRST]
    formats = (
        ("employees_m", one_place),
        ("share_in_family_on_uc", lambda share: percent(share, 1)),
        ("average_extra_income_tax_and_ni", gbp),
        ("average_net_income_change", gbp),
        ("average_net_income_change_on_uc", gbp),
    )
    expected = [
        [
            row["band"][0].upper() + row["band"][1:],
            *("–" if row[column] == "" else fmt(float(row[column])) for column, fmt in formats),
        ]
        for row in rows
    ]
    assert post_table("Employees by annual pay, 2026-27, if the government had raised the NI threshold with the allowance") == expected
    approximate_shown = {
        (row["band"], column) for row in rows for column, _ in formats if row[column] != "" and column in named(row, "approximate")
    }
    assert approximate_shown == {
        ("£50,270 to £100,000", "share_in_family_on_uc"),
        ("£50,270 to £100,000", "average_net_income_change_on_uc"),
    }
    assert (
        "The figures for families on UC with pay of £50,270 to £100,000 rest on the equivalent of fewer than 30 survey "
        "households, so treat them as approximate."
    ) in TEXT


def test_pay_band_prose_matches_the_results():
    year = "2026-27"
    middle = band(year, FIRST, "£20,000 to £25,000")
    lowest = band(year, FIRST, "up to £12,570")
    extra, net = float(middle["average_extra_income_tax_and_ni"]), float(middle["average_net_income_change"])
    on_uc = float(middle["average_net_income_change_on_uc"])
    not_on_uc = float(middle["average_net_income_change_not_on_uc"])
    employees = one_place(float(middle["employees_m"]))
    expected = [
        f"Against that path, the {employees} million employees aged 21 to State Pension age on £20,000 to £25,000 "
        f"pay {gbp(extra)} more income tax and NI on average in 2026-27. "
        "That band includes full-time pay at the National Living Wage.",
        f"We estimate {employees} million of them earn £20,000 to £25,000 in 2026-27",
        f"They pay {gbp(extra)} more income tax and NI on average than if the government had raised the NI threshold with the allowance. "
        "For these employee figures, we share each family's benefit change among its members in proportion to their extra income tax and NI, "
        "and we leave out changes to other taxes.",
        f"On that basis, they have {gbp(abs(net))} less net income: the {percent(float(middle['share_in_family_on_uc']))} in a family on UC "
        f"have {gbp(abs(on_uc))} less, and the rest have {gbp(abs(not_on_uc))} less.",
        "Their extra income tax and NI exceeds our single worker's £983 because, with thresholds frozen, some of them get less "
        "from a Marriage Allowance their partner transfers to them. Others pay more tax on savings interest, or on other "
        "income that takes them above £50,270.",
        "We can't reliably tell from survey reports of hours and pay who earns the National Living Wage",
        f"Employees on up to £12,570 pay {gbp(float(lowest['average_extra_income_tax_and_ni']))} more on average, mostly in "
        f"income tax, because {percent(float(lowest['share_with_total_income_above_frozen_allowance']))} of them have other income",
        "Some also pay more NI, because with statutory sick, maternity or paternity pay their earnings for NI exceed £12,570.",
    ]
    for phrase in expected:
        assert phrase in TEXT, phrase
    assert extra > 983
    # "Mostly in income tax", and the NI the post explains without citing it.
    assert float(lowest["average_extra_income_tax"]) > 0.5 * float(lowest["average_extra_income_tax_and_ni"])
    assert float(lowest["average_extra_ni"]) > 0
    for row, columns in (
        (
            middle,
            (
                "employees_m",
                "share_in_family_on_uc",
                "average_extra_income_tax_and_ni",
                "average_net_income_change",
                "average_net_income_change_on_uc",
                "average_net_income_change_not_on_uc",
            ),
        ),
        (lowest, ("average_extra_income_tax_and_ni", "share_with_total_income_above_frozen_allowance")),
    ):
        assert not named(row, "approximate") & set(columns), row["band"]
    # The summary leaves the employees' net income to the section that explains its basis.
    summary = TEXT[TEXT.index("Across UK households, we estimate:") : TEXT.index("## How the thresholds reached")]
    assert "less net income" not in summary.split("on £20,000 to £25,000", 1)[1].split("\n", 1)[0]


def test_pay_bands_leave_out_changes_to_other_taxes():
    base, res = made_up_records()
    other_tax = np.linspace(0, 400, len(base["h_household_weight"]))
    taxed = {
        **res,
        "h_household_tax": res["h_household_tax"] - other_tax,
        "h_household_net_income": res["h_household_net_income"] + other_tax,
    }
    assert pay_band_table(base, taxed, 2026).rows == pay_band_table(base, res, 2026).rows


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
        assert not named(everyone, "approximate"), measure
        assert "people_change_m" in named(children, "approximate"), measure
    assert post_table("2026-27, if the government had raised the NI threshold with the allowance") == expected
    assert "The changes in children rest on the equivalent of fewer than 30 survey households each, so treat them as approximate." in TEXT


def test_poverty_definitions_name_the_income_measure():
    assert (
        "We count people in absolute poverty when their household's size-adjusted HBAI income falls below 60% of the "
        "2024-25 median in real terms, and in relative poverty when it falls below 60% of the same year's median."
    ) in TEXT


def test_poverty_prose_matches_the_results():
    year = "2026-27"
    published = {s: figure(poverty(year, s, "absolute_bhc"), "people_change_m") for s in FIVE_PATHS}
    shown = [v for v in published.values() if v is not None]
    first, last = published[FIRST], published[LAST]
    assert first == max(shown) and last == min(shown)
    first_children = float(poverty(year, FIRST, "absolute_bhc", "children")["people_change_m"])
    last_children_row = poverty(year, LAST, "absolute_bhc", "children")
    assert "people_change_m" in named(last_children_row, "approximate")
    assert (
        f"Against the path without the July 2022 rise, we estimate {thousands(last)} more people fall below the absolute line before housing costs in 2026-27, "
        f"including about {thousands(float(last_children_row['people_change_m']))} children, "
        f"against the {thousands(first)} and about {thousands(first_children)} in the table."
    ) in TEXT
    relative = float(poverty(year, FIRST, "relative_bhc")["people_change_m"])
    assert (
        f"Against that path, {thousands(first)} more people fall below the absolute poverty line before housing costs in 2026-27, "
        f"and {thousands(relative)} fewer fall below the relative line, which moves with median income."
    ) in TEXT
    # Fewer people below a line that falls with median income: incomes near the
    # line fall by a smaller share than the median, as the deciles show.
    assert relative < 0
    assert (
        "With thresholds frozen, fewer people fall below the relative line, because median income falls by a larger "
        "share than incomes near the line."
    ) in TEXT
    middle = min(abs(float(decile(year, FIRST, n)["percent_net_income_change"])) for n in (5, 6))
    assert middle > abs(float(decile(year, FIRST, 2)["percent_net_income_change"]))
    checked = 0
    for scenario in FIVE_PATHS:
        for measures, sign in ((("absolute_bhc", "absolute_ahc"), 1), (("relative_bhc", "relative_ahc"), -1)):
            for measure in measures:
                row = poverty(year, scenario, measure)
                frozen, raised = figure(row, "rate_frozen"), figure(row, "rate_raised")
                if frozen is None or raised is None:
                    continue
                assert sign * (frozen - raised) > 0, (scenario, measure)
                checked += 1
    assert checked >= 12


def test_gini_prose_matches_the_results():
    row = total("2026-27", FIRST)
    assert (
        f"We estimate the Gini index rises from {three_places(float(row['gini_raised']))} to {three_places(float(row['gini_frozen']))} "
        "under the freeze, using net income that we adjust for household size."
    ) in TEXT
    obr = total("2026-27", OBR_THRESHOLDS)
    assert (
        f"We estimate the Gini index would reach {three_places(float(obr['gini_raised']))} under those levels, "
        f"against {three_places(float(obr['gini_frozen']))} under the freeze. "
        "Against each of our five paths, it rises under the freeze."
    ) in TEXT
    assert float(obr["gini_raised"]) > float(obr["gini_frozen"])
    for path in FIVE_PATHS:
        path_row = total("2026-27", path)
        assert float(path_row["gini_raised"]) < float(path_row["gini_frozen"]), path


@pytest.mark.parametrize("year", FISCAL_YEARS)
def test_thresholds_frozen_move_the_gini_index_opposite_ways_on_the_paths_and_the_obrs_levels(year):
    for scenario in FIVE_PATHS:
        assert float(total(year, scenario)["gini_frozen"]) > float(total(year, scenario)["gini_raised"])
    assert float(total(year, OBR_THRESHOLDS)["gini_frozen"]) < float(total(year, OBR_THRESHOLDS)["gini_raised"])


def test_methods_note_distinguishes_the_ranking_income_from_net_income():
    assert (
        "- We rank deciles and count poverty by HBAI income, which PolicyEngine UK, like the official statistics, sets to "
        "zero before housing costs where it falls below zero. We calculate the household changes in net income, decile "
        "percentages and Gini index from household net income. In household net income, unlike HBAI income, we count "
        "capital gains, free childcare hours and the value of public services such as the NHS. We also take off other "
        "taxes, such as fuel, alcohol and tobacco duty, stamp duty and vehicle excise duty."
    ) in TEXT
    from national_freeze import HOUSEHOLD

    assert {"household_income_decile", "household_net_income", "equiv_household_net_income"} <= set(HOUSEHOLD)


# Published figures the post compares with, from the OBR's October 2026 receipts
# tables (4.17, 4.18), its October 2026 outlook (Table A.5), its November 2025 outlook
# (Box 3.3, Table A) and HMRC's June 2025 ready reckoner.
ACTUAL_ALLOWANCE = 12_570
# Table 4.17: "PA and HRT freezes" and "Additional rate threshold: reduction".
OBR_FREEZE_YIELD = {"2026-27": 32.667158242427405, "2027-28": 38.22560300197248}
OBR_ADDITIONAL_RATE_YIELD = {"2026-27": 0.91, "2027-28": 0.94}
OBR_YIELD = {year: OBR_FREEZE_YIELD[year] + OBR_ADDITIONAL_RATE_YIELD[year] for year in OBR_FREEZE_YIELD}
OBR_BROUGHT_IN = {"2026-27": 4.83, "2027-28": 5.3}
OBR_PENSION_TAX_ALLOWANCE = {"2026-27": 0, "2027-28": 0.289}
OBR_RECEIPTS = {"2026-27": 365.4, "2027-28": 392.2}
OBR_EMPLOYEE_NI = {"2026-27": -1.3, "2027-28": -0.5}
HMRC_TEN_PERCENT_COST = {"2026-27": 14.4, "2027-28": 17.7}


def test_obr_thresholds_in_the_post_match_the_scenario():
    first, second = OBR_INDEXED[2026], OBR_INDEXED[2027]
    expected = (
        f"it puts the Personal Allowance at {gbp(first['personal_allowance'])} and {gbp(second['personal_allowance'])}. "
        f"It puts the higher rate threshold at {gbp(first['higher_rate_threshold'])} and {gbp(second['higher_rate_threshold'])} "
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
        f"we estimate {one_place(brought[first])} million more people pay income tax in 2026-27 with thresholds frozen "
        f"and {one_place(brought[second])} million more in 2027-28. The OBR estimates {one_place(OBR_BROUGHT_IN[first])} million "
        f"and {one_place(OBR_BROUGHT_IN[second])} million. In the Budget, the government announced that from 2027-28 "
        "it would cut income tax by up to £94 a year through a [Pension Tax Allowance]"
    ) in TEXT
    assert (
        f"The OBR takes {one_place(OBR_PENSION_TAX_ALLOWANCE[second])} million off its 2027-28 figure for the people the "
        "government takes out of income tax with the allowance. We also model the allowance, so we leave them out of "
        "our 2027-28 figure too."
    ) in TEXT
    # The post introduces the allowance before it names it, with the maximum the
    # model gives: 20% of the full new State Pension above £12,570, rounded up to
    # the pound, tapering away by £1 for each £3 of income above that pension.
    introduced = TEXT.index("through a [Pension Tax Allowance]")
    assert introduced < TEXT.index("off its 2027-28 figure for the people the government takes out of income tax")
    full_new_state_pension_2027 = 13_036.40
    assert math.ceil(0.2 * (full_new_state_pension_2027 - ACTUAL_ALLOWANCE)) == 94
    assert "cut income tax by up to £94 a year through a [Pension Tax Allowance]" in TEXT
    assert (
        "It would give the allowance to people over State Pension age with income up to a little above the full new "
        "State Pension."
    ) in TEXT
    # At the OBR's levels the allowance exceeds the full new State Pension, so the
    # Pension Tax Allowance gives nothing on that side.
    assert OBR_INDEXED[2027]["personal_allowance"] >= full_new_state_pension_2027


def test_obr_yield_comparison_matches_the_results():
    first, second = FISCAL_YEARS
    ours = {year: float(total(year, OBR_THRESHOLDS)["extra_income_tax_bn"]) for year in FISCAL_YEARS}
    # We publish the OBR scenario's figures to one place, so the gaps hold across
    # that rounding: about £10 billion and £11 billion, or 29% to 30%.
    half = half_unit("extra_income_tax_bn", OBR_THRESHOLDS)
    for year, gap_bn in zip(FISCAL_YEARS, (10, 11)):
        ends = (ours[year] - half, ours[year] + half)
        assert {round(end - OBR_YIELD[year]) for end in ends} == {gap_bn}
        assert {whole_percent(end / OBR_YIELD[year] - 1) for end in ends} <= {"29%", "30%"}
    assert whole_percent(ours[first] / OBR_YIELD[first] - 1) == "30%"
    assert whole_percent(ours[second] / OBR_YIELD[second] - 1) == "29%"
    assert (
        "In its Table 4.17, the OBR puts the yield from freezing the Personal Allowance and higher rate threshold at "
        f"{bn(OBR_FREEZE_YIELD[first])} in 2026-27 and {bn(OBR_FREEZE_YIELD[second])} in 2027-28. It puts the yield from "
        "cutting the additional rate threshold to £125,140 at "
        f"{bn(OBR_ADDITIONAL_RATE_YIELD[first])} in each year. "
        f"Our estimates against its levels, {bn(ours[first])} and {bn(ours[second])}, exceed the sum of those lines "
        "by about £10 billion and £11 billion, or 29% to 30%."
    ) in TEXT
    assert bn(OBR_ADDITIONAL_RATE_YIELD[first]) == bn(OBR_ADDITIONAL_RATE_YIELD[second])
    trail = [whole_percent(1 - float(baseline(year)["income_tax_bn"]) / OBR_RECEIPTS[year]) for year in FISCAL_YEARS]
    assert "Our baseline income tax liabilities trail [its receipts forecast]" in TEXT
    assert f"by {trail[0]} and {trail[1]}. The OBR publishes the yield by measure with no split by income" in TEXT


def test_obr_top_decile_comparison_matches_the_results():
    row = decile("2026-27", OBR_THRESHOLDS, 10)
    top = float(row["average_net_income_change"])
    assert top < 0
    assert "average_net_income_change" not in named(row, "approximate")
    assert (
        f"Compared with frozen thresholds, we estimate households in the top decile would have {gbp(abs(top))} more net income "
        "on average under the OBR's indexed levels."
    ) in TEXT
    assert f"exceeds the {gbp(S57_PA[2026] + 37_700)} on our five paths in 2026-27" in TEXT
    assert OBR_INDEXED[2026]["higher_rate_threshold"] > S57_PA[2026] + 37_700
    assert f"exceeds their {gbp(100_000 + 2 * ACTUAL_ALLOWANCE)}" in TEXT


def test_obr_employee_ni_comparison_matches_the_results():
    first, second = (float(total(year, LAST)["extra_ni_bn"]) for year in FISCAL_YEARS)
    assert first < 0 < second
    assert OBR_EMPLOYEE_NI["2026-27"] < 0 and OBR_EMPLOYEE_NI["2027-28"] < 0
    withheld = total("2026-27", OBR_THRESHOLDS)
    assert withheld["extra_ni_bn"] == "" and "extra_ni_bn" in named(withheld, "suppressed")
    at_obr_levels = float(total("2027-28", OBR_THRESHOLDS)["extra_ni_bn"])
    assert at_obr_levels < 0
    obr_hrt, obr_pt = OBR_INDEXED[2027]["higher_rate_threshold"], OBR_INDEXED[2027]["primary_threshold"]
    held = META["parameters_held"]["obr_thresholds"]["2027"]
    assert held["lower_profits_limit"] == obr_pt > 12_570
    assert (
        f"the OBR puts employee NI {bn(OBR_EMPLOYEE_NI['2026-27'])} and {bn(OBR_EMPLOYEE_NI['2027-28'])} lower with thresholds frozen in those years, "
        "with no split by threshold. "
        f"Against its October 2026 levels, we estimate {bn(at_obr_levels)} less in 2027-28. "
        "At those levels, we set the upper earnings and profits limits equal to the OBR's higher rate threshold, "
        "and the lower profits limit equal to its primary threshold. "
        f"With the upper limits frozen at £50,270, employees pay 2% rather than 8% on pay from £50,270 to {gbp(obr_hrt)} in 2027-28, "
        "and the self-employed pay 2% rather than 6% on profits in that range. "
        f"In 2027-28, the OBR's primary threshold of {gbp(obr_pt)}, which we also use as the lower profits limit, "
        "exceeds £12,570, so with "
        f"thresholds frozen people also pay more NI on pay and profits from £12,570 to {gbp(obr_pt)}. We estimate that "
        f"the NI they save on pay and profits from £50,270 to {gbp(obr_hrt)} exceeds that by {bn(-at_obr_levels)}. "
        "We don't publish our 2026-27 figure at those levels, because a reader could combine it with our other figures "
        "to work out too much about a few survey households. "
        "Against the path without the July 2022 rise, which keeps the upper limits at £50,270 and the lower profits limit at £12,570, "
        f"we estimate {millions(first)} less in 2026-27 and {millions(second)} more in 2027-28."
    ) in TEXT


def test_the_obr_upper_limits_turn_the_sign_of_its_ni_figure():
    held = META["parameters_held"]
    for year in ("2026", "2027"):
        obr, path = held[OBR_THRESHOLDS][year], held[LAST][year]
        higher_rate_threshold = OBR_INDEXED[int(year)]["higher_rate_threshold"]
        assert obr["upper_earnings_limit_week"] == pytest.approx(higher_rate_threshold / 52)
        assert obr["upper_profits_limit"] == higher_rate_threshold
        assert obr["lower_profits_limit"] == pytest.approx(obr["primary_threshold_week"] * 52)
        assert path["upper_earnings_limit_week"] == pytest.approx(50_270 / 52, abs=0.01)
        assert path["upper_profits_limit"] == 50_270 and path["lower_profits_limit"] == 12_570
    # In 2027-28 both primary thresholds exceed £12,570 a year and the fifth path's
    # exceeds the OBR's, so the primary threshold alone would leave the OBR's figure
    # between zero and the fifth path's. It turns negative because the OBR's levels
    # also move the upper limits, above which the NI rate falls.
    obr, path = held[OBR_THRESHOLDS]["2027"], held[LAST]["2027"]
    assert 12_570 / 52 < obr["primary_threshold_week"] <= path["primary_threshold_week"]
    assert obr["lower_profits_limit"] > 12_570
    assert float(total("2027-28", LAST)["extra_ni_bn"]) > 0 > float(total("2027-28", OBR_THRESHOLDS)["extra_ni_bn"])


def test_hmrc_comparison_matches_the_results():
    first, second = FISCAL_YEARS
    ours = {year: float(total(year, HMRC_TEN_PERCENT)["extra_income_tax_outside_scottish_income_tax_bn"]) for year in FISCAL_YEARS}
    above = whole_percent(ours[first] / HMRC_TEN_PERCENT_COST[first] - 1)
    below = whole_percent(1 - ours[second] / HMRC_TEN_PERCENT_COST[second])
    assert ours[first] > HMRC_TEN_PERCENT_COST[first] and ours[second] < HMRC_TEN_PERCENT_COST[second]
    # We publish our figures to one place, so each gap spans the rounding of our
    # figure; "about" covers it only if every end lies within a point of the figure.
    for year, stated in ((first, above), (second, below)):
        ends = (ours[year] - 0.05, ours[year] + 0.05)
        gaps = [100 * abs(end / HMRC_TEN_PERCENT_COST[year] - 1) for end in ends]
        assert all(abs(gap - float(stated.rstrip("%"))) < 1 for gap in gaps), (year, gaps)
    assert (
        f"at {bn(HMRC_TEN_PERCENT_COST[first])} in 2026-27 and {bn(HMRC_TEN_PERCENT_COST[second])} in 2027-28. "
        "HMRC includes behavioural responses and leaves out Scottish income tax and the Welsh rates of income tax. "
        "It also counts Self Assessment income tax when people pay it, so most of the 2026-27 change in that tax falls "
        "outside its 2026-27 figure. "
        f"We estimate {bn(ours[first])} and {bn(ours[second])} with no behavioural response, leaving out Scottish taxpayers' "
        "income tax but keeping the Welsh rates. "
        f"Our figure exceeds HMRC's by about {above} in 2026-27 and trails it by about {below} in 2027-28."
    ) in TEXT


def test_post_names_the_versions_and_the_dataset_it_ran_on():
    assert META["policyengine_uk"] == "2.174.1"
    assert META["dataset"] == "microcosm-uk-2024-25-national-20261107T020434Z-eeb6093e"
    assert (
        "- We run the UK-wide comparison on the certified Microcosm UK dataset that `policyengine` 6.16.1 pins, "
        f"with PolicyEngine UK {META['policyengine_uk']} and its take-up assumptions."
    ) in TEXT
    assert "2.151.0" not in TEXT and "6.11.1" not in TEXT
