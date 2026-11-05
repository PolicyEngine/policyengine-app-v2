"""National figures for the post on the threshold freeze.

Runs PolicyEngine UK on the Microcosm UK national file, one simulation per
scenario, each in its own process, then adds the results up:

    python national_freeze.py run --scenario baseline \
        --data FILE --arrays PRIVATE_DIR --label certified --overlay
    python national_freeze.py tables \
        --arrays PRIVATE_DIR --label certified --out OUTPUT_DIR --private PRIVATE_DIR

`run` writes one set of record-level arrays per scenario and year to
PRIVATE_DIR. Those arrays derive from the Family Resources Survey, so they stay
outside this repository. `tables` writes aggregate CSVs to OUTPUT_DIR, and keeps
for PRIVATE_DIR only the share of records behind each check.

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
import sys
import time
from pathlib import Path

import numpy as np

from thresholds import ACTUAL_PA, ACTUAL_PT_WEEK, OBR_INDEXED, S57_PA, YEARS, scenarios

HERE = Path(__file__).resolve().parent

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

# The UK Data Service licence bars a cell "based on only one or two cases" and
# advises 10 against secondary disclosure. We hold every published cell to 10
# survey households behind its changed records, the level the dashboard's binned
# and area results keep.
SURVEY_HOUSEHOLD_FLOOR = 10
CHANGE_TOLERANCE = 0.01

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
    qualifying for the relief on the main elasticity. The allowance sets which
    gains pay which rate, and PolicyEngine UK's main elasticity defaults to 1
    from 2.134.0. The baseline needs this too, since the forecast overlay counts
    as a change of rules and would otherwise move gains there."""
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
    if args.overlay:
        sys.path.insert(0, str(HERE.parent / "uk-budget-2026-income-tax"))
        from forecast import with_forecast

        changes = with_forecast(changes)
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


def thin(survey, members, changed, floor: int = SURVEY_HOUSEHOLD_FLOOR) -> bool:
    """Whether a cell's change comes from 1 to floor - 1 survey households."""
    return 0 < len(np.unique(survey[members & changed])) < floor


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


def totals_row(base: dict, res: dict) -> dict:
    w = base["h_household_weight"]
    bn = lambda x: float(np.dot(w, x)) / 1e9
    extra_tax = base["h_income_tax"] - res["h_income_tax"]
    extra_ni = base["h_national_insurance"] - res["h_national_insurance"]
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
        "extra_other_tax_bn": bn(base["h_household_tax"] - res["h_household_tax"] - extra_tax - extra_ni),
    }
    named = 0.0
    for variable, column in NAMED_BENEFITS.items():
        value = bn(base[f"b_{variable}"] - res[f"b_{variable}"]) if f"b_{variable}" in base else 0.0
        row[f"extra_{column}_bn"] = value
        named += value
    row["extra_benefits_bn"] = bn(base["h_household_benefits"] - res["h_household_benefits"])
    row["extra_other_benefits_bn"] = row["extra_benefits_bn"] - named
    row["net_income_change_bn"] = bn(base["h_household_net_income"] - res["h_household_net_income"])
    if "h_equiv_household_net_income" in base:
        people = w * base["h_household_count_people"]
        row["gini_frozen"] = gini(base["h_equiv_household_net_income"], people)
        row["gini_raised"] = gini(res["h_equiv_household_net_income"], people)
    return row


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


def counts_row(base: dict, res: dict) -> dict:
    """People paying income tax and NI on each side, the share of households whose
    net income the freeze lowers or raises, and the shares of those it raises with
    someone on UC's minimum income floor, or with someone who pays less NI and has no
    allowance on either side. A cell behind too few survey households stays blank."""
    pw, w = base["p_person_weight"], base["h_household_weight"]
    survey = base["h_survey_household"]
    person_survey = survey[base["p_household_index"]]
    everyone = np.ones_like(pw, dtype=bool)
    every_household = np.ones_like(w, dtype=bool)
    frozen_tax, raised_tax = base["p_income_tax"] > 0, res["p_income_tax"] > 0
    frozen_ni, raised_ni = base["p_national_insurance"] > 0, res["p_national_insurance"] > 0
    net_change = base["h_household_net_income"] - res["h_household_net_income"]
    lower, higher = net_change < -CHANGE_TOLERANCE, net_change > CHANGE_TOLERANCE

    def share(mask):
        if thin(survey, every_household, mask):
            return None
        return float(w[mask].sum() / w.sum())

    def people(frozen, raised):
        if thin(person_survey, everyone, frozen != raised):
            return None, None
        return float(pw[frozen].sum() / 1e6), float(pw[raised].sum() / 1e6)

    def share_of_higher(mask):
        """Blank when either side of the split rests on too few survey households."""
        chosen, others = higher & mask, higher & ~mask
        if min(len(np.unique(survey[chosen])), len(np.unique(survey[others]))) < SURVEY_HOUSEHOLD_FLOOR:
            return None
        return float(w[chosen].sum() / w[higher].sum())

    tax_frozen, tax_raised = people(frozen_tax, raised_tax)
    ni_frozen, ni_raised = people(frozen_ni, raised_ni)
    return {
        "income_taxpayers_frozen_m": tax_frozen,
        "income_taxpayers_raised_m": tax_raised,
        "ni_payers_frozen_m": ni_frozen,
        "ni_payers_raised_m": ni_raised,
        "share_households_lower_net_income": share(lower),
        "share_households_higher_net_income": share(higher),
        "share_of_those_higher_on_uc_minimum_income_floor": share_of_higher(on_uc_floor(base)),
        "share_of_those_higher_with_no_allowance_and_less_ni": share_of_higher(no_allowance_and_less_ni(base, res)),
    }


def baseline_row(base: dict, year: int) -> dict:
    w, pw = base["h_household_weight"], base["p_person_weight"]
    bn = lambda x: float(np.dot(w, x)) / 1e9
    income = base["p_total_income"]
    above = lambda amount: float(pw[income > amount].sum() / 1e6)
    return {
        "households_m": float(w.sum() / 1e6),
        "people_m": float(pw.sum() / 1e6),
        "employees_m": float(pw[base["p_employment_income"] > 0].sum() / 1e6),
        "income_tax_bn": bn(base["h_income_tax"]),
        "national_insurance_bn": bn(base["h_national_insurance"]),
        "universal_credit_bn": bn(base["b_universal_credit"]),
        "housing_benefit_bn": bn(base["b_housing_benefit"]),
        "ctr_bn": bn(base["b_council_tax_benefit"]),
        "pension_credit_bn": bn(base["b_pension_credit"]),
        "household_net_income_bn": bn(base["h_household_net_income"]),
        "people_income_above_50270_m": above(50_270),
        "people_income_above_obr_indexed_higher_rate_threshold_m": above(OBR_INDEXED[year]["higher_rate_threshold"]),
        "people_income_above_125140_m": above(125_140),
        "people_income_above_150000_m": above(150_000),
    }


def decile_rows(base: dict, res: dict) -> list:
    w = base["h_household_weight"]
    decile = base["h_household_income_decile"]
    survey = base["h_survey_household"]
    net_raised = res["h_household_net_income"]
    net_change = base["h_household_net_income"] - net_raised
    extra = (base["h_income_tax"] - res["h_income_tax"]) + (base["h_national_insurance"] - res["h_national_insurance"])
    extra_benefits = base["h_household_benefits"] - res["h_household_benefits"]
    changed = np.abs(net_change) >= CHANGE_TOLERANCE
    rows = []
    for d in range(1, 11):
        m = decile == d
        ww = w[m]
        rows.append(
            {
                "decile": d,
                "households_m": float(ww.sum() / 1e6),
                "average_net_income_change": weighted_mean(ww, net_change[m]),
                # As a share of what they would have if the government had raised
                # the thresholds, so "2.6% less than" reads against that net income.
                "percent_net_income_change": 100 * float(np.dot(ww, net_change[m])) / float(np.dot(ww, net_raised[m])),
                "average_extra_income_tax_and_ni": weighted_mean(ww, extra[m]),
                "average_extra_benefits": weighted_mean(ww, extra_benefits[m]),
                "thin": thin(survey, m, changed),
            }
        )
    return rows


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


def pay_band_rows(base: dict, res: dict, year: int) -> list:
    frame = person_frame(base, res)
    pw = base["p_person_weight"]
    pay = base["p_employment_income"]
    workers = (pay > 0) & (base["p_age"] >= 21) & (base["p_is_SP_age"] == 0)
    on_uc = base["u_universal_credit"][base["p_benunit_index"]] > 0
    survey = base["h_survey_household"][base["p_household_index"]]
    net_change = frame["benefit_share"] - frame["extra"]
    changed = np.abs(net_change) >= CHANGE_TOLERANCE
    rows = []
    for label, low, high in [*pay_bands(year), ("all employees", 0, np.inf)]:
        m = workers & (pay >= low) & (pay < high)
        weights = pw[m]

        def mean(x, mask=None):
            chosen = m if mask is None else m & mask
            return weighted_mean(pw[chosen], x[chosen])

        # A cell behind too few survey households stays blank.
        uc_is_thin = len(np.unique(survey[m & on_uc])) < SURVEY_HOUSEHOLD_FLOOR
        rows.append(
            {
                "band": label,
                "employees_m": float(weights.sum() / 1e6),
                "share_in_family_on_uc": None if uc_is_thin else float(pw[m & on_uc].sum() / weights.sum()),
                "share_with_total_income_above_frozen_allowance": float(
                    pw[m & (base["p_total_income"] > ACTUAL_PA)].sum() / weights.sum()
                ),
                "average_extra_income_tax": mean(frame["extra_tax"]),
                "average_extra_ni": mean(frame["extra_ni"]),
                "average_extra_income_tax_and_ni": mean(frame["extra"]),
                "average_benefit_change": mean(frame["benefit_share"]),
                "average_net_income_change": mean(net_change),
                "average_net_income_change_on_uc": None if uc_is_thin else mean(net_change, on_uc),
                "average_net_income_change_not_on_uc": mean(net_change, ~on_uc),
                "thin": thin(survey, m, changed),
            }
        )
    return rows


def poverty_rows(base: dict, res: dict) -> list:
    pw = base["p_person_weight"]
    survey = base["h_survey_household"][base["p_household_index"]]
    groups = {"all": np.ones_like(pw, dtype=bool)}
    if "p_is_hbai_dependent_child" in base:
        groups["children"] = base["p_is_hbai_dependent_child"] > 0
    rows = []
    for measure, variable in POVERTY_MEASURES.items():
        key = f"p_{variable}"
        if key not in base:
            continue
        frozen, raised = base[key] > 0, res[key] > 0
        for group, m in groups.items():
            total = pw[m].sum()
            rows.append(
                {
                    "measure": measure,
                    "group": group,
                    "rate_frozen": float(pw[m & frozen].sum() / total),
                    "rate_raised": float(pw[m & raised].sum() / total),
                    "people_change_m": float((pw[m & frozen].sum() - pw[m & raised].sum()) / 1e6),
                    "thin": thin(survey, m, frozen != raised),
                }
            )
    return rows


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


def rounded(key: str, value):
    """Rates and Gini coefficients keep five decimal places, to show their small
    changes. Everything else keeps three."""
    if not isinstance(value, float):
        return value
    return round(value, 5 if key.startswith(("rate_", "gini_")) else 3)


def without_thin_values(rows: list, keep: tuple) -> list:
    """A row behind too few survey households keeps its labels and its group's size,
    and loses its values."""
    labels = ("year", "scenario", "thin", *keep)
    return [{k: v if k in labels or not row["thin"] else None for k, v in row.items()} for row in rows]


def write_csv(path: Path, rows: list) -> None:
    with open(path, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({k: rounded(k, v) for k, v in row.items()})


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


def run_tables(args) -> None:
    arrays_dir, out_dir, private_dir = Path(args.arrays), Path(args.out), Path(args.private)
    out_dir.mkdir(parents=True, exist_ok=True)
    private_dir.mkdir(parents=True, exist_ok=True)
    label = args.label
    totals, baseline, deciles, bands, poverty, counts = [], [], [], [], [], []
    holds, shares, parameters = {}, {}, {}
    names = args.scenarios or [s for s in SCENARIOS if s != BASELINE]
    for name in [BASELINE, *names]:
        record = json.loads((arrays_dir / label / f"{name}.json").read_text())
        parameters[name] = record["parameters"]
    for year in YEARS:
        fy = f"{year}-{(year + 1) % 100}"
        base = load_arrays(arrays_dir, label, BASELINE, year)
        baseline.append({"year": fy, **baseline_row(base, year)})
        if set(FIVE_PATHS) <= set(names):
            holds[f"{fy} paths"] = cross_scenario_checks(arrays_dir, label, year, base)
        for scenario in names:
            res = load_arrays(arrays_dir, label, scenario, year)
            tag = {"year": fy, "scenario": scenario}
            totals.append({**tag, **totals_row(base, res)})
            counts.append({**tag, **counts_row(base, res)})
            deciles += [{**tag, **r} for r in decile_rows(base, res)]
            bands += [{**tag, **r} for r in pay_band_rows(base, res, year)]
            poverty += [{**tag, **r} for r in poverty_rows(base, res)]
            holds[f"{fy} {scenario}"], shares[f"{fy} {scenario}"] = checks_for(base, res, scenario, year)
    write_csv(out_dir / f"national_totals_{label}.csv", totals)
    write_csv(out_dir / f"national_baseline_{label}.csv", baseline)
    write_csv(out_dir / f"national_deciles_{label}.csv", without_thin_values(deciles, ("decile", "households_m")))
    write_csv(out_dir / f"national_pay_bands_{label}.csv", without_thin_values(bands, ("band", "employees_m")))
    write_csv(out_dir / f"national_poverty_{label}.csv", without_thin_values(poverty, ("measure", "group")))
    write_csv(out_dir / f"national_counts_{label}.csv", counts)
    (private_dir / f"national_shares_{label}.json").write_text(json.dumps(shares, indent=1) + "\n")
    meta = {
        "policyengine_uk": importlib.metadata.version("policyengine-uk"),
        "policyengine_core": importlib.metadata.version("policyengine-core"),
        "dataset": args.dataset_name,
        "dataset_sha256": sha256_of(args.data) if args.data else None,
        "forecast": _forecast_provenance() if args.overlay else None,
        "survey_household_floor": SURVEY_HOUSEHOLD_FLOOR,
        "scenarios": {
            name: {path: {str(y): v for y, v in values.items()} for path, values in scenario_thresholds(name).items()}
            for name in names
        },
        "parameters_held": parameters,
        "checks": holds,
    }
    (out_dir / f"national_meta_{label}.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False) + "\n")


def _forecast_provenance() -> dict:
    sys.path.insert(0, str(HERE.parent / "uk-budget-2026-income-tax"))
    from forecast import provenance

    return provenance()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run")
    run.add_argument("--scenario", required=True, choices=SCENARIOS)
    run.add_argument("--data", required=True)
    run.add_argument("--arrays", required=True)
    run.add_argument("--label", required=True)
    run.add_argument("--overlay", action="store_true")
    tables = sub.add_parser("tables")
    tables.add_argument("--arrays", required=True)
    tables.add_argument("--label", required=True)
    tables.add_argument("--out", required=True)
    tables.add_argument("--private", required=True)
    tables.add_argument("--data")
    tables.add_argument("--dataset-name")
    tables.add_argument("--overlay", action="store_true")
    tables.add_argument("--scenarios", nargs="*")
    args = parser.parse_args()
    {"run": run_scenario, "tables": run_tables}[args.command](args)


if __name__ == "__main__":
    main()
