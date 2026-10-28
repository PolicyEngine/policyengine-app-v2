"""Reproduce synthetic examples for the two Autumn Budget 2026 explainers.

Run with this directory's pinned .venv/bin/python. No population data are used.
Tax liability changes isolate each announced measure against the 2027 baseline.
"""

from __future__ import annotations

import argparse
import ast
import csv
from datetime import datetime, timezone
import importlib.metadata as metadata
import json
import math
from pathlib import Path
import platform
import subprocess
import warnings

import policyengine as pe


YEAR = 2027
EXPECTED_VERSIONS = {
    "policyengine": "6.11.1",
    "policyengine-uk": "2.151.0",
    "policyengine-core": "3.33.3",
}
SOURCE_COMMIT = "b50787aa75ef5aed36b822c973afa6b569464d55"
SOURCE_PR = "https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/pull/290"
RATE_ROOT = "gov.hmrc.income_tax.rates"
SAVINGS_PROPERTY = {
    f"{RATE_ROOT}.{income}.{band}": rate
    for income in ("savings", "property")
    for band, rate in (("basic", 0.24), ("higher", 0.44), ("additional", 0.49))
}
TRADING_PATH = "gov.hmrc.income_tax.allowances.trading_allowance"
TRADING = {TRADING_PATH: 3_000}
PERSON_OUTPUTS = [
    "income_tax", "savings_income_tax", "savings_allowance",
    "savings_starter_rate_income", "basic_rate_savings_income",
    "higher_rate_savings_income", "add_rate_savings_income",
    "property_income_tax", "property_finance_cost_relief",
    "taxable_property_income", "trading_allowance_deduction",
    "taxable_self_employment_income", "national_insurance", "ni_class_4",
]


def close(actual: float, expected: float, label: str) -> None:
    # Country-model monetary arrays are float32; two pence covers their
    # representation error without concealing a material example discrepancy.
    if not math.isclose(actual, expected, abs_tol=0.02, rel_tol=0):
        raise AssertionError(f"{label}: engine {actual}, independent oracle {expected}")


def rounded(value):
    if isinstance(value, list):
        return [round(float(item), 2) for item in value]
    return round(float(value), 2)


def calculate(person: dict, region: str, reform: dict, axes=None) -> dict:
    result = pe.uk.calculate_household(
        people=[{"age": 35, **person}],
        household={"region": region},
        year=YEAR,
        reform=reform,
        axes=axes,
        extra_variables=PERSON_OUTPUTS,
    )
    output = {name: rounded(getattr(result.person[0], name)) for name in PERSON_OUTPUTS}
    output["household_benefits"] = rounded(result.household.household_benefits)
    return output


def verify_baseline_parameters() -> dict:
    # Direct country access inspects parameters only. Tax calculations use pe.uk.
    from policyengine_uk.system import system

    baseline = {
        path: system.parameters.get_child(path)(f"{YEAR}-04-06")
        for path in SAVINGS_PROPERTY
    }
    for path in SAVINGS_PROPERTY:
        expected = {"basic": 0.22, "higher": 0.42, "additional": 0.47}[path.rsplit(".", 1)[1]]
        close(baseline[path], expected, path)
    baseline[TRADING_PATH] = system.parameters.get_child(TRADING_PATH)(f"{YEAR}-04-06")
    close(baseline[TRADING_PATH], 1_000, TRADING_PATH)
    return baseline


def source_comparison(checkout: Path | None) -> dict:
    """Optionally execute the dashboard's relevant builder, not its pipeline."""
    record = {
        "pull_request": SOURCE_PR,
        "commit": SOURCE_COMMIT,
        "source_file_url": f"https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/{SOURCE_COMMIT}/src/uk_budget_data/reforms.py",
        "compared_file": "src/uk_budget_data/reforms.py",
        "baseline_parameters": verify_baseline_parameters(),
        "reform_parameters": {**SAVINGS_PROPERTY, **TRADING},
        "dashboard_builder_verified": checkout is not None,
    }
    if checkout is None:
        return {
            **record,
            "comparison": "Independent reform dictionaries and baseline parameters verified. Optional dashboard-builder comparison not requested; immutable source reference recorded above.",
        }
    commit = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=checkout, text=True
    ).strip()
    if commit != SOURCE_COMMIT:
        raise AssertionError(f"Dashboard checkout changed: {commit}")
    source_file = checkout / "src/uk_budget_data/reforms.py"
    tree = ast.parse(source_file.read_text())
    names = {
        "INCOME_TAX_RATES", "UNEARNED_INCOME_RATE_PATHS",
        "UNEARNED_INCOME_RATE_RISE", "UNEARNED_INCOME_RATES_FROM",
        "TRADING_ALLOWANCE", "TRADING_ALLOWANCE_RAISED", "TRADING_ALLOWANCE_FROM",
    }
    selected = [
        node for node in tree.body
        if (
            isinstance(node, ast.Assign)
            and any(isinstance(target, ast.Name) and target.id in names for target in node.targets)
        ) or (isinstance(node, ast.FunctionDef) and node.name == "unearned_income_rates_up")
    ]
    scope = {
        "POLICY_YEARS": list(range(2026, 2032)),
        # The real template validates then returns this same dictionary shape.
        "rate_change": lambda path, years: {path: years},
    }
    exec(compile(ast.Module(body=selected, type_ignores=[]), str(source_file), "exec"), scope)
    dashboard = scope["unearned_income_rates_up"]()
    flat = {path: values[str(YEAR)] for path, values in dashboard.items()}
    assert flat == SAVINGS_PROPERTY, (flat, SAVINGS_PROPERTY)
    assert scope["UNEARNED_INCOME_RATES_FROM"] == YEAR
    assert scope["TRADING_ALLOWANCE_FROM"] == YEAR
    assert {scope["TRADING_ALLOWANCE"]: scope["TRADING_ALLOWANCE_RAISED"]} == TRADING
    return {
        **record,
        "comparison": "Relevant parameter declarations and savings/property builder match the independent flat reform dictionaries; no combined-package modifiers run.",
    }


def cases() -> list[dict]:
    rows = []

    def add(case_id, policy, person, expected, region="LONDON", detail=None):
        rows.append({
            "id": case_id, "policy": policy, "region": region,
            "person": person, "independent_oracle": expected,
            "detail": detail,
        })

    for case_id, salary, interest, allowance, before, after in [
        ("saver_below_allowance", 30_000, 500, 1_000, 0, 0),
        ("saver_basic", 30_000, 2_000, 1_000, 220, 240),
        ("saver_higher", 60_000, 2_000, 500, 630, 660),
        ("saver_additional", 150_000, 2_000, 0, 940, 980),
        ("saver_crosses_basic_higher", 49_270, 2_000, 500, 530, 560),
        ("saver_starting_rate", 15_000, 4_000, 1_000, 94.60, 103.20),
    ]:
        add(case_id, "savings_property", {
            "employment_income": salary, "savings_interest_income": interest,
        }, {
            "baseline": {"savings_allowance": allowance, "savings_income_tax": before},
            "reform": {"savings_allowance": allowance, "savings_income_tax": after},
            "change": {"income_tax": after - before},
        })
    add("saver_scotland_higher", "savings_property", {
        "employment_income": 60_000, "savings_interest_income": 2_000,
    }, {"baseline": {"savings_income_tax": 630}, "reform": {"savings_income_tax": 660},
        "change": {"income_tax": 30}}, region="SCOTLAND")

    for band, salary, before, after, total in [
        ("basic", 30_000, 2_200, 2_400, 4_806),
        ("higher", 60_000, 4_200, 4_400, 14_752),
        ("additional", 150_000, 4_700, 4_900, 57_523),
        ("crosses_basic_higher", 45_000, 3_146, 3_346, 8_752),
    ]:
        add(f"landlord_{band}_mortgage", "savings_property", {
            "employment_income": salary, "property_income": 10_000,
            "property_finance_costs": 4_000,
        }, {
            "baseline": {"property_income_tax": before, "property_finance_cost_relief": 880, "income_tax": total},
            "reform": {"property_income_tax": after, "property_finance_cost_relief": 960, "income_tax": total + 120},
            "change": {"income_tax": 120},
        }, detail={"gross_rent": 12_000, "actual_non_finance_expenses": 2_000})
    for region in ("LONDON", "WALES", "NORTHERN_IRELAND"):
        add(f"landlord_mortgage_free_{region.lower()}", "savings_property", {
            "employment_income": 30_000, "property_income": 10_000,
        }, {"baseline": {"property_income_tax": 2_200}, "reform": {"property_income_tax": 2_400},
            "change": {"income_tax": 200}}, region=region)
    for finance, change in ((0, 0), (4_000, -80)):
        add(f"landlord_scotland_finance_{finance}", "savings_property", {
            "employment_income": 60_000, "property_income": 10_000,
            "property_finance_costs": finance,
        }, {"change": {"property_income_tax": 0, "property_finance_cost_relief": finance * 0.02, "income_tax": change}},
            region="SCOTLAND", detail="Scottish property rates do not change; the UK-wide finance-cost credit rate does.")
    add("property_then_savings_order", "savings_property", {
        "employment_income": 45_000, "property_income": 6_000,
        "savings_interest_income": 2_000,
    }, {
        "baseline": {"property_income_tax": 1_466, "savings_income_tax": 630, "income_tax": 8_582},
        "reform": {"property_income_tax": 1_586, "savings_income_tax": 660, "income_tax": 8_732},
        "change": {"income_tax": 150},
    })

    for salary, marginal in ((30_000, 0.2), (60_000, 0.4)):
        wages_tax = 3_486 if salary == 30_000 else 11_432
        for expenses in (500, 2_500, 3_500):
            receipts = 4_000
            before = max(0, receipts - max(expenses, 1_000))
            after = max(0, receipts - max(expenses, 3_000))
            add(f"trader_salary_{salary}_expenses_{expenses}", "trading", {
                "employment_income": salary,
                "self_employment_gross_receipts": receipts,
                "self_employment_income": receipts - expenses,
            }, {
                "baseline": {"taxable_self_employment_income": before, "income_tax": wages_tax + before * marginal, "ni_class_4": 0},
                "reform": {"taxable_self_employment_income": after, "income_tax": wages_tax + after * marginal, "ni_class_4": 0},
                "change": {"income_tax": (after - before) * marginal, "national_insurance": 0},
            }, detail={"gross_receipts": receipts, "actual_expenses": expenses})
    return rows


def generate_cases() -> list[dict]:
    output = []
    for case in cases():
        reform = SAVINGS_PROPERTY if case["policy"] == "savings_property" else TRADING
        baseline = calculate(case["person"], case["region"], {})
        reformed = calculate(case["person"], case["region"], reform)
        change = {name: round(reformed[name] - baseline[name], 2) for name in baseline}
        result = {**case, "baseline": baseline, "reform": reformed, "change": change}
        for scenario, expectations in case["independent_oracle"].items():
            for variable, expected in expectations.items():
                close(result[scenario][variable], expected, f"{case['id']} {scenario} {variable}")
        close(baseline["household_benefits"], 0, f"{case['id']} baseline benefits")
        close(reformed["household_benefits"], 0, f"{case['id']} reform benefits")
        output.append(result)
    return output


def generate_curves() -> tuple[list[dict], list[dict]]:
    interest_rows = [{"interest": value} for value in range(500, 5_001, 500)]
    for label, salary, allowance, old_rate in (
        ("basic", 30_000, 1_000, 0.22), ("higher", 60_000, 500, 0.42),
    ):
        axes = [[{"name": "savings_interest_income", "min": 500, "max": 5_000, "count": 10}]]
        baseline = calculate({"employment_income": salary}, "LONDON", {}, axes)
        reformed = calculate({"employment_income": salary}, "LONDON", SAVINGS_PROPERTY, axes)
        for index, row in enumerate(interest_rows):
            taxable = max(0, row["interest"] - allowance)
            before, after = baseline["savings_income_tax"][index], reformed["savings_income_tax"][index]
            close(before, taxable * old_rate, f"{label} savings curve baseline")
            close(after, taxable * (old_rate + 0.02), f"{label} savings curve reform")
            row[f"{label}_baseline_tax"] = before
            row[f"{label}_reform_tax"] = after
            row[f"{label}_tax_increase"] = round(after - before, 2)

    trading_rows = [{"receipts": value} for value in range(500, 5_001, 500)]
    for label, expense_share in (("no_expenses", 0), ("expenses_75_percent", 0.75)):
        profit_share = 1 - expense_share
        axes = [[
            {"name": "self_employment_gross_receipts", "min": 500, "max": 5_000, "count": 10},
            {"name": "self_employment_income", "min": 500 * profit_share, "max": 5_000 * profit_share, "count": 10},
        ]]
        baseline = calculate({"employment_income": 30_000}, "LONDON", {}, axes)
        reformed = calculate({"employment_income": 30_000}, "LONDON", TRADING, axes)
        for index, row in enumerate(trading_rows):
            receipts = row["receipts"]
            expenses = receipts * expense_share
            old_taxable = max(0, receipts - max(expenses, 1_000))
            new_taxable = max(0, receipts - max(expenses, 3_000))
            close(baseline["taxable_self_employment_income"][index], old_taxable, f"{label} trading baseline")
            close(reformed["taxable_self_employment_income"][index], new_taxable, f"{label} trading reform")
            reduction = round(baseline["income_tax"][index] - reformed["income_tax"][index], 2)
            close(reduction, (old_taxable - new_taxable) * 0.2, f"{label} trading tax reduction")
            close(baseline["ni_class_4"][index], 0, f"{label} baseline Class 4")
            close(reformed["ni_class_4"][index], 0, f"{label} reform Class 4")
            row[f"{label}_actual_expenses"] = expenses
            row[f"{label}_baseline_taxable_profit"] = old_taxable
            row[f"{label}_reform_taxable_profit"] = new_taxable
            row[f"{label}_tax_reduction"] = reduction
    return interest_rows, trading_rows


def chart_specs(savings, trading) -> dict:
    source = "PolicyEngine 6.11.1 / UK 2.151.0; synthetic adults, 2027–28; incomes held fixed."
    return {
        "savings-interest-chart.json": {
            "type": "bar", "title": "Savings tax increases apply above the Personal Savings Allowance",
            "subtitle": "Annual income tax increase; England, salaries £30,000 and £60,000, 2027–28",
            "xKey": "interest", "yLabel": "Extra annual income tax (£)",
            "format": {"prefix": "£", "decimals": 0}, "source": source,
            "series": [
                {"key": "basic", "name": "£30,000 salary", "color": "negative"},
                {"key": "higher", "name": "£60,000 salary", "color": "secondary"},
            ],
            "data": [{"interest": f"£{row['interest']:,}", "basic": row["basic_tax_increase"], "higher": row["higher_tax_increase"]} for row in savings],
        },
        "trading-allowance-chart.json": {
            "type": "bar", "title": "Trading allowance: the income tax reduction depends on expenses",
            "subtitle": "Annual income tax reduction; England, £30,000 salary, 2027–28",
            "xKey": "receipts", "yLabel": "Annual income tax reduction (£)",
            "format": {"prefix": "£", "decimals": 0}, "source": source,
            "series": [
                {"key": "noExpenses", "name": "No business expenses", "color": "primary"},
                {"key": "highExpenses", "name": "Expenses equal 75% of receipts", "color": "secondary"},
            ],
            "data": [{"receipts": f"£{row['receipts']:,}", "noExpenses": row["no_expenses_tax_reduction"], "highExpenses": row["expenses_75_percent_tax_reduction"]} for row in trading],
        },
    }


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dashboard-checkout", type=Path, help="Optional checkout at the recorded PR290 commit for source-builder comparison; not needed for household calculations.")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    versions = {package: metadata.version(package) for package in EXPECTED_VERSIONS}
    assert versions == EXPECTED_VERSIONS, (versions, EXPECTED_VERSIONS)
    # Formula files are dynamically loaded, so their warning module names do
    # not consistently match policyengine_uk. Filter these exact known messages.
    warnings.filterwarnings("ignore", category=RuntimeWarning, message="(divide by zero|invalid value) encountered in (divide|multiply)")
    warnings.filterwarnings("ignore", category=UserWarning, message="Accessing \\.values on a MicroSeries returns a plain numpy array without weights\\.")
    comparison = source_comparison(args.dashboard_checkout)
    households = generate_cases()
    savings, trading = generate_curves()
    payload = {
        "metadata": {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "tax_year": "2027–28", "model_year": YEAR, "versions": versions,
            "python": platform.python_version(), "dashboard_comparison": comparison,
            "scope": "Synthetic single adults age 35; no microdata, no behavioural responses or national estimates. Income and expenses held fixed; tax liabilities, not full household net-income changes.",
            "assumptions": "No children, pensions, Gift Aid, student loans, capital gains, other tax reliefs, property losses or carried-forward finance costs. Savings are outside ISAs. Trading receipts and profit are both supplied; no connected-party receipts or partnership income. All example benefit totals are checked to be zero.",
            "oracle_tolerance_gbp": 0.02,
            "warning_filters": "Known household divide/invalid RuntimeWarnings and single-household model decile .values warnings only; no population weights are accessed by this generator.",
        },
        "reforms": {"savings_property": SAVINGS_PROPERTY, "trading": TRADING},
        "households": households,
        "savings_interest_curve": savings, "trading_receipts_curve": trading,
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "households.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    flat = []
    for row in households:
        record = {"id": row["id"], "policy": row["policy"], "region": row["region"], "model_year": YEAR}
        record.update({f"input_{name}": row["person"].get(name, 0) for name in (
            "employment_income", "savings_interest_income", "property_income",
            "property_finance_costs", "self_employment_gross_receipts", "self_employment_income",
        )})
        for scenario in ("baseline", "reform", "change"):
            record.update({f"{scenario}_{name}": value for name, value in row[scenario].items()})
        flat.append(record)
    write_csv(args.output_dir / "households.csv", flat)
    write_csv(args.output_dir / "savings-interest-curve.csv", savings)
    write_csv(args.output_dir / "trading-receipts-curve.csv", trading)
    for filename, spec in chart_specs(savings, trading).items():
        (args.output_dir / filename).write_text(json.dumps(spec, indent=2, ensure_ascii=False) + "\n")
    print(f"Verified {len(households)} household comparisons and {len(savings) + len(trading)} curve points; wrote {args.output_dir}")


if __name__ == "__main__":
    main()
