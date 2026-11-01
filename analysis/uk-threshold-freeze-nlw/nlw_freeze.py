"""Figures for the post on the threshold freeze and the National Living Wage.

Runs PolicyEngine UK household simulations, with no microdata:

    python nlw_freeze.py OUTPUT_DIR

Each scenario overrides the personal allowance and the Class 1 primary threshold
for one tax year. Year Y in the model means tax year Y to Y+1. Every household in
a scenario sits in one Simulation, so one baseline and one reform run cover every
worker in that scenario.
"""

import csv
import importlib.metadata
import json
import sys
from pathlib import Path

from policyengine_uk import Simulation

from thresholds import (
    ACTUAL_PA,
    ACTUAL_PT_WEEK,
    ALTERNATIVE_PA,
    CHART_KINKS,
    NLW,
    PT_2021_WEEK,
    PT_JUL22_WEEK,
    PT_P2P_WEEK,
    S57_PA,
    YEARS,
    hand,
    scenarios,
)


def reform_for(year: int, pa: float, pt_annual: float) -> dict:
    span = f"{year}-04-06.{year + 1}-04-05"
    return {
        "gov.hmrc.income_tax.allowances.personal_allowance.amount": {span: pa},
        "gov.hmrc.national_insurance.class_1.employee_scale[1].threshold": {
            span: pt_annual / 52
        },
    }


def workers(year: int) -> list:
    """One row per example worker: kind, weekly hours, region."""
    hours = [h / 2 for h in range(0, 97)]  # 0 to 48 hours, in half hours
    out = [("single", h, "NORTH_WEST") for h in sorted(hours + list(CHART_KINKS))]
    out += [("single", 35, "SCOTLAND")]
    out += [
        (k, 35, "NORTH_WEST")
        for k in (
            "single_auto_enrolment",
            "lone_parent",
            "lone_parent_council_tax",
            "couple_two_children",
            "single_social_rent",
        )
    ]
    return out


def situation(year: int, rows: list) -> dict:
    y = str(year)
    people, benunits, households = {}, {}, {}
    for i, (kind, hours, region) in enumerate(rows):
        earnings = round(NLW[year] * hours * 52, 2)
        worker = f"w{i}"
        people[worker] = {"age": {y: 30}, "employment_income": {y: earnings}}
        adults, children = [worker], []
        if kind == "couple_two_children":
            partner = f"p{i}"
            people[partner] = {"age": {y: 30}, "employment_income": {y: 0}}
            adults.append(partner)
        if kind in ("lone_parent", "lone_parent_council_tax", "couple_two_children"):
            for j, age in enumerate((4, 7)):
                people[f"c{i}_{j}"] = {"age": {y: age}}
                children.append(f"c{i}_{j}")
        members = adults + children
        if kind == "single_auto_enrolment":
            # Minimum auto-enrolment: 5% of qualifying earnings from £6,240.
            people[worker]["employee_pension_contributions"] = {y: 0.05 * (earnings - 6_240)}
        hh = {"members": members, "region": {y: region}}
        if kind not in ("single", "single_auto_enrolment"):
            hh["tenure_type"] = {y: "RENT_FROM_COUNCIL"}
            hh["rent"] = {y: 5_720}  # £110 a week social rent
        if kind == "lone_parent_council_tax":
            hh["council_tax"] = {y: 1_800}
        benunits[f"bu{i}"] = {"members": members}
        households[f"hh{i}"] = hh
    return {"people": people, "benunits": benunits, "households": households}


def run(sit: dict, year: int, reform: dict | None) -> dict:
    y = str(year)
    sim = Simulation(situation=sit, reform=reform) if reform else Simulation(situation=sit)
    hh = lambda v: sim.calculate(v, y, map_to="household")
    return {
        "income_tax": hh("income_tax"),
        "ni": hh("national_insurance"),
        "uc": hh("universal_credit"),
        "net": hh("household_net_income"),
        "ctr": hh("council_tax_benefit"),
    }


def ni_under_2021_rules(year: int) -> dict:
    """NI at 35 hours with 2021's 12% rate and the threshold uprated from 2021."""
    sit = situation(year, [("single", 35, "NORTH_WEST")])
    span = f"{year}-04-06.{year + 1}-04-05"
    scale = "gov.hmrc.national_insurance.class_1.employee_scale[1]"
    reform = {
        f"{scale}.threshold": {span: PT_2021_WEEK[year]},
        f"{scale}.rate": {span: 0.12},
    }
    actual = float(run(sit, year, None)["ni"][0])
    rules_2021 = float(run(sit, year, reform)["ni"][0])
    return {"actual": round(actual, 2), "rules_2021": round(rules_2021, 2)}


def main():
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    rows_out = []
    for year in YEARS:
        rows = workers(year)
        sit = situation(year, rows)
        base = run(sit, year, None)
        for path, pa in (("s57", S57_PA), ("alternative", ALTERNATIVE_PA)):
            for name, (a, pt) in scenarios(year, pa).items():
                res = run(sit, year, reform_for(year, a, pt))
                for i, (kind, hours, region) in enumerate(rows):
                    tax = float(base["income_tax"][i] - res["income_tax"][i])
                    ni = float(base["ni"][i] - res["ni"][i])
                    rows_out.append(dict(
                        year=f"{year}-{(year + 1) % 100}", household=kind, hours=hours,
                        region=region, earnings=round(NLW[year] * hours * 52, 2),
                        allowance_path=path, scenario=name, allowance=a,
                        primary_threshold=round(pt, 2),
                        income_tax_base=round(float(base["income_tax"][i]), 2),
                        ni_base=round(float(base["ni"][i]), 2),
                        uc_base=round(float(base["uc"][i]), 2),
                        net_base=round(float(base["net"][i]), 2),
                        freeze_income_tax=round(tax, 2), freeze_ni=round(ni, 2),
                        freeze_tax_and_ni=round(tax + ni, 2),
                        uc_if_indexed_minus_base=round(float(res["uc"][i] - base["uc"][i]), 2),
                        freeze_net_loss=round(float(res["net"][i] - base["net"][i]), 2),
                        ctr_base=round(float(base["ctr"][i]), 2),
                        ctr_if_indexed=round(float(res["ctr"][i]), 2),
                    ))
                    if kind == "single":
                        # Differential: model against plain arithmetic.
                        earnings = NLW[year] * hours * 52
                        t0, n0 = hand(earnings, ACTUAL_PA, ACTUAL_PT_WEEK * 52)
                        t1, n1 = hand(earnings, a, pt)
                        assert abs((t0 - t1) - tax) < 1.0, (year, hours, name, t0 - t1, tax)
                        assert abs((n0 - n1) - ni) < 1.0, (year, hours, name, n0 - n1, ni)
                        # Bound: the worker cannot lose more than 28% of the gap.
                        assert tax + ni <= 0.20 * (a - ACTUAL_PA) + 0.08 * max(0, pt - ACTUAL_PT_WEEK * 52) + 1
                    uc_after = float(res["uc"][i])
                    if kind in ("lone_parent", "lone_parent_council_tax", "couple_two_children") and uc_after > 0:
                        # Taper: UC moves by 55% of the tax and NI change.
                        assert abs(float(res["uc"][i] - base["uc"][i]) + 0.55 * (tax + ni)) < 1.0, (year, kind, name)
    with open(out_dir / "results.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows_out[0]), lineterminator="\n")
        w.writeheader()
        w.writerows(rows_out)
    meta = {
        "policyengine_uk": importlib.metadata.version("policyengine-uk"),
        "policyengine_core": importlib.metadata.version("policyengine-core"),
        "policyengine_uk_commit": "2da212abcf2086337fc088a4a1236f4ae7b6af63",
        "s57_allowance": S57_PA,
        "pt_2021_week": PT_2021_WEEK,
        "pt_jul22_week": PT_JUL22_WEEK,
        "pt_p2p_week": PT_P2P_WEEK,
        "ni_2021_rules": {year: ni_under_2021_rules(year) for year in YEARS},
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=1))


if __name__ == "__main__":
    main()
