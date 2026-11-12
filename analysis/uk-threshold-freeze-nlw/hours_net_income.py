"""Net income by weekly hours, after Universal Credit and Council Tax Reduction.

Runs PolicyEngine UK household simulations for 2026-27, with no microdata:

    python hours_net_income.py OUTPUT_DIR

Writes hours.csv and hours_meta.json. Every comparison runs one way: frozen less
raised, so a net_income_change of -£442 means the household has £442 less with
thresholds frozen than it would have with them raised.

Single workers and lone parents on the National Living Wage run from 15 to 40
hours a week. Each council row names a council whose working-age Council Tax
Reduction scheme PolicyEngine UK runs, and uses that council's 2026-27 Band C bill
after the 25% single person discount. hours_meta.json also holds a lone parent on
UC's minimum income floor and single employees on higher pay, on the path that
raises NI's primary threshold with the allowance.
"""

import csv
import importlib.metadata
import json
import sys
from pathlib import Path

from policyengine_uk import Simulation

from nlw_freeze import reform_for, situation
from thresholds import BAND_D, CHART_KINKS, NLW, S57_PA, council_bill, scenarios

YEAR = 2026
Y = str(YEAR)

REGION = {
    "MERTON": "LONDON",
    "KINGSTON_UPON_THAMES": "LONDON",
    "NEWHAM": "LONDON",
    "WESTMINSTER": "LONDON",
    "OXFORD": "SOUTH_EAST",
}

# name: (household kind in nlw_freeze.situation, region, council)
CHART_HOUSEHOLDS = {
    "single": ("single", "NORTH_WEST", None),
    "lone_parent": ("lone_parent", "NORTH_WEST", None),
    "single_social_rent": ("single_social_rent", "NORTH_WEST", None),
    "single_kingston_upon_thames": (
        "single_social_rent",
        REGION["KINGSTON_UPON_THAMES"],
        "KINGSTON_UPON_THAMES",
    ),
}
COUNCIL_HOUSEHOLDS = {
    name: (kind, REGION[council], council)
    for council in BAND_D
    for prefix, kind in (("single", "single_social_rent"), ("lone_parent", "lone_parent"))
    if (name := f"{prefix}_{council.lower()}") not in CHART_HOUSEHOLDS
}
FIRST_HOUR, LAST_HOUR = 15, 40
SCENARIOS = scenarios(YEAR, S57_PA)
CHART_SCENARIO = "ni_tracks_allowance"


def half_hours() -> list:
    return [h / 2 for h in range(2 * FIRST_HOUR, 2 * LAST_HOUR + 1)]


def dense_hours() -> list:
    return [h / 100 for h in range(100 * FIRST_HOUR, 100 * LAST_HOUR + 1)]


def build(rows: list) -> dict:
    """rows: (household name, hours). Council rows take their council and bill."""
    named = {**CHART_HOUSEHOLDS, **COUNCIL_HOUSEHOLDS}
    sit = situation(YEAR, [(named[name][0], hours, named[name][1]) for name, hours in rows])
    for i, (name, _) in enumerate(rows):
        council = named[name][2]
        if council:
            sit["households"][f"hh{i}"]["local_authority"] = {Y: council}
            sit["households"][f"hh{i}"]["council_tax"] = {Y: council_bill(council)}
    return sit


def run(sit: dict, reform: dict | None) -> dict:
    sim = Simulation(situation=sit, reform=reform) if reform else Simulation(situation=sit)
    read = lambda v: sim.calculate(v, Y, map_to="household")
    return {
        "income_tax": read("income_tax"),
        "ni": read("national_insurance"),
        "uc": read("universal_credit"),
        "ctr": read("council_tax_benefit"),
        "net": read("household_net_income"),
    }


def compare(base: dict, res: dict, i: int) -> dict:
    tax = float(base["income_tax"][i] - res["income_tax"][i])
    ni = float(base["ni"][i] - res["ni"][i])
    uc = float(base["uc"][i] - res["uc"][i])
    ctr = float(base["ctr"][i] - res["ctr"][i])
    net = float(base["net"][i] - res["net"][i])
    # No other benefit or tax moves in these households.
    assert abs(net - (uc + ctr - tax - ni)) < 1, (i, net, uc, ctr, tax, ni)
    return {
        "extra_income_tax": round(tax, 2),
        "extra_ni": round(ni, 2),
        "extra_tax_and_ni": round(tax + ni, 2),
        "uc_frozen": round(float(base["uc"][i]), 2),
        "uc_raised": round(float(res["uc"][i]), 2),
        "ctr_frozen": round(float(base["ctr"][i]), 2),
        "ctr_raised": round(float(res["ctr"][i]), 2),
        "extra_uc": round(uc, 2),
        "extra_ctr": round(ctr, 2),
        "net_income_change": round(net, 2),
    }


def kinks_from_dense() -> tuple[dict, dict]:
    """The hours at which UC or CTR runs out, on either side, on a grid of 0.01
    hours, and each chart household's dense net income change."""
    allowance, threshold = SCENARIOS[CHART_SCENARIO]
    reform = reform_for(YEAR, allowance, threshold)
    rows = [(name, h) for name in CHART_HOUSEHOLDS for h in dense_hours()]
    sit = build(rows)
    base, res = run(sit, None), run(sit, reform)
    found, dense = {}, {name: {} for name in CHART_HOUSEHOLDS}
    previous = {}
    for i, (name, hours) in enumerate(rows):
        dense[name][hours] = float(base["net"][i] - res["net"][i])
        for label, values in (
            ("uc_frozen", base["uc"]),
            ("uc_raised", res["uc"]),
            ("ctr_frozen", base["ctr"]),
            ("ctr_raised", res["ctr"]),
        ):
            key = (name, label)
            if previous.get(key, 0) > 0 and float(values[i]) == 0:
                found.setdefault(name, {})[label] = hours
            previous[key] = float(values[i])
    return found, dense


def chart_error(hours: list, values: dict, dense: dict) -> float:
    """The largest gap between the chart's straight segments and the model."""
    worst = 0.0
    points = sorted(values.items())
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        for x, y in dense.items():
            if x0 <= x <= x1:
                line = y0 + (y1 - y0) * (x - x0) / (x1 - x0) if x1 > x0 else y0
                worst = max(worst, abs(line - y))
    return worst


def floor_case(profit: int, self_employed: bool) -> dict:
    """A lone parent with children aged 7 and 10, in £110 a week of social rent.
    UC's minimum income floor applies to them when self-employed, since their
    youngest child's age puts them under all work-related requirements."""
    income = "self_employment_income" if self_employed else "employment_income"
    members = ["adult", "child_7", "child_10"]
    return {
        "people": {
            "adult": {"age": {Y: 35}, income: {Y: profit}},
            "child_7": {"age": {Y: 7}},
            "child_10": {"age": {Y: 10}},
        },
        "benunits": {"family": {"members": members, "would_claim_uc": {Y: True}}},
        "households": {
            "home": {
                "members": members,
                "region": {Y: "NORTH_WEST"},
                "rent": {Y: 5_720},
                "tenure_type": {Y: "RENT_FROM_COUNCIL"},
            }
        },
    }


def floor_rows() -> list:
    """Net income on UC's minimum income floor, against the same income as pay."""
    allowance, threshold = SCENARIOS[CHART_SCENARIO]
    reform = reform_for(YEAR, allowance, threshold)
    rows = []
    for self_employed in (True, False):
        for amount in (3_000, 8_000, 12_000, 14_000, 16_000, 20_000, 24_000):
            sit = floor_case(amount, self_employed)
            sims = Simulation(situation=sit), Simulation(situation=sit, reform=reform)
            base, res = ({v: float(sim.calculate(v, Y, map_to="household")[0]) for v in (
                "income_tax", "national_insurance", "universal_credit", "household_net_income"
            )} for sim in sims)
            floor = [float(sim.calculate("uc_minimum_income_floor", Y)[0]) for sim in sims]
            applies = bool(sims[0].calculate("uc_mif_applies", Y)[0])
            rows.append(
                {
                    "self_employed": self_employed,
                    "income": amount,
                    "floor_applies": applies,
                    "floor_frozen": round(floor[0], 2),
                    "floor_raised": round(floor[1], 2),
                    "extra_tax_and_ni": round(
                        base["income_tax"] + base["national_insurance"]
                        - res["income_tax"] - res["national_insurance"], 2
                    ),
                    "uc_frozen": round(base["universal_credit"], 2),
                    "uc_raised": round(res["universal_credit"], 2),
                    "net_income_change": round(base["household_net_income"] - res["household_net_income"], 2),
                }
            )
    return rows


def higher_earner_rows() -> list:
    """Single employees above the frozen higher rate threshold. On the post's paths
    the basic rate band stays at £37,700, so a higher allowance lifts the higher
    rate threshold with it. The allowance tapers away above £100,000."""
    allowance, threshold = SCENARIOS[CHART_SCENARIO]
    reform = reform_for(YEAR, allowance, threshold)
    amounts = (45_000, 50_270, 55_000, 60_000, 100_000, 110_000, 125_140, 132_160, 150_000)
    people = {f"w{i}": {"age": {Y: 40}, "employment_income": {Y: float(pay)}} for i, pay in enumerate(amounts)}
    sit = {
        "people": people,
        "benunits": {f"b{i}": {"members": [f"w{i}"]} for i in range(len(amounts))},
        "households": {
            f"h{i}": {"members": [f"w{i}"], "region": {Y: "NORTH_WEST"}} for i in range(len(amounts))
        },
    }
    sims = Simulation(situation=sit), Simulation(situation=sit, reform=reform)
    tax = [sim.calculate("income_tax", Y) for sim in sims]
    ni = [sim.calculate("national_insurance", Y) for sim in sims]
    allowances = [sim.calculate("personal_allowance", Y) for sim in sims]
    return [
        {
            "pay": pay,
            "allowance_frozen": round(float(allowances[0][i]), 2),
            "allowance_raised": round(float(allowances[1][i]), 2),
            "extra_income_tax": round(float(tax[0][i] - tax[1][i]), 2),
            "extra_ni": round(float(ni[0][i] - ni[1][i]), 2),
        }
        for i, pay in enumerate(amounts)
    ]


def main():
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    kinks, dense = kinks_from_dense()
    chart_hours = sorted(
        {*half_hours(), *CHART_KINKS, *(h for found in kinks.values() for h in found.values())}
    )
    rows = [(name, h) for name in CHART_HOUSEHOLDS for h in chart_hours]
    rows += [(name, h) for name in COUNCIL_HOUSEHOLDS for h in half_hours()]
    sit = build(rows)
    base = run(sit, None)
    out = []
    errors = {}
    for scenario, (allowance, threshold) in SCENARIOS.items():
        res = run(sit, reform_for(YEAR, allowance, threshold))
        for i, (name, hours) in enumerate(rows):
            if scenario != CHART_SCENARIO and name in COUNCIL_HOUSEHOLDS:
                continue
            out.append(
                dict(
                    year=f"{YEAR}-{(YEAR + 1) % 100}",
                    household=name,
                    hours=hours,
                    earnings=round(NLW[YEAR] * hours * 52, 2),
                    scenario=scenario,
                    **compare(base, res, i),
                )
            )
    for name in CHART_HOUSEHOLDS:
        values = {
            float(r["hours"]): float(r["net_income_change"])
            for r in out
            if r["household"] == name and r["scenario"] == CHART_SCENARIO
        }
        errors[name] = round(chart_error(chart_hours, values, dense[name]), 2)
    with open(out_dir / "hours.csv", "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(out[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(out)
    meta = {
        "policyengine_uk": importlib.metadata.version("policyengine-uk"),
        "policyengine_core": importlib.metadata.version("policyengine-core"),
        "council_bills": {council: council_bill(council) for council in BAND_D},
        "benefit_runs_out_at_hours": kinks,
        "chart_hours": chart_hours,
        "largest_gap_between_chart_and_model_on_a_grid_of_0_01_hours": errors,
        "minimum_income_floor": floor_rows(),
        "higher_earners": higher_earner_rows(),
    }
    (out_dir / "hours_meta.json").write_text(json.dumps(meta, indent=1) + "\n")
    print(json.dumps({k: meta[k] for k in meta if k != "chart_hours"}, indent=1))


if __name__ == "__main__":
    main()
