"""National figures for the post on the threshold freeze.

Runs PolicyEngine UK on the Microcosm UK national file, one simulation per
scenario, each in its own process, then adds the results up:

    python national_freeze.py run --scenario baseline \
        --data FILE --arrays PRIVATE_DIR --label certified
    python national_freeze.py tables \
        --arrays PRIVATE_DIR --label certified --out OUTPUT_DIR --private PRIVATE_DIR

`run` writes one set of record-level arrays per scenario and year to
PRIVATE_DIR. Those arrays derive from the Family Resources Survey, so they stay
outside this repository. `tables` writes aggregate CSVs to OUTPUT_DIR, leaves
blank each figure that disclosure.py withholds, and keeps for PRIVATE_DIR the
share of records behind each check and the survey households behind each figure.

Every comparison runs one way: "extra" means what the frozen world (the
baseline) holds less what the raised world (the scenario) holds. Extra income
tax of £100 means a person pays £100 more with thresholds frozen, and a net
income change of -£45 means they have £45 less with thresholds frozen.

Records match by position, since PolicyEngine UK holds household ids as int32
and Microcosm's ids wrap past that range.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import importlib.metadata
import json
import math
import time
from collections import defaultdict
from dataclasses import replace
from itertools import combinations
from pathlib import Path
from typing import NamedTuple

import numpy as np

import disclosure
from disclosure import change_cell, count_cell, level_cell, mean_cell, share_cell, signed_count_cell
from thresholds import ACTUAL_PA, ACTUAL_PT_WEEK, OBR_INDEXED, S57_PA, YEARS, scenarios

PA = "gov.hmrc.income_tax.allowances.personal_allowance.amount"
BASIC_RATE_BAND = "gov.hmrc.income_tax.rates.uk[1].threshold"
ADDITIONAL_RATE = "gov.hmrc.income_tax.rates.uk[2].threshold"
PT = "gov.hmrc.national_insurance.class_1.employee_scale[1].threshold"
UEL = "gov.hmrc.national_insurance.class_1.employee_scale[2].threshold"
LPL = "gov.hmrc.national_insurance.class_4.thresholds.lower_profits_limit"
UPL = "gov.hmrc.national_insurance.class_4.thresholds.upper_profits_limit"
STARTING_RATE_LIMIT = "gov.hmrc.income_tax.rates.savings_starter_rate.allowance"
GAINS = "gov.simulation.capital_gains_responses"

BASELINE = "baseline"
FIVE_PATHS = (
    "ni_tracks_allowance",
    "ni_sep_cpi_from_jul22",
    "ni_p2p_from_jul22",
    "allowance_only",
    "ni_sep_cpi_from_2021",
)
# Every income tax and NI threshold the OBR indexes, at its own levels, to compare
# with the yields in its Table 4.17. The post's five paths move only the allowance
# and the primary threshold.
OBR_THRESHOLDS = "obr_thresholds"
# HMRC's "Increase all main allowances, starting and basic rate limits by 10%", to
# compare with its ready reckoner. We move the Personal Allowance, the starting rate
# limit for savings and the basic rate band.
HMRC_TEN_PERCENT = "hmrc_ten_percent"
SCENARIOS = (BASELINE, *FIVE_PATHS, OBR_THRESHOLDS, HMRC_TEN_PERCENT)
# A reader can subtract a comparison scenario's figure from a path's, and the two
# often differ for few survey households, such as those with income between the
# OBR's £16,070 allowance and our £16,080. We publish the comparison scenarios'
# own figures to one decimal place fewer than the paths', so those differences
# stay out of reach without blanking the figures we compare with the OBR and HMRC.
COMPARISONS = (OBR_THRESHOLDS, HMRC_TEN_PERCENT)

# The UK Data Service licence bars a cell "based on only one or two cases" and
# advises 10 against secondary disclosure. disclosure.py holds every figure we
# publish to PolicyEngine's rules, starting with 10 survey households behind it.
SURVEY_HOUSEHOLD_FLOOR = disclosure.FLOOR
# A household or person "has less" or "has more" when the change exceeds £1 a
# year. PolicyEngine's disclosure layer counts a change of £1 or less as none.
CHANGE_TOLERANCE = disclosure.CHANGE_TOLERANCE
# Record spaces for disclosure.py, and the scope of a figure the same in every
# scenario.
HOUSEHOLDS, PEOPLE = "households", "people"
FROZEN = "frozen"
TABLE_NAMES = ("totals", "baseline", "deciles", "pay_bands", "poverty", "counts")
# Columns that name a row; every other column holds a figure.
LABELS = ("decile", "band", "measure", "group")
ALL_EMPLOYEES = "all employees"
HOUSEHOLDS_KEY = ("baseline", FROZEN, "", "households_m")
# Each total adds up its column of the decile table.
DECILE_MARGINS = {
    "net_income_change_bn": "average_net_income_change",
    "extra_income_tax_and_ni_bn": "average_extra_income_tax_and_ni",
    "extra_benefits_bn": "average_extra_benefits",
    "extra_other_tax_bn": "_average_extra_other_tax",
}

POVERTY_MEASURES = {
    "absolute_bhc": "in_poverty_bhc",
    "absolute_ahc": "in_poverty_ahc",
    "relative_bhc": "in_relative_poverty_bhc",
    "relative_ahc": "in_relative_poverty_ahc",
}
# Benefits with their own column in the totals.
NAMED_BENEFITS = {
    "universal_credit": "uc",
    "housing_benefit": "housing_benefit",
    "pension_credit": "pension_credit",
    "council_tax_benefit": "ctr",
    "income_support": "income_support",
    "working_tax_credit": "working_tax_credit",
    "child_tax_credit": "child_tax_credit",
}
# Same in every scenario, or needed only on the frozen side, so only the
# baseline's files hold them.
CONSTANT_PERSON = (
    "person_weight",
    "age",
    "employment_income",
    "self_employment_income",
    "is_SP_age",
    "pays_scottish_income_tax",
    "is_hbai_dependent_child",
    "allowances",
    "ni_class_1_income",
    "trading_loss",
    "uc_mif_applies",
)
PERSON = (
    "total_income",
    "income_tax",
    "national_insurance",
    "marriage_allowance",
    "pension_contributions",
    "personal_allowance",
    *POVERTY_MEASURES.values(),
)
CONSTANT_HOUSEHOLD = ("household_weight", "household_count_people")
HOUSEHOLD = (
    "household_net_income",
    "equiv_household_net_income",
    "household_market_income",
    "household_benefits",
    "household_tax",
    "pension_contributions",
    "household_income_decile",
    "income_tax",
    "national_insurance",
    "capital_gains_tax",
)


def tax_year(year: int) -> str:
    return f"{year}-04-06.{year + 1}-04-05"


def by_year(values: dict) -> dict:
    return {tax_year(year): value for year, value in values.items()}


def static_capital_gains() -> dict:
    """No realisation response in any scenario: both elasticities 0, and gains
    qualifying for the relief on the main elasticity, the setting PolicyEngine
    UK's parameter file gives for a static costing. The allowance sets which
    gains pay which rate, and the main elasticity defaults to 1. We set it in the
    baseline too, so every run holds gains to the same rule."""
    return {
        f"{GAINS}.elasticity": by_year({y: 0 for y in YEARS}),
        f"{GAINS}.mtr_elasticity": by_year({y: 0 for y in YEARS}),
        f"{GAINS}.separate_badr_elasticity": by_year({y: False for y in YEARS}),
    }


def scenario_thresholds(name: str) -> dict:
    """{parameter: {year: value}} for one scenario; the baseline moves nothing."""
    if name == BASELINE:
        return {}
    if name == HMRC_TEN_PERCENT:
        return {
            PA: {y: ACTUAL_PA * 1.1 for y in YEARS},
            BASIC_RATE_BAND: {y: 37_700 * 1.1 for y in YEARS},
            STARTING_RATE_LIMIT: {y: 5_000 * 1.1 for y in YEARS},
        }
    if name == OBR_THRESHOLDS:
        pa = {y: OBR_INDEXED[y]["personal_allowance"] for y in YEARS}
        hrt = {y: OBR_INDEXED[y]["higher_rate_threshold"] for y in YEARS}
        pt = {y: OBR_INDEXED[y]["primary_threshold"] for y in YEARS}
        return {
            PA: pa,
            BASIC_RATE_BAND: {y: hrt[y] - pa[y] for y in YEARS},
            ADDITIONAL_RATE: {y: 150_000 for y in YEARS},
            PT: {y: pt[y] / 52 for y in YEARS},
            UEL: {y: hrt[y] / 52 for y in YEARS},
            LPL: pt,
            UPL: hrt,
        }
    rows = {y: scenarios(y, S57_PA)[name] for y in YEARS}
    return {
        PA: {y: rows[y][0] for y in YEARS},
        PT: {y: rows[y][1] / 52 for y in YEARS},
    }


def scenario_changes(name: str) -> dict:
    """The parameter changes of one scenario, as PolicyEngine UK reads them."""
    changes = {path: by_year(values) for path, values in scenario_thresholds(name).items()}
    changes.update(static_capital_gains())
    return changes


# -- running the model ---------------------------------------------------------


def load_dataset(path: str):
    from policyengine_uk.data.dataset_schema import UKMultiYearDataset, UKSingleYearDataset

    if UKMultiYearDataset.validate_file_path(path, False):
        return UKMultiYearDataset(path)
    if UKSingleYearDataset.validate_file_path(path, False):
        return UKSingleYearDataset(path)
    raise ValueError(f"{path} holds no PolicyEngine UK dataset")


def benefit_variables() -> list[str]:
    try:
        from policyengine_uk.programs import budget_variables

        return list(budget_variables("benefit"))
    except ModuleNotFoundError:
        from policyengine_uk.variables.household.income.household_benefits import (
            HOUSEHOLD_BENEFIT_VARIABLES,
        )

        return list(HOUSEHOLD_BENEFIT_VARIABLES)


def survey_households(sim) -> np.ndarray:
    """The survey household behind each household record, in the engine's order.
    Checks the match as the dashboard does: same id order, same weights in the
    file's first year."""
    dataset = sim.dataset
    year = int(dataset.years[0])
    table = dataset[year].household.reset_index(drop=True)
    engine_ids = np.asarray(sim.populations["household"].ids)
    if not np.array_equal(engine_ids, table["household_id"].to_numpy()):
        raise ValueError("The household table and the engine order differ")
    weight = np.asarray(sim.calculate("household_weight", year, unweighted=True), dtype=np.float32)
    if not np.array_equal(weight, table["household_weight"].to_numpy(dtype=np.float32)):
        raise ValueError("Household weights differ between the table and the engine")
    return table["source_household_id"].to_numpy(dtype=float)


def parameters_at(system, year: int) -> dict:
    """The thresholds the simulation holds in the middle of a tax year."""
    p = system.parameters(f"{year}-06-01")
    uk = p.gov.hmrc.income_tax.rates.uk
    ni = p.gov.hmrc.national_insurance
    return {
        "personal_allowance": float(p.gov.hmrc.income_tax.allowances.personal_allowance.amount),
        "basic_rate_band": float(uk.thresholds[1]),
        "additional_rate_threshold": float(uk.thresholds[2]),
        "primary_threshold_week": float(ni.class_1.employee_scale.thresholds[1]),
        "upper_earnings_limit_week": float(ni.class_1.employee_scale.thresholds[2]),
        "lower_profits_limit": float(ni.class_4.thresholds.lower_profits_limit),
        "upper_profits_limit": float(ni.class_4.thresholds.upper_profits_limit),
    }


def run_scenario(args) -> None:
    from policyengine_uk import Microsimulation
    from policyengine_uk.utils.scenario import Scenario

    started = time.perf_counter()
    changes = scenario_changes(args.scenario)
    kwargs = {}
    if changes:
        kwargs["scenario"] = Scenario(parameter_changes=changes, applied_before_data_load=True)
    sim = Microsimulation(dataset=load_dataset(args.data), **kwargs)
    print(f"{args.scenario}: built at {time.perf_counter() - started:.0f} s", flush=True)
    survey = survey_households(sim) if args.scenario == BASELINE else None

    known = sim.tax_benefit_system.variables
    benefits = [v for v in benefit_variables() if v in known]
    own_unit = [v for v in benefits if known[v].entity.key in ("benunit", "person")]

    def read(variable: str, year: int, entity: str) -> np.ndarray:
        return np.asarray(sim.calculate(variable, year, map_to=entity, unweighted=True), dtype=float)

    out_dir = Path(args.arrays) / args.label
    out_dir.mkdir(parents=True, exist_ok=True)
    held = {}
    for year in YEARS:
        arrays = {f"p_{v}": read(v, year, "person") for v in PERSON if v in known}
        arrays |= {f"h_{v}": read(v, year, "household") for v in HOUSEHOLD if v in known}
        arrays |= {f"b_{v}": read(v, year, "household") for v in benefits}
        arrays["u_universal_credit"] = read("universal_credit", year, "benunit")
        arrays["u_benefits"] = np.sum([read(v, year, "benunit") for v in own_unit], axis=0)
        if args.scenario == BASELINE:
            arrays |= {f"p_{v}": read(v, year, "person") for v in CONSTANT_PERSON if v in known}
            arrays |= {f"h_{v}": read(v, year, "household") for v in CONSTANT_HOUSEHOLD}
            arrays["u_benunit_weight"] = read("benunit_weight", year, "benunit")
            arrays["h_survey_household"] = survey
            arrays["p_household_index"] = np.asarray(sim.populations["household"].members_entity_id)
            arrays["p_benunit_index"] = np.asarray(sim.populations["benunit"].members_entity_id)
        np.savez_compressed(out_dir / f"{args.scenario}_{year}.npz", **arrays)
        held[str(year)] = parameters_at(sim.tax_benefit_system, year)
        print(f"{args.scenario} {year}: read at {time.perf_counter() - started:.0f} s", flush=True)
    record = {
        "scenario": args.scenario,
        "parameters": held,
        "household_level_benefits": [v for v in benefits if v not in own_unit],
        "seconds": round(time.perf_counter() - started),
    }
    (out_dir / f"{args.scenario}.json").write_text(json.dumps(record, indent=1) + "\n")


# -- adding the results up: no model code below this line ----------------------


def weighted_mean(weight: np.ndarray, x: np.ndarray) -> float:
    total = float(weight.sum())
    return float(np.dot(weight, x) / total) if total > 0 else 0.0


def gini(income: np.ndarray, weight: np.ndarray) -> float:
    """The Gini coefficient of income floored at zero, by the trapezoid rule on
    the Lorenz curve, as microdf's MicroSeries.gini computes it. The dashboard's
    headline Gini takes equivalised household net income, each household weighted
    by its people."""
    x = np.maximum(np.asarray(income, dtype=float), 0)
    order = np.argsort(x, kind="mergesort")
    w = np.asarray(weight, dtype=float)[order]
    cum_w, cum_xw = np.cumsum(w), np.cumsum(x[order] * w)
    if cum_xw[-1] == 0:
        return 0.0
    return float(np.sum(cum_xw[1:] * cum_w[:-1] - cum_xw[:-1] * cum_w[1:]) / (cum_xw[-1] * cum_w[-1]))


def record_spaces(base: dict) -> dict:
    """Each record's weight and survey household, for households and people."""
    survey = base["h_survey_household"]
    return {
        HOUSEHOLDS: (base["h_household_weight"], survey),
        PEOPLE: (base["p_person_weight"], survey[base["p_household_index"]]),
    }


def in_household(base: dict, person_values: np.ndarray) -> np.ndarray:
    """Each household's sum of a person-level amount."""
    return np.bincount(base["p_household_index"], weights=person_values, minlength=len(base["h_household_weight"]))


def mean_or_none(weight: np.ndarray, x: np.ndarray):
    """A weighted mean, or None for a group with no one in it."""
    return weighted_mean(weight, x) if weight.sum() > 0 else None


def ratio(part: float, whole: float):
    """part / whole, or None for a group with no one in it."""
    return float(part / whole) if whole > 0 else None


def allocate(amount_by_unit, unit_of_person, extra_by_person):
    """Share each benefit unit's amount among its members in proportion to the
    extra tax and NI each pays. Returns each person's share, and the amount left
    with each unit whose members' extra tax and NI nets to under 50p."""
    unit_extra = np.bincount(unit_of_person, weights=extra_by_person, minlength=len(amount_by_unit))
    carried = np.abs(unit_extra) >= 0.5
    fraction = np.divide(
        extra_by_person,
        unit_extra[unit_of_person],
        out=np.zeros_like(extra_by_person, dtype=float),
        where=carried[unit_of_person],
    )
    return fraction * amount_by_unit[unit_of_person], np.where(carried, 0.0, amount_by_unit)


def pay_bands(year: int) -> list:
    """Pay bands, in £ a year. £20,000 to £25,000 holds full-time National Living
    Wage pay in both years, and the lower edges mark where the frozen and the
    indexed allowance fall."""
    return [
        ("up to £12,570", 0, ACTUAL_PA),
        (f"£12,570 to £{S57_PA[year]:,}", ACTUAL_PA, S57_PA[year]),
        (f"£{S57_PA[year]:,} to £20,000", S57_PA[year], 20_000),
        ("£20,000 to £25,000", 20_000, 25_000),
        ("£25,000 to £30,000", 25_000, 30_000),
        ("£30,000 to £50,270", 30_000, 50_270),
        ("£50,270 to £100,000", 50_270, 100_000),
        ("over £100,000", 100_000, np.inf),
    ]


class Table(NamedTuple):
    """Rows of figures, the records behind each figure and the identities among
    them. Cells and links key a figure by (row id, column). Each cell comes as
    (cell, shared): a shared cell holds a frozen-side figure, the same in every
    scenario. A link lists (key, sign) pairs whose signed figures add up to zero,
    figure by figure in the records behind them. A column that starts with "_"
    names a figure we never publish but that the published ones could give away."""

    rows: list
    cells: dict
    links: list


def single(row: dict, cells: dict, links: list) -> Table:
    """A one-row table, keyed under row id ""."""
    return Table(
        [{"_row": "", **row}],
        {("", column): value for column, value in cells.items()},
        [tuple((("", column), sign) for column, sign in link) for link in links],
    )


def totals_table(base: dict, res: dict) -> Table:
    w = base["h_household_weight"]
    bn = lambda x: float(np.dot(w, x)) / 1e9
    delta = lambda key: base[key] - res[key]
    extra_tax, extra_ni = delta("h_income_tax"), delta("h_national_insurance")
    other_tax = delta("h_household_tax") - extra_tax - extra_ni
    outside_scotland = base["p_pays_scottish_income_tax"] == 0
    person_extra_tax = base["p_income_tax"] - res["p_income_tax"]
    row = {
        "extra_income_tax_bn": bn(extra_tax),
        "extra_income_tax_outside_scottish_income_tax_bn": float(
            np.dot(base["p_person_weight"][outside_scotland], person_extra_tax[outside_scotland])
        )
        / 1e9,
        "extra_ni_bn": bn(extra_ni),
        "extra_income_tax_and_ni_bn": bn(extra_tax + extra_ni),
        "extra_other_tax_bn": bn(other_tax),
    }
    cells = {
        "extra_income_tax_bn": change_cell(HOUSEHOLDS, extra_tax),
        "extra_income_tax_outside_scottish_income_tax_bn": change_cell(
            HOUSEHOLDS, in_household(base, np.where(outside_scotland, person_extra_tax, 0.0))
        ),
        "_extra_scottish_income_tax": change_cell(
            HOUSEHOLDS, in_household(base, np.where(outside_scotland, 0.0, person_extra_tax)), published=False
        ),
        "extra_ni_bn": change_cell(HOUSEHOLDS, extra_ni),
        "extra_income_tax_and_ni_bn": change_cell(HOUSEHOLDS, extra_tax + extra_ni),
        "extra_other_tax_bn": change_cell(HOUSEHOLDS, other_tax),
    }
    named = 0.0
    for variable, column in NAMED_BENEFITS.items():
        change = delta(f"b_{variable}") if f"b_{variable}" in base else np.zeros_like(w)
        row[f"extra_{column}_bn"] = bn(change)
        cells[f"extra_{column}_bn"] = change_cell(HOUSEHOLDS, change)
        named += row[f"extra_{column}_bn"]
    others = [key for key in base if key.startswith("b_") and key[2:] not in NAMED_BENEFITS]
    row["extra_benefits_bn"] = bn(delta("h_household_benefits"))
    row["extra_other_benefits_bn"] = row["extra_benefits_bn"] - named
    row["net_income_change_bn"] = bn(delta("h_household_net_income"))
    cells["extra_benefits_bn"] = change_cell(HOUSEHOLDS, delta("h_household_benefits"))
    cells["extra_other_benefits_bn"] = change_cell(HOUSEHOLDS, sum((delta(key) for key in others), np.zeros_like(w)))
    cells["net_income_change_bn"] = change_cell(HOUSEHOLDS, delta("h_household_net_income"))
    shared = set()
    if "h_equiv_household_net_income" in base:
        people = w * base["h_household_count_people"]
        row["gini_frozen"] = gini(base["h_equiv_household_net_income"], people)
        row["gini_raised"] = gini(res["h_equiv_household_net_income"], people)
        # Each Gini index rests on every household.
        cells["gini_frozen"] = count_cell(HOUSEHOLDS, people > 0)
        cells["gini_raised"] = count_cell(HOUSEHOLDS, people > 0)
        shared.add("gini_frozen")
    benefit_parts = [f"extra_{column}_bn" for column in NAMED_BENEFITS.values()] + ["extra_other_benefits_bn"]
    links = [
        (("extra_income_tax_and_ni_bn", 1), ("extra_income_tax_bn", -1), ("extra_ni_bn", -1)),
        (
            ("extra_income_tax_bn", 1),
            ("extra_income_tax_outside_scottish_income_tax_bn", -1),
            ("_extra_scottish_income_tax", -1),
        ),
        (("extra_benefits_bn", 1), *((column, -1) for column in benefit_parts)),
        # Market income and pension contributions stay the same (checks_for).
        (
            ("net_income_change_bn", 1),
            ("extra_benefits_bn", -1),
            ("extra_income_tax_and_ni_bn", 1),
            ("extra_other_tax_bn", 1),
        ),
    ]
    return single(row, {column: (cell, column in shared) for column, cell in cells.items()}, links)


def on_uc_floor(base: dict) -> np.ndarray:
    """Households with someone UC's minimum income floor applies to."""
    return (
        np.bincount(
            base["p_household_index"],
            weights=base["p_uc_mif_applies"] > 0,
            minlength=len(base["h_household_weight"]),
        )
        > 0
    )


def no_allowance_and_less_ni(base: dict, res: dict) -> np.ndarray:
    """Households with someone who has no Personal Allowance on either side and pays
    less NI with thresholds frozen."""
    person = (
        (base["p_personal_allowance"] == 0)
        & (res["p_personal_allowance"] == 0)
        & (base["p_national_insurance"] < res["p_national_insurance"] - CHANGE_TOLERANCE)
    )
    return np.bincount(base["p_household_index"], weights=person, minlength=len(base["h_household_weight"])) > 0


def counts_table(base: dict, res: dict) -> Table:
    """People paying income tax and NI on each side, the share of households whose
    net income the freeze lowers or raises, and the shares of those it raises with
    someone on UC's minimum income floor, or with someone who pays less NI and has no
    allowance on either side."""
    pw, w = base["p_person_weight"], base["h_household_weight"]
    frozen_tax, raised_tax = base["p_income_tax"] > 0, res["p_income_tax"] > 0
    frozen_ni, raised_ni = base["p_national_insurance"] > 0, res["p_national_insurance"] > 0
    net_change = base["h_household_net_income"] - res["h_household_net_income"]
    lower, higher = net_change < -CHANGE_TOLERANCE, net_change > CHANGE_TOLERANCE
    every_household = np.ones_like(w, dtype=bool)
    floor, no_allowance = on_uc_floor(base), no_allowance_and_less_ni(base, res)
    row = {
        "income_taxpayers_frozen_m": float(pw[frozen_tax].sum() / 1e6),
        "income_taxpayers_raised_m": float(pw[raised_tax].sum() / 1e6),
        "ni_payers_frozen_m": float(pw[frozen_ni].sum() / 1e6),
        "ni_payers_raised_m": float(pw[raised_ni].sum() / 1e6),
        "share_households_lower_net_income": ratio(w[lower].sum(), w.sum()),
        "share_households_higher_net_income": ratio(w[higher].sum(), w.sum()),
        "share_of_those_higher_on_uc_minimum_income_floor": ratio(w[higher & floor].sum(), w[higher].sum()),
        "share_of_those_higher_with_no_allowance_and_less_ni": ratio(w[higher & no_allowance].sum(), w[higher].sum()),
    }
    cells = {
        "income_taxpayers_frozen_m": (count_cell(PEOPLE, frozen_tax), True),
        "income_taxpayers_raised_m": (count_cell(PEOPLE, raised_tax), False),
        "_income_taxpayers_only_one_side": (signed_count_cell(PEOPLE, frozen_tax, raised_tax, published=False), False),
        "ni_payers_frozen_m": (count_cell(PEOPLE, frozen_ni), True),
        "ni_payers_raised_m": (count_cell(PEOPLE, raised_ni), False),
        "_ni_payers_only_one_side": (signed_count_cell(PEOPLE, frozen_ni, raised_ni, published=False), False),
        "share_households_lower_net_income": (share_cell(HOUSEHOLDS, lower, every_household), False),
        "share_households_higher_net_income": (share_cell(HOUSEHOLDS, higher, every_household), False),
        "_share_households_same_net_income": (
            share_cell(HOUSEHOLDS, ~lower & ~higher, every_household, published=False),
            False,
        ),
        "share_of_those_higher_on_uc_minimum_income_floor": (share_cell(HOUSEHOLDS, floor, higher), False),
        "share_of_those_higher_with_no_allowance_and_less_ni": (share_cell(HOUSEHOLDS, no_allowance, higher), False),
    }
    links = [
        (("income_taxpayers_frozen_m", 1), ("income_taxpayers_raised_m", -1), ("_income_taxpayers_only_one_side", -1)),
        (("ni_payers_frozen_m", 1), ("ni_payers_raised_m", -1), ("_ni_payers_only_one_side", -1)),
    ]
    return single(row, cells, links)


def baseline_table(base: dict, year: int) -> Table:
    """Frozen-side levels for the year, the same in every scenario."""
    w, pw = base["h_household_weight"], base["p_person_weight"]
    bn = lambda x: float(np.dot(w, x)) / 1e9
    income = base["p_total_income"]
    employees = base["p_employment_income"] > 0
    levels = {
        "income_tax_bn": base["h_income_tax"],
        "national_insurance_bn": base["h_national_insurance"],
        "universal_credit_bn": base["b_universal_credit"],
        "housing_benefit_bn": base["b_housing_benefit"],
        "ctr_bn": base["b_council_tax_benefit"],
        "pension_credit_bn": base["b_pension_credit"],
        "household_net_income_bn": base["h_household_net_income"],
    }
    lines = {
        "people_income_above_50270_m": 50_270,
        "people_income_above_obr_indexed_higher_rate_threshold_m": OBR_INDEXED[year]["higher_rate_threshold"],
        "people_income_above_125140_m": 125_140,
        "people_income_above_150000_m": 150_000,
    }
    row = {
        "households_m": float(w.sum() / 1e6),
        "people_m": float(pw.sum() / 1e6),
        "employees_m": float(pw[employees].sum() / 1e6),
        **{column: bn(values) for column, values in levels.items()},
        **{column: float(pw[income > line].sum() / 1e6) for column, line in lines.items()},
    }
    cells = {
        "households_m": count_cell(HOUSEHOLDS, np.ones_like(w, dtype=bool)),
        "people_m": count_cell(PEOPLE, np.ones_like(pw, dtype=bool)),
        "employees_m": count_cell(PEOPLE, employees),
        **{column: level_cell(HOUSEHOLDS, values) for column, values in levels.items()},
        **{column: count_cell(PEOPLE, income > line) for column, line in lines.items()},
    }
    links = []
    ordered = sorted(lines.items(), key=lambda item: item[1])
    for (low_column, low), (high_column, high) in zip(ordered, ordered[1:]):
        between = f"_people_income_above_{low}_up_to_{high}_m"
        cells[between] = count_cell(PEOPLE, (income > low) & (income <= high), published=False)
        links.append(((low_column, 1), (high_column, -1), (between, -1)))
    return single(row, {column: (cell, True) for column, cell in cells.items()}, links)


def decile_table(base: dict, res: dict) -> Table:
    w = base["h_household_weight"]
    decile = base["h_household_income_decile"]
    net_raised = res["h_household_net_income"]
    net_change = base["h_household_net_income"] - net_raised
    extra = (base["h_income_tax"] - res["h_income_tax"]) + (base["h_national_insurance"] - res["h_national_insurance"])
    extra_benefits = base["h_household_benefits"] - res["h_household_benefits"]
    other_tax = (base["h_household_tax"] - res["h_household_tax"]) - extra
    # Each decile's figures, and the other taxes they leave a reader to work out.
    measures = {
        "average_net_income_change": net_change,
        "percent_net_income_change": net_change,
        "average_extra_income_tax_and_ni": extra,
        "average_extra_benefits": extra_benefits,
        "_average_extra_other_tax": other_tax,
    }
    rows, cells, links = [], {}, []
    for d in range(1, 11):
        m = decile == d
        ww = w[m]
        r = str(d)
        raised_total = float(np.dot(ww, net_raised[m]))
        rows.append(
            {
                "_row": r,
                "decile": d,
                "households_m": float(ww.sum() / 1e6),
                "average_net_income_change": mean_or_none(ww, net_change[m]),
                # As a share of their net income with thresholds raised, so -2.6
                # reads as 2.6% less than that.
                "percent_net_income_change": (
                    100 * float(np.dot(ww, net_change[m])) / raised_total if raised_total else None
                ),
                "average_extra_income_tax_and_ni": mean_or_none(ww, extra[m]),
                "average_extra_benefits": mean_or_none(ww, extra_benefits[m]),
            }
        )
        cells[(r, "households_m")] = (count_cell(HOUSEHOLDS, m), True)
        for column, x in measures.items():
            if column == "percent_net_income_change":
                # One percentage point stands for a hundredth of the decile's net
                # income with thresholds raised.
                cell = change_cell(HOUSEHOLDS, x, m, unit=raised_total / 100)
            else:
                cell = mean_cell(HOUSEHOLDS, x, m, published=not column.startswith("_"))
            cells[(r, column)] = (cell, False)
        links += [
            # The percentage and the average give each other away.
            (((r, "average_net_income_change"), 1), ((r, "percent_net_income_change"), -1)),
            (
                ((r, "average_net_income_change"), 1),
                ((r, "average_extra_benefits"), -1),
                ((r, "average_extra_income_tax_and_ni"), 1),
                ((r, "_average_extra_other_tax"), 1),
            ),
        ]
    # Households without a decile still count in the totals.
    outside = ~np.isin(decile, np.arange(1, 11))
    if outside.any():
        cells[("outside", "households_m")] = (count_cell(HOUSEHOLDS, outside, published=False), True)
        for column in DECILE_MARGINS.values():
            cells[("outside", column)] = (change_cell(HOUSEHOLDS, measures[column], outside, published=False), False)
    return Table(rows, cells, links)


def person_frame(base: dict, res: dict) -> dict:
    """Each person's extra tax and NI, and their share of their family's change
    in benefits."""
    extra_tax = base["p_income_tax"] - res["p_income_tax"]
    extra_ni = base["p_national_insurance"] - res["p_national_insurance"]
    extra = extra_tax + extra_ni
    benefit_share, left = allocate(base["u_benefits"] - res["u_benefits"], base["p_benunit_index"], extra)
    return {
        "extra_tax": extra_tax,
        "extra_ni": extra_ni,
        "extra": extra,
        "benefit_share": benefit_share,
        "left_with_unit": left,
    }


def pay_band_table(base: dict, res: dict, year: int) -> Table:
    frame = person_frame(base, res)
    pw = base["p_person_weight"]
    pay = base["p_employment_income"]
    workers = (pay > 0) & (base["p_age"] >= 21) & (base["p_is_SP_age"] == 0)
    on_uc = base["u_universal_credit"][base["p_benunit_index"]] > 0
    above_allowance = base["p_total_income"] > ACTUAL_PA
    net_change = frame["benefit_share"] - frame["extra"]
    means = {
        "average_extra_income_tax": frame["extra_tax"],
        "average_extra_ni": frame["extra_ni"],
        "average_extra_income_tax_and_ni": frame["extra"],
        "average_benefit_change": frame["benefit_share"],
        "average_net_income_change": net_change,
    }
    bands = pay_bands(year)
    rows, cells, links = [], {}, []
    for label, low, high in [*bands, (ALL_EMPLOYEES, 0, np.inf)]:
        m = workers & (pay >= low) & (pay < high)
        groups = {
            "average_net_income_change_on_uc": m & on_uc,
            "average_net_income_change_not_on_uc": m & ~on_uc,
        }
        rows.append(
            {
                "_row": label,
                "band": label,
                "employees_m": float(pw[m].sum() / 1e6),
                "share_in_family_on_uc": ratio(pw[m & on_uc].sum(), pw[m].sum()),
                "share_with_total_income_above_frozen_allowance": ratio(pw[m & above_allowance].sum(), pw[m].sum()),
                **{column: mean_or_none(pw[m], x[m]) for column, x in means.items()},
                **{column: mean_or_none(pw[g], net_change[g]) for column, g in groups.items()},
            }
        )
        cells[(label, "employees_m")] = (count_cell(PEOPLE, m), True)
        cells[(label, "share_in_family_on_uc")] = (share_cell(PEOPLE, on_uc, m), True)
        cells[(label, "share_with_total_income_above_frozen_allowance")] = (share_cell(PEOPLE, above_allowance, m), True)
        for column, x in means.items():
            cells[(label, column)] = (mean_cell(PEOPLE, x, m), False)
        for column, g in groups.items():
            cells[(label, column)] = (mean_cell(PEOPLE, net_change, g), False)
        links += [
            (
                ((label, "average_extra_income_tax_and_ni"), 1),
                ((label, "average_extra_income_tax"), -1),
                ((label, "average_extra_ni"), -1),
            ),
            (
                ((label, "average_net_income_change"), 1),
                ((label, "average_benefit_change"), -1),
                ((label, "average_extra_income_tax_and_ni"), 1),
            ),
            (
                ((label, "average_net_income_change"), 1),
                ((label, "average_net_income_change_on_uc"), -1),
                ((label, "average_net_income_change_not_on_uc"), -1),
            ),
        ]
    # The row for all employees adds up the bands, column by column.
    for column in rows[0]:
        if column not in ("_row", "band"):
            links.append((((ALL_EMPLOYEES, column), 1), *(((label, column), -1) for label, _, _ in bands)))
    return Table(rows, cells, links)


def poverty_table(base: dict, res: dict) -> Table:
    pw = base["p_person_weight"]
    groups = {"all": np.ones_like(pw, dtype=bool)}
    if "p_is_hbai_dependent_child" in base:
        children = base["p_is_hbai_dependent_child"] > 0
        groups["children"] = children
        # Everyone less the children: a reader can work their figures out.
        groups["_adults"] = ~children
    rows, cells, links = [], {}, []
    for measure, variable in POVERTY_MEASURES.items():
        key = f"p_{variable}"
        if key not in base:
            continue
        frozen, raised = base[key] > 0, res[key] > 0
        for group, m in groups.items():
            r = f"{measure}/{group}"
            shown = not group.startswith("_")
            if shown:
                total = pw[m].sum()
                rows.append(
                    {
                        "_row": r,
                        "measure": measure,
                        "group": group,
                        "rate_frozen": float(pw[m & frozen].sum() / total),
                        "rate_raised": float(pw[m & raised].sum() / total),
                        "people_change_m": float((pw[m & frozen].sum() - pw[m & raised].sum()) / 1e6),
                    }
                )
            cells[(r, "rate_frozen")] = (share_cell(PEOPLE, frozen, m, published=shown), True)
            cells[(r, "rate_raised")] = (share_cell(PEOPLE, raised, m, published=shown), False)
            cells[(r, "people_change_m")] = (
                signed_count_cell(PEOPLE, frozen & m, raised & m, published=shown),
                False,
            )
            links.append((((r, "people_change_m"), 1), ((r, "rate_frozen"), -1), ((r, "rate_raised"), 1)))
        if "children" in groups:
            for column in ("rate_frozen", "rate_raised", "people_change_m"):
                links.append(
                    (
                        ((f"{measure}/all", column), 1),
                        ((f"{measure}/children", column), -1),
                        ((f"{measure}/_adults", column), -1),
                    )
                )
    return Table(rows, cells, links)


def scenario_tables(base: dict, res: dict, scenario: str, year: int) -> dict:
    return {
        ("totals", scenario): totals_table(base, res),
        ("counts", scenario): counts_table(base, res),
        ("deciles", scenario): decile_table(base, res),
        ("pay_bands", scenario): pay_band_table(base, res, year),
        ("poverty", scenario): poverty_table(base, res),
    }


# -- what we publish -------------------------------------------------------------


def global_key(table: str, scope: str, local: tuple, shared: bool) -> tuple:
    """(table, scope, row id, column): the scope is the scenario, or "frozen" for a
    figure the same in every scenario."""
    return (table, FROZEN if shared else scope, *local)


def scenario_differences(cells: dict, spaces: dict, scenarios: list) -> set:
    """A reader can subtract one scenario's figure from another's. We add each
    difference that fails the rules as a figure we never publish, linked to the two
    it comes from. A difference that passes stays out of the programme, which
    credits the reader with its value only through the two figures it comes from.
    When all of a passing difference's parts share one sign, a reader also knows
    that sign, and the programme leaves that out."""
    places = defaultdict(dict)
    for key in list(cells):
        table, scope, *rest = key
        if scope in scenarios:
            places[(table, *rest)][scope] = key
    links = set()
    for (table, *rest), keyed in places.items():
        present = [keyed[scope] for scope in scenarios if scope in keyed]
        for a, b in combinations(present, 2):
            # As a signed sum: two shares need not share a group.
            difference = disclosure.remainder([(a, 1), (b, -1)], cells, published=False, kind=disclosure.SUM)
            if disclosure.passes(disclosure.supports_of(difference, spaces)):
                continue
            key = (table, f"{a[1]} less {b[1]}", *rest)
            cells[key] = difference
            links.add(((a, 1), (b, -1), (key, -1)))
    return links


def decimals(column: str, scope: str = FROZEN) -> int:
    """The decimal places we publish a column to, no finer than the minimum
    rounding bases of PolicyEngine's layer: £10 million for totals in £ billion,
    1,000 for counts in millions, 0.1 percentage points for shares and rates, £1
    for averages and 0.01 percentage points for percentage changes. We compute no
    standard errors, so the layer could round a figure more coarsely than we do.
    A Gini index keeps five places. A comparison scenario's own figures take one
    place fewer; a figure the same in every scenario has the scope "frozen" and
    keeps the paths' places."""
    places = column_decimals(column)
    return places - 1 if scope in COMPARISONS else places


def column_decimals(column: str) -> int:
    if column.startswith("gini_"):
        return 5
    if column.endswith("_bn"):
        return 2
    if column.endswith("_m"):
        return 3
    if column.startswith(("share_", "rate_")):
        return 3
    if column.startswith("average_"):
        return 0
    if column.startswith("percent_"):
        return 2
    raise ValueError(f"no rounding set for {column}")


def unit(column: str) -> float:
    """What one of a column's figures stands for in its cell's records."""
    if column.endswith("_bn"):
        return 1e9
    if column.endswith("_m"):
        return 1e6
    return 1.0


def published_value(column: str, value, scope: str = FROZEN):
    """A figure as we print it, for a cell of the given scope."""
    if value is None:
        return None
    return round(float(value), decimals(column, scope)) + 0.0


def figures(tables: dict, scenarios: list) -> tuple[dict, set, dict]:
    """Every figure of one year as a cell keyed by global_key; the links that tie
    figures within a table, the deciles to the totals, and the deciles and the
    shares of households to the number of households; and each published figure
    as we print it."""
    cells, links, values = {}, set(), {}
    for (table, scope), t in tables.items():
        for local, (cell, shared) in t.cells.items():
            key = global_key(table, scope, local, shared)
            if cell.published:
                cell = replace(cell, unit=cell.unit * unit(local[1]), decimals=decimals(local[1], key[1]))
            cells.setdefault(key, cell)
        for row in t.rows:
            for column, value in row.items():
                if column in LABELS or column == "_row":
                    continue
                key = global_key(table, scope, (row["_row"], column), t.cells[(row["_row"], column)][1])
                values.setdefault(key, published_value(column, value, key[1]))
        for link in t.links:
            links.add(tuple((global_key(table, scope, local, t.cells[local][1]), sign) for local, sign in link))
    for scope in scenarios:
        links.add(
            (
                (("counts", scope, "", "share_households_lower_net_income"), 1),
                (("counts", scope, "", "share_households_higher_net_income"), 1),
                (("counts", scope, "", "_share_households_same_net_income"), 1),
                (HOUSEHOLDS_KEY, -1),
            )
        )
        rows = sorted({local[0] for local in tables[("deciles", scope)].cells}, key=str)
        for total, decile in DECILE_MARGINS.items():
            links.add(((("totals", scope, "", total), 1), *((("deciles", scope, r, decile), -1) for r in rows)))
        links.add(((HOUSEHOLDS_KEY, 1), *((("deciles", FROZEN, r, "households_m"), -1) for r in rows)))
    return cells, links, values


SHARE_COLUMNS = (
    "share_households_lower_net_income",
    "share_households_higher_net_income",
    "_share_households_same_net_income",
)


def binding_sources(sides: tuple) -> int:
    """The survey households behind a figure's weakest side that has any, as
    policyengine.disclosure's `binding_support` picks it."""
    present = [side for side in sides if side.n_sources > 0]
    return min(present, key=lambda side: (side.n_sources, side.n_eff)).n_sources if present else 0


def share_split(cells: dict, spaces: dict, scenarios: list) -> set:
    """The shares PolicyEngine's layer withholds so that the shares of households
    with lower and higher net income cannot give away the share whose net income
    stays the same. When that third share fails the rules and both others pass,
    the layer withholds the one whose weakest side rests on fewer survey
    households, and the share with lower net income on a tie."""
    first = set()
    for scope in scenarios:
        lower, higher, same = (("counts", scope, "", column) for column in SHARE_COLUMNS)
        if same not in cells:
            continue
        sides = {key: disclosure.supports_of(cells[key], spaces) for key in (lower, higher, same)}
        both = disclosure.passes(sides[lower]) and disclosure.passes(sides[higher])
        if both and not disclosure.side_passes(sides[same][0]):
            first.add(min((lower, higher), key=lambda key: binding_sources(sides[key])))
    return first


class Disclosure(NamedTuple):
    """What we withhold from one year's figures and why."""

    withheld: set
    sides: dict
    cells: dict
    first: set
    protection: list


def path_rank(scenarios: list):
    """When we must withhold one of several figures, we take one from the
    scenario furthest down our list first, so the path the post leads with
    keeps its figures. The baseline's figures go last."""
    order = {scenario: -position for position, scenario in enumerate(scenarios)} | {FROZEN: 1}
    return lambda key: order[key[1]]


def disclose(tables: dict, spaces: dict, scenarios: list) -> Disclosure:
    """The published figures of one year to withhold, the supports of every cell,
    the cells, the shares PolicyEngine's share rule withholds first, and the
    reader's bounds on every figure we protect. A reader can also subtract one
    scenario's figure from another's."""
    cells, links, values = figures(tables, scenarios)
    links |= scenario_differences(cells, spaces, scenarios)
    first = share_split(cells, spaces, scenarios)
    reader = disclosure.Reader(cells, sorted(links, key=str), spaces, values)
    hidden = disclosure.choose(reader, first, rank=path_rank(scenarios))
    withheld = {key for key in hidden if cells[key].published}
    return Disclosure(withheld, reader.sides, cells, first, disclosure.protection(reader, hidden))


def published_rows(table: str, scope: str, t: Table, withheld: set, sides: dict) -> list:
    """The rows as we publish them, each figure rounded to its cell's places. Each
    withheld figure goes blank and its column goes under "suppressed"; a figure
    PolicyEngine's layer would mark approximate goes under "approximate". Every
    figure must have a cell behind it."""
    rows = []
    for row in t.rows:
        r = row["_row"]
        out, blank, rough = {}, [], []
        for column, value in row.items():
            if column == "_row":
                continue
            if column not in LABELS:
                _, shared = t.cells[(r, column)]
                key = global_key(table, scope, (r, column), shared)
                if key in withheld:
                    value = None
                    blank.append(column)
                elif disclosure.approximate(sides[key]):
                    rough.append(column)
                value = published_value(column, value, key[1])
            out[column] = value
        out["suppressed"] = ";".join(blank)
        out["approximate"] = ";".join(rough)
        rows.append(out)
    return rows


def _finite(value):
    return None if isinstance(value, float) and math.isinf(value) else value


def disclosure_audit(cells: dict, sides: dict, withheld: set) -> dict:
    """The supports of each published figure and of each unpublished one that fails
    the rules. They count survey households, so they stay private."""
    record = {}
    for key, cell in cells.items():
        ok = disclosure.passes(sides[key])
        if cell.published or not ok:
            record["|".join(map(str, key))] = {
                "published": cell.published,
                "withheld": key in withheld,
                "passes": ok,
                "sides": [{k: _finite(v) for k, v in side._asdict().items()} for side in sides[key]],
            }
    return record


def disclosure_summary(cells: dict, sides: dict, withheld: set, first: set = frozenset()) -> dict:
    shown = [key for key, cell in cells.items() if cell.published]
    failing = {key for key in shown if not disclosure.passes(sides[key])}
    split = (withheld & set(first)) - failing
    return {
        "figures": len(shown),
        "withheld": len(withheld),
        "withheld_failing_the_rules": len(failing),
        "withheld_by_policyengines_share_rule": len(split),
        "withheld_to_keep_a_failing_figure_out_of_reach": len(withheld - failing - split),
        "shown_on_fewer_than_30_effective_survey_households": sum(
            1 for key in shown if key not in withheld and disclosure.approximate(sides[key])
        ),
    }


def simple_workers(base: dict, res: dict) -> np.ndarray:
    """Employees whose income tax and NI plain arithmetic can state: only
    employment income, from the frozen allowance to £45,000, under State Pension
    age, outside Scottish income tax, with no pension contributions, no trading
    loss to relieve against their pay, no allowance or relief beyond the Personal
    Allowance, NI on their pay alone, and no Marriage Allowance in their family on
    either side. A higher allowance gives some partners an allowance to transfer,
    so the raised side counts too."""
    pay = base["p_employment_income"]
    family = base["p_benunit_index"]
    transfers = np.bincount(
        family,
        weights=base["p_marriage_allowance"] + res["p_marriage_allowance"],
        minlength=int(family.max()) + 1,
    )
    return (
        (pay >= ACTUAL_PA)
        & (pay < 45_000)
        & (np.abs(base["p_total_income"] - pay) < 0.01)
        & (base["p_is_SP_age"] == 0)
        & (base["p_pays_scottish_income_tax"] == 0)
        & (base["p_pension_contributions"] == 0)
        & (np.abs(base["p_allowances"] - base["p_personal_allowance"]) < 0.01)
        & (np.abs(base["p_ni_class_1_income"] - pay) < 0.01)
        & (base["p_trading_loss"] == 0)
        & (transfers[family] == 0)
    )


def float_tolerance(*levels) -> np.ndarray:
    """PolicyEngine UK holds amounts in 32-bit floats, which round to about 1
    part in 17 million, so an identity over large amounts can miss by more than
    a penny."""
    return 0.01 + 1.2e-7 * sum(np.abs(level) for level in levels)


def checks_for(base: dict, res: dict, scenario: str, year: int) -> tuple[dict, dict]:
    """Invariants of one comparison: (whether each holds, the weighted share of
    records outside each). The shares rest on few records, so they stay private."""
    w, pw = base["h_household_weight"], base["p_person_weight"]
    holds, shares = {}, {}

    def delta(key):
        return res[key] - base[key]

    identity = delta("h_household_net_income") - (
        delta("h_household_market_income")
        + delta("h_household_benefits")
        - delta("h_household_tax")
        - delta("h_pension_contributions")
    )
    identity_keys = (
        "h_household_net_income",
        "h_household_market_income",
        "h_household_benefits",
        "h_household_tax",
        "h_pension_contributions",
    )
    holds["net_income_identity_within_float_rounding"] = bool(
        np.all(np.abs(identity) < float_tolerance(*(side[k] for side in (base, res) for k in identity_keys)))
    )
    holds["market_income_unchanged"] = bool(np.all(delta("h_household_market_income") == 0))
    holds["pension_contributions_unchanged"] = bool(np.all(delta("h_pension_contributions") == 0))
    benefit_keys = [k for k in base if k.startswith("b_")]
    components = sum(delta(k) for k in benefit_keys)
    holds["benefit_components_add_up_within_float_rounding"] = bool(
        np.all(
            np.abs(components - delta("h_household_benefits"))
            < float_tolerance(
                base["h_household_benefits"],
                res["h_household_benefits"],
                *(side[k] for side in (base, res) for k in benefit_keys),
            )
        )
    )

    frame = person_frame(base, res)
    survey = base["h_survey_household"][base["p_household_index"]]
    shares["people_with_lower_income_tax_when_frozen"] = float(pw[frame["extra_tax"] < -0.01].sum() / pw.sum())
    net_change = base["h_household_net_income"] - res["h_household_net_income"]
    shares["households_with_higher_net_income_when_frozen"] = float(w[net_change > CHANGE_TOLERANCE].sum() / w.sum())
    shares["households_with_lower_net_income_when_frozen"] = float(w[net_change < -CHANGE_TOLERANCE].sum() / w.sum())
    # UC's minimum income floor treats a self-employed claimant as earning a set
    # amount after notional income tax and NI, so frozen thresholds lower that
    # amount and raise UC even for someone who pays no more tax.
    gainers = net_change > CHANGE_TOLERANCE
    household_self_employed = (
        np.bincount(base["p_household_index"], weights=base["p_self_employment_income"] != 0, minlength=len(w)) > 0
    )
    higher_uc = base["b_universal_credit"] - res["b_universal_credit"] >= 1
    shares["gainers_self_employed_with_higher_uc"] = float(
        w[gainers & household_self_employed & higher_uc].sum() / max(w[gainers].sum(), 1.0)
    )
    holds["gainers_above_floor"] = len(np.unique(base["h_survey_household"][gainers])) >= SURVEY_HOUSEHOLD_FLOOR
    shares["benefit_change_left_with_units_bn"] = float(
        np.dot(base["u_benunit_weight"], frame["left_with_unit"]) / 1e9
    )

    # UC, where it stays in payment on both sides, gives back at most 55p of each
    # £1 of extra tax and NI, the rate in regulation 22 of SI 2013/376.
    units = len(base["u_universal_credit"])
    both = (base["u_universal_credit"] > 0) & (res["u_universal_credit"] > 0)
    unit_extra = np.bincount(base["p_benunit_index"], weights=frame["extra"], minlength=units)
    uc_change = base["u_universal_credit"] - res["u_universal_credit"]
    outside = both & ((uc_change < -1) | (uc_change > 0.55 * unit_extra + 1)) & (unit_extra >= 0)
    uw = base["u_benunit_weight"]
    unit_self_employed = np.bincount(base["p_benunit_index"], weights=base["p_self_employment_income"] != 0, minlength=units) > 0
    shares["uc_units_outside_0_to_55p"] = float(uw[outside].sum() / max(uw[both].sum(), 1.0))
    shares["uc_units_outside_0_to_55p_with_no_one_self_employed"] = float(
        uw[outside & ~unit_self_employed].sum() / max(uw[both].sum(), 1.0)
    )

    if scenario in FIVE_PATHS:
        allowance, threshold = scenarios(year, S57_PA)[scenario]
        simple = simple_workers(base, res)
        pay = base["p_employment_income"]
        frozen_pt = ACTUAL_PT_WEEK * 52
        tax = 0.20 * (np.maximum(0, pay - ACTUAL_PA) - np.maximum(0, pay - allowance))
        ni = 0.08 * (np.maximum(0, pay - frozen_pt) - np.maximum(0, pay - threshold))
        holds["simple_workers_exist"] = bool(simple.any())
        holds["simple_workers_income_tax_within_1"] = bool(np.all(np.abs(tax - frame["extra_tax"])[simple] < 1))
        holds["simple_workers_ni_within_1"] = bool(np.all(np.abs(ni - frame["extra_ni"])[simple] < 1))
        shares["simple_workers_outside_1"] = float(
            pw[simple & ((np.abs(tax - frame["extra_tax"]) >= 1) | (np.abs(ni - frame["extra_ni"]) >= 1))].sum()
            / max(pw[simple].sum(), 1.0)
        )
        holds["households_behind_changes_above_floor"] = (
            len(np.unique(survey[np.abs(frame["extra"]) >= CHANGE_TOLERANCE])) >= SURVEY_HOUSEHOLD_FLOOR
        )
        holds["allowance_held"] = bool(np.isclose(res["p_personal_allowance"].max(), allowance, atol=0.01))
    if scenario == "allowance_only":
        holds["no_ni_change"] = bool(np.all(np.abs(frame["extra_ni"]) < 0.01))
    return holds, shares


def write_csv(path: Path, rows: list) -> None:
    """The rows as published_rows rounds them."""
    with open(path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def load_arrays(arrays_dir: Path, label: str, scenario: str, year: int) -> dict:
    with np.load(arrays_dir / label / f"{scenario}_{year}.npz") as handle:
        return {k: handle[k] for k in handle.files}


def cross_scenario_checks(arrays_dir: Path, label: str, year: int, base: dict) -> dict:
    """Properties across the five paths: one allowance gives one income tax, and
    a higher primary threshold never gives anyone less extra NI."""
    extra_ni, extra_tax = {}, {}
    for scenario in FIVE_PATHS:
        res = load_arrays(arrays_dir, label, scenario, year)
        extra_tax[scenario] = base["p_income_tax"] - res["p_income_tax"]
        extra_ni[scenario] = base["p_national_insurance"] - res["p_national_insurance"]
    thresholds = {s: scenarios(year, S57_PA)[s][1] for s in FIVE_PATHS}
    ordered = sorted(FIVE_PATHS, key=thresholds.get)
    return {
        "income_tax_same_on_all_paths": all(
            bool(np.all(np.abs(extra_tax[s] - extra_tax[ordered[0]]) < 0.01)) for s in FIVE_PATHS
        ),
        "extra_ni_rises_with_primary_threshold": all(
            bool(np.all(extra_ni[high] - extra_ni[low] > -0.01)) for low, high in zip(ordered, ordered[1:])
        ),
    }


def sha256_of(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(1 << 22), b""):
            digest.update(block)
    return digest.hexdigest()


def without_float_noise(values):
    """Thresholds as the meta records them: to six places, so £13,827 doesn't print
    as 13827.000000000002 and weekly thresholds keep their pence and fractions."""
    if isinstance(values, dict):
        return {key: without_float_noise(value) for key, value in values.items()}
    return round(values, 6) if isinstance(values, float) else values


def run_tables(args) -> None:
    arrays_dir, out_dir, private_dir = Path(args.arrays), Path(args.out), Path(args.private)
    out_dir.mkdir(parents=True, exist_ok=True)
    private_dir.mkdir(parents=True, exist_ok=True)
    label = args.label
    names = args.scenarios or [s for s in SCENARIOS if s != BASELINE]
    parameters = {
        name: json.loads((arrays_dir / label / f"{name}.json").read_text())["parameters"]
        for name in [BASELINE, *names]
    }
    published = {table: [] for table in TABLE_NAMES}
    holds, shares, audit, summary = {}, {}, {}, {}
    for year in YEARS:
        fy = f"{year}-{(year + 1) % 100}"
        base = load_arrays(arrays_dir, label, BASELINE, year)
        if set(FIVE_PATHS) <= set(names):
            holds[f"{fy} paths"] = cross_scenario_checks(arrays_dir, label, year, base)
        tables = {("baseline", FROZEN): baseline_table(base, year)}
        for scenario in names:
            res = load_arrays(arrays_dir, label, scenario, year)
            tables |= scenario_tables(base, res, scenario, year)
            holds[f"{fy} {scenario}"], shares[f"{fy} {scenario}"] = checks_for(base, res, scenario, year)
            del res
        found = disclose(tables, record_spaces(base), names)
        for (table, scope), t in tables.items():
            tag = {"year": fy} if scope == FROZEN else {"year": fy, "scenario": scope}
            published[table] += [{**tag, **row} for row in published_rows(table, scope, t, found.withheld, found.sides)]
        audit[fy] = {
            "figures": disclosure_audit(found.cells, found.sides, found.withheld),
            "protection": found.protection,
        }
        summary[fy] = disclosure_summary(found.cells, found.sides, found.withheld, found.first)
    for table, rows in published.items():
        write_csv(out_dir / f"national_{table}_{label}.csv", rows)
    (private_dir / f"national_shares_{label}.json").write_text(json.dumps(shares, indent=1) + "\n")
    (private_dir / f"national_disclosure_{label}.json").write_text(json.dumps(audit, indent=1) + "\n")
    meta = {
        "policyengine_uk": importlib.metadata.version("policyengine-uk"),
        "policyengine_core": importlib.metadata.version("policyengine-core"),
        "dataset": args.dataset_name,
        "dataset_sha256": sha256_of(args.data) if args.data else None,
        "disclosure": {
            "rules": {
                "minimum_survey_households": disclosure.FLOOR,
                "maximum_share_of_one_household": disclosure.MAX_TOP_SHARE,
                "minimum_error_for_one_household_p_percent_rule": disclosure.MIN_REST_SHARE,
                "change_of_at_most_counts_as_none_gbp": disclosure.CHANGE_TOLERANCE,
            },
            "decimal_places": {
                "totals_in_gbp_bn": decimals("x_bn"),
                "counts_in_millions": decimals("x_m"),
                "shares_and_rates": decimals("share_x"),
                "averages_in_gbp": decimals("average_x"),
                "percentage_changes": decimals("percent_x"),
                "gini_indexes": decimals("gini_x"),
            },
            "comparison_scenarios": {"scenarios": list(COMPARISONS), "decimal_places_fewer": 1},
            "protection": (
                "A reader's bounds on each withheld figure that fails the rules, and on the "
                "withheld figures of each link together where they fail, lie at least one "
                "survey household's largest part from the true value on each failing side."
            ),
            "figures": summary,
        },
        "scenarios": without_float_noise(
            {
                name: {path: {str(y): v for y, v in values.items()} for path, values in scenario_thresholds(name).items()}
                for name in names
            }
        ),
        "parameters_held": without_float_noise(parameters),
        "checks": holds,
    }
    (out_dir / f"national_meta_{label}.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run")
    run.add_argument("--scenario", required=True, choices=SCENARIOS)
    run.add_argument("--data", required=True)
    run.add_argument("--arrays", required=True)
    run.add_argument("--label", required=True)
    tables = sub.add_parser("tables")
    tables.add_argument("--arrays", required=True)
    tables.add_argument("--label", required=True)
    tables.add_argument("--out", required=True)
    tables.add_argument("--private", required=True)
    tables.add_argument("--data")
    tables.add_argument("--dataset-name")
    tables.add_argument("--scenarios", nargs="*")
    args = parser.parse_args()
    {"run": run_scenario, "tables": run_tables}[args.command](args)


if __name__ == "__main__":
    main()
