"""Reproduce synthetic trading-allowance examples requested in Max's review.

Run: .venv/bin/python generate_trading_extensions.py
Only trading_extensions.json is written; no population data are used.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import importlib.metadata as metadata
import json
import math
from pathlib import Path
import platform
import warnings

import policyengine as pe


YEAR = 2027
ALLOWANCE_PATH = "gov.hmrc.income_tax.allowances.trading_allowance"
REFORM = {ALLOWANCE_PATH: 3_000}
VERSIONS = {"policyengine": "6.11.1", "policyengine-uk": "2.151.0", "policyengine-core": "3.33.3"}
REVIEW_URL = "https://github.com/PolicyEngine/policyengine-app-v2/pull/1460#issuecomment-6472758764"
PERSON_OUTPUTS = [
    "employment_income", "self_employment_income", "self_employment_gross_receipts",
    "income_tax", "national_insurance", "ni_class_4", "taxable_self_employment_income",
    "trading_allowance_deduction", "uc_income_tax_on_earnings", "uc_income_tax_on_trade",
    "uc_national_insurance_on_earnings", "uc_national_insurance_on_trade",
    "uc_individual_earned_income_before_mif", "uc_individual_earned_income",
    "uc_is_in_gainful_self_employment", "uc_mif_applies",
]
BENUNIT_OUTPUTS = [
    "universal_credit", "universal_credit_pre_benefit_cap", "claims_universal_credit",
    "uc_maximum_amount", "uc_standard_allowance", "uc_child_element",
    "uc_housing_costs_element", "uc_work_allowance", "uc_earned_income_before_work_allowance",
    "uc_earned_income", "uc_income_reduction", "uc_benefit_cap_reduction", "child_benefit",
]
HOUSEHOLD_OUTPUTS = [
    "household_net_income", "hbai_household_net_income", "household_benefits",
    "household_tax", "household_market_income", "household_gross_income", "rent", "council_tax",
]


def close(actual: float, expected: float, label: str) -> None:
    if not math.isclose(actual, expected, abs_tol=0.02, rel_tol=0):
        raise AssertionError(f"{label}: actual {actual}, independent expectation {expected}")


def parameters() -> dict:
    # Parameter inspection only; all tax/benefit computation uses pe.uk below.
    from policyengine_uk.system import system

    nodes = {
        "trading_allowance": ALLOWANCE_PATH,
        "uc_taper": "gov.dwp.universal_credit.means_test.reduction_rate",
        "uc_work_allowance_monthly_with_housing": "gov.dwp.universal_credit.means_test.work_allowance.with_housing",
        "uc_work_allowance_monthly_without_housing": "gov.dwp.universal_credit.means_test.work_allowance.without_housing",
    }
    values = {name: float(system.parameters.get_child(path)(f"{YEAR}-04-06")) for name, path in nodes.items()}
    close(values["trading_allowance"], 1_000, "baseline trading allowance")
    close(values["uc_taper"], 0.55, "UC taper")
    return values


def lone_parent(receipts: int, supply_receipts: bool = True) -> dict:
    adult = {
        "age": 35, "employment_status": "PT_EMPLOYED", "hours_worked": 20 * 52,
        "employment_income": 18_000, "self_employment_income": receipts,
        # Employment is the main job. This is the statutory gainful-employment
        # determination, not an override of an income floor or UC award.
        "uc_is_in_gainful_self_employment": False,
    }
    if supply_receipts:
        adult["self_employment_gross_receipts"] = receipts
    return {
        "people": [adult, {"age": 4, "employment_status": "CHILD"}],
        "benunit": {"would_claim_uc": True, "would_claim_child_benefit": True},
        "household": {
            "region": "LONDON", "brma": "CENTRAL_LONDON",
            "tenure_type": "RENT_PRIVATELY", "rent": 12_000, "council_tax": 0,
        },
    }


def sole_trader(supply_receipts: bool = True) -> dict:
    adult = {
        "age": 35, "employment_status": "FT_SELF_EMPLOYED", "hours_worked": 35 * 52,
        "employment_income": 0, "self_employment_income": 19_500,
        "uc_is_in_gainful_self_employment": True,
    }
    if supply_receipts:
        adult["self_employment_gross_receipts"] = 20_000
    return {
        "people": [adult], "benunit": {"would_claim_uc": False, "would_claim_child_benefit": False},
        "household": {"region": "LONDON", "brma": "CENTRAL_LONDON", "tenure_type": "OWNED_OUTRIGHT", "rent": 0, "council_tax": 0},
    }


def calculate(inputs: dict, reform: dict) -> dict:
    result = pe.uk.calculate_household(
        **inputs, year=YEAR, reform=reform,
        extra_variables=PERSON_OUTPUTS + BENUNIT_OUTPUTS + HOUSEHOLD_OUTPUTS,
    )
    # Preserve wrapper-provided floating-point values, including float32
    # representation differences, rather than rounding the recorded raw output.
    return {
        "person": [{name: float(getattr(person, name)) for name in PERSON_OUTPUTS} for person in result.person],
        "benunit": {name: float(getattr(result.benunit, name)) for name in BENUNIT_OUTPUTS},
        "household": {name: float(getattr(result.household, name)) for name in HOUSEHOLD_OUTPUTS},
    }


def run_case(case: dict, law: dict) -> dict:
    baseline = calculate(case["inputs"], {})
    reformed = calculate(case["inputs"], REFORM)
    delta = {
        "income_tax": sum(person["income_tax"] for person in reformed["person"]) - sum(person["income_tax"] for person in baseline["person"]),
        "national_insurance": sum(person["national_insurance"] for person in reformed["person"]) - sum(person["national_insurance"] for person in baseline["person"]),
        "ni_class_4": sum(person["ni_class_4"] for person in reformed["person"]) - sum(person["ni_class_4"] for person in baseline["person"]),
        "universal_credit": reformed["benunit"]["universal_credit"] - baseline["benunit"]["universal_credit"],
        "household_benefits": reformed["household"]["household_benefits"] - baseline["household"]["household_benefits"],
        "household_net_income": reformed["household"]["household_net_income"] - baseline["household"]["household_net_income"],
        "hbai_household_net_income": reformed["household"]["hbai_household_net_income"] - baseline["household"]["hbai_household_net_income"],
    }
    for scenario, expected in case["independent_oracle"].items():
        for name, amount in expected.items():
            actual = delta[name] if scenario == "change" else baseline["person"][0][name] if scenario == "baseline" else reformed["person"][0][name]
            close(actual, amount, f"{case['id']} {scenario} {name}")
    close(delta["household_benefits"], delta["universal_credit"], f"{case['id']} other benefits unchanged")
    close(delta["household_net_income"], -delta["income_tax"] - delta["national_insurance"] + delta["universal_credit"], f"{case['id']} net-income identity")
    trace = None
    if case["type"] == "lone_parent":
        old_uc, new_uc = baseline["benunit"], reformed["benunit"]
        for result in (baseline, reformed):
            assert result["benunit"]["universal_credit"] > 0
            close(result["person"][0]["uc_mif_applies"], 0, f"{case['id']} MIF")
            assert result["benunit"]["uc_earned_income_before_work_allowance"] > result["benunit"]["uc_work_allowance"]
        close(new_uc["uc_work_allowance"], old_uc["uc_work_allowance"], f"{case['id']} work allowance unchanged")
        earnings_change = new_uc["uc_earned_income_before_work_allowance"] - old_uc["uc_earned_income_before_work_allowance"]
        close(earnings_change, -delta["income_tax"] - delta["national_insurance"], f"{case['id']} UC net-earnings increase")
        close(delta["universal_credit"], -law["uc_taper"] * earnings_change, f"{case['id']} UC taper arithmetic")
        trace = {
            "baseline_annual_uc_earnings_before_work_allowance": old_uc["uc_earned_income_before_work_allowance"],
            "reform_annual_uc_earnings_before_work_allowance": new_uc["uc_earned_income_before_work_allowance"],
            "annual_work_allowance": old_uc["uc_work_allowance"],
            "baseline_earnings_above_work_allowance": old_uc["uc_earned_income"],
            "reform_earnings_above_work_allowance": new_uc["uc_earned_income"],
            "explanation": "Employment earnings already exceed the work allowance. The entire increase in UC net earnings is tapered at 55%; no work-allowance boundary is crossed.",
        }
    comparison = None
    if "review_claim" in case:
        comparison = {
            "claim": case["review_claim"],
            "matches": all(math.isclose(delta[name], amount, abs_tol=0.02, rel_tol=0) for name, amount in case["review_claim"].items()),
        }
    return {**case, "baseline": baseline, "reform": reformed, "change": delta, "uc_trace": trace, "review_comparison": comparison}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("trading_extensions.json"))
    args = parser.parse_args()
    versions = {name: metadata.version(name) for name in VERSIONS}
    assert versions == VERSIONS, (versions, VERSIONS)
    warnings.filterwarnings("ignore", category=RuntimeWarning, message="(divide by zero|invalid value) encountered in (divide|multiply)")
    warnings.filterwarnings("ignore", category=UserWarning, message="Accessing \\.values on a MicroSeries returns a plain numpy array without weights\\.")
    law = parameters()
    cases = [
        {
            "id": "lone_parent_4000_receipts", "type": "lone_parent", "inputs": lone_parent(4_000),
            "gross_receipts_supplied": True, "actual_expenses": 0,
            "independent_oracle": {"baseline": {"taxable_self_employment_income": 3_000, "income_tax": 1_686}, "reform": {"taxable_self_employment_income": 1_000, "income_tax": 1_286}, "change": {"income_tax": -400, "national_insurance": 0, "universal_credit": -220, "household_net_income": 180}},
            "review_claim": {"income_tax": -400, "universal_credit": -220, "household_net_income": 180},
        },
        {
            "id": "lone_parent_1500_receipts", "type": "lone_parent", "inputs": lone_parent(1_500),
            "gross_receipts_supplied": True, "actual_expenses": 0,
            "independent_oracle": {"baseline": {"taxable_self_employment_income": 500, "income_tax": 1_186}, "reform": {"taxable_self_employment_income": 0, "income_tax": 1_086}, "change": {"income_tax": -100, "national_insurance": 0, "universal_credit": -55, "household_net_income": 45}},
            "review_claim": {"income_tax": -100, "universal_credit": -21, "household_net_income": 79},
        },
        {
            "id": "lone_parent_1500_profit_receipts_omitted", "type": "lone_parent", "inputs": lone_parent(1_500, False),
            "gross_receipts_supplied": False, "actual_expenses": 0,
            "independent_oracle": {"baseline": {"taxable_self_employment_income": 1_500, "income_tax": 1_386}, "reform": {"taxable_self_employment_income": 0, "income_tax": 1_086}, "change": {"income_tax": -300, "national_insurance": 0, "universal_credit": -165, "household_net_income": 135}},
            "limitation": "Omitting receipts activates the pinned model's fallback. This £300 tax reduction exceeds the legally calculated £100 with receipts supplied; the resulting net gain is £135 instead of £45.",
        },
        {
            "id": "sole_trader_20000_receipts_500_expenses", "type": "sole_trader", "inputs": sole_trader(),
            "gross_receipts_supplied": True, "actual_expenses": 500,
            "independent_oracle": {"baseline": {"taxable_self_employment_income": 19_000, "income_tax": 1_286, "ni_class_4": 385.8}, "reform": {"taxable_self_employment_income": 17_000, "income_tax": 886, "ni_class_4": 265.8}, "change": {"income_tax": -400, "national_insurance": -120, "universal_credit": 0, "household_net_income": 520}},
            "review_claim": {"income_tax": -400, "ni_class_4": -120, "household_net_income": 520},
        },
        {
            "id": "sole_trader_19500_profit_receipts_omitted", "type": "sole_trader", "inputs": sole_trader(False),
            "gross_receipts_supplied": False, "actual_expenses": 500,
            "independent_oracle": {"baseline": {"taxable_self_employment_income": 19_500, "income_tax": 1_386, "ni_class_4": 415.8}, "reform": {"taxable_self_employment_income": 19_500, "income_tax": 1_386, "ni_class_4": 415.8}, "change": {"income_tax": 0, "national_insurance": 0, "universal_credit": 0, "household_net_income": 0}},
            "limitation": "With receipts omitted, profit exceeds both allowance amounts, so the pinned fallback applies no relief on either side. It misses the £520 gain calculated when £20,000 receipts and £500 expenses are represented.",
        },
    ]
    outputs = []
    for case in cases:
        output = run_case(case, law)
        outputs.append(output)
        print(f"{case['id']}: " + json.dumps({name: round(value, 2) for name, value in output["change"].items()}), flush=True)
    payload = {
        "metadata": {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(), "model_year": YEAR,
            "tax_year": "2027–28", "versions": versions, "python": platform.python_version(),
            "review_url": REVIEW_URL, "review_comment_timestamp_utc": "2026-10-28T15:11:33Z",
            "baseline_parameters": law, "reform": REFORM,
            "scope": "Five synthetic case pairs; no population data, behavioural responses or national estimates. Annual model calculations; actual UC assessment periods and timing of tax payments can differ.",
            "assumptions": "Lone parent age35 with child age4, employment as main job, £18,000 annual wages, side business with zero expenses, London/Central London private rent £12,000/year, UC and Child Benefit take-up true. Sole trader age35, full-time35hours/week, £20,000 receipts and £500 costs, no other income, owns home outright, no UC claim. Both: council tax input zero; no childcare costs, capital, disability, pensions, losses or other income. Omitted inputs otherwise retain pinned model defaults. No UC award, floor amount, work allowance, or earnings intermediate is forced.",
            "oracle_tolerance_gbp": 0.02,
            "independent_arithmetic": "Basic-rate income tax20% above Personal Allowance£12,570; known-receipt taxable profit=max(0,receipts-max(expenses,allowance)); Class4 NI6% above£12,570; active UC award falls55% of extra UC net earnings above its unchanged work allowance. Missing-receipt outputs separately test the pinned fallback, not the legal receipt-based calculation.",
        },
        "cases": outputs,
    }
    args.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"Verified {len(outputs)} case pairs; wrote {args.output}", flush=True)


if __name__ == "__main__":
    main()
