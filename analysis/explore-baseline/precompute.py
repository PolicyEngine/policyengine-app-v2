"""Current-law baseline figures for the v3 Explore page.

Writes app/public/data/baseline/us/<year>.json: the nation from the
national dataset, and every state and congressional district from the
local-area dataset (households filtered by state and by district, as the
simulation API's RowFilterStrategy does). One run of the model per
dataset; the figures are weighted sums, shares and quantiles over it.

Usage (from the repository root):
    analysis/explore-baseline/.venv/bin/python analysis/explore-baseline/precompute.py \
        --year 2026 [--nation-only]

Definitions follow policyengine.py 6.20.2's outputs:
- poverty: spm_unit_is_in_spm_poverty mapped to people, person weights
  (outputs/poverty.py); deep poverty: spm_unit_is_in_deep_spm_poverty.
- inequality: household_net_income, household weights, no equivalisation
  (outputs/inequality.py, the "standard" US preset).
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import date
from importlib.metadata import version
from pathlib import Path

import numpy as np
import pandas as pd

from fetch_data import fetch

HERE = Path(__file__).parent
OUT_DIR = HERE.parents[1] / "app" / "public" / "data" / "baseline" / "us"
BENCHMARKS = HERE / "census_spm_benchmarks.json"

# Programs whose receipt (share of people in a receiving unit) and totals the page shows.
PROGRAMS = {
    "snap": "snap",
    "medicaid": "medicaid",
    "ssi": "ssi",
    "tanf": "tanf",
    "wic": "wic",
    "school_meals": "free_school_meals",
    "aca_ptc": "aca_ptc",
    "eitc": "eitc",
    "ctc": "ctc",
    "state_credits": "state_refundable_credits",
    "social_security": "social_security",
}

# Figures that need many households; districts leave them out.
NATION_AND_STATE_ONLY = {"deciles", "state_tax_by_quintile", "poverty_by_group"}

# Fewer sample households than this and a region's figures are left out.
MIN_SAMPLE_HOUSEHOLDS = 100


def weighted_quantile(values: np.ndarray, weights: np.ndarray, q: float) -> float:
    order = np.argsort(values)
    v, w = values[order], weights[order]
    cumulative = np.cumsum(w)
    if cumulative[-1] <= 0:
        return float("nan")
    return float(v[np.searchsorted(cumulative, q * cumulative[-1])])


def gini(values: np.ndarray, weights: np.ndarray) -> float:
    """policyengine.py's weighted Gini (outputs/inequality.py `_gini`)."""
    order = np.argsort(values)
    v, w = values[order], weights[order]
    cw = np.cumsum(w)
    cv = np.cumsum(v * w)
    if cw[-1] == 0 or cv[-1] == 0:
        return float("nan")
    lorenz = cv / cv[-1]
    fractions = w / cw[-1]
    return float(1 - 2 * np.sum(fractions * (lorenz - fractions / 2)))


def top_share(values: np.ndarray, weights: np.ndarray, top: float) -> float:
    order = np.argsort(values)
    v, w = values[order], weights[order]
    cw = np.cumsum(w) / w.sum()
    total = np.sum(v * w)
    return float(np.sum((v * w)[cw > 1 - top]) / total) if total else float("nan")


def rate(flags: np.ndarray, weights: np.ndarray) -> float:
    total = weights.sum()
    return float(np.sum(weights * flags) / total) if total else float("nan")


def load_frames(dataset: Path, year: int) -> dict[str, pd.DataFrame]:
    """One model run: the person, household and tax-unit columns the figures need."""
    from policyengine_us import Microsimulation

    sim = Microsimulation(dataset=str(dataset))

    def calc(variable: str, map_to: str) -> np.ndarray:
        series = sim.calculate(variable, year, map_to=map_to)
        return np.asarray(series.values if hasattr(series, "values") else series)

    person = pd.DataFrame(
        {
            "weight": calc("person_weight", "person"),
            "household_id": calc("household_id", "person"),
            "age": calc("age", "person"),
            "is_male": calc("is_male", "person"),
            "poor": calc("spm_unit_is_in_spm_poverty", "person"),
            "deep": calc("spm_unit_is_in_deep_spm_poverty", "person"),
        }
    )
    for key, variable in PROGRAMS.items():
        person[f"gets_{key}"] = calc(variable, "person") > 0

    household = pd.DataFrame(
        {
            "household_id": calc("household_id", "household"),
            "weight": calc("household_weight", "household"),
            "state_fips": calc("state_fips", "household"),
            "district_geoid": _optional(sim, "congressional_district_geoid", year),
            "net_income": calc("household_net_income", "household"),
            "market_income": calc("household_market_income", "household"),
            "benefits": calc("household_benefits", "household"),
            "federal_income_tax": calc("income_tax", "household"),
            "state_income_tax": calc("state_income_tax", "household"),
            "payroll_tax": calc("employee_payroll_tax", "household"),
        }
    )
    for key, variable in PROGRAMS.items():
        household[f"total_{key}"] = calc(variable, "household")

    tax_unit = pd.DataFrame(
        {
            "weight": calc("tax_unit_weight", "tax_unit"),
            "household_id": calc("household_id", "tax_unit"),
            "eitc": calc("eitc", "tax_unit"),
            "ctc": calc("ctc", "tax_unit"),
            "state_credits": calc("state_refundable_credits", "tax_unit"),
        }
    )

    geography = household[["household_id", "state_fips", "district_geoid"]]
    person = person.merge(geography, on="household_id", how="left")
    tax_unit = tax_unit.merge(geography, on="household_id", how="left")
    return {"person": person, "household": household, "tax_unit": tax_unit}


def _optional(sim, variable: str, year: int) -> np.ndarray:
    try:
        return np.asarray(sim.calculate(variable, year, map_to="household").values)
    except Exception:  # The national file may carry no district.
        return np.full(len(sim.calculate("household_id", year, map_to="household")), -1)


def figures(frames: dict[str, pd.DataFrame], with_breakdowns: bool) -> dict:
    p, h, t = frames["person"], frames["household"], frames["tax_unit"]
    pw, hw, tw = p["weight"].to_numpy(), h["weight"].to_numpy(), t["weight"].to_numpy()
    child = p["age"].to_numpy() < 18
    senior = p["age"].to_numpy() >= 65
    net = h["net_income"].to_numpy()
    market = h["market_income"].to_numpy()

    metrics = {
        "poverty": rate(p["poor"], pw),
        "child_poverty": rate(p["poor"][child], pw[child]),
        "senior_poverty": rate(p["poor"][senior], pw[senior]),
        "deep_poverty": rate(p["deep"], pw),
        "median_household_net_income": weighted_quantile(net, hw, 0.5),
        "median_household_market_income": weighted_quantile(market, hw, 0.5),
        "gini": gini(net, hw),
        "top_10_share": top_share(net, hw, 0.10),
        "top_1_share": top_share(net, hw, 0.01),
        "state_income_tax_rate": float(
            np.sum(h["state_income_tax"] * hw) / max(np.sum(np.clip(market, 0, None) * hw), 1)
        ),
        "households": float(hw.sum()),
        "people": float(pw.sum()),
    }
    for key in PROGRAMS:
        metrics[f"receipt_{key}"] = rate(p[f"gets_{key}"], pw)
        metrics[f"total_{key}"] = float(np.sum(h[f"total_{key}"] * hw))
    for key in ("eitc", "ctc", "state_credits"):
        gets = t[key].to_numpy() > 0
        metrics[f"{key}_per_recipient"] = (
            float(np.sum(t[key][gets] * tw[gets]) / tw[gets].sum()) if gets.any() else 0.0
        )

    result: dict = {"metrics": metrics}
    if not with_breakdowns:
        return result

    # Household net income deciles within the region.
    edges = [weighted_quantile(net, hw, q / 10) for q in range(1, 10)]
    decile = np.searchsorted(edges, net, side="right")
    columns = ["market_income", "federal_income_tax", "payroll_tax", "state_income_tax", "benefits", "net_income"]
    result["deciles"] = [
        {c: float(np.average(h[c][decile == d], weights=hw[decile == d])) for c in columns}
        for d in range(10)
    ]
    quintile = decile // 2
    result["state_tax_by_quintile"] = [
        float(
            np.sum(h["state_income_tax"][quintile == q] * hw[quintile == q])
            / max(np.sum(np.clip(market[quintile == q], 0, None) * hw[quintile == q]), 1)
        )
        for q in range(5)
    ]
    adult = ~child & ~senior
    male = p["is_male"].to_numpy().astype(bool)
    result["poverty_by_group"] = {
        "children": metrics["child_poverty"],
        "working_age": rate(p["poor"][adult], pw[adult]),
        "seniors": metrics["senior_poverty"],
        "men": rate(p["poor"][male & ~child], pw[male & ~child]),
        "women": rate(p["poor"][~male & ~child], pw[~male & ~child]),
    }
    return result


def subset(frames: dict[str, pd.DataFrame], column: str, value: int) -> dict[str, pd.DataFrame]:
    return {name: frame[frame[column] == value] for name, frame in frames.items()}


def round_floats(value, digits: int = 4):
    if isinstance(value, float):
        return None if np.isnan(value) else round(value, digits if abs(value) < 100 else 0)
    if isinstance(value, dict):
        return {k: round_floats(v, digits) for k, v in value.items()}
    if isinstance(value, list):
        return [round_floats(v, digits) for v in value]
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--nation-only", action="store_true")
    parser.add_argument("--out", type=Path, help="Write here instead of the app's data folder.")
    args = parser.parse_args()

    from policyengine.countries.us.regions import build_us_region_registry

    paths = fetch(["populace_us_2024"] if args.nation_only else None)
    pins = json.loads((HERE / "datasets.json").read_text())
    benchmarks = json.loads(BENCHMARKS.read_text()) if BENCHMARKS.exists() else {}
    registry = build_us_region_registry()
    regions: dict[str, dict] = {}

    started = time.time()
    national = load_frames(paths["populace_us_2024"], args.year)
    regions["us"] = {"label": "United States", **figures(national, with_breakdowns=True)}
    print(f"nation done in {time.time() - started:.0f}s", flush=True)

    if not args.nation_only:
        started = time.time()
        local = load_frames(paths["populace_us_2024_acs_local"], args.year)
        print(f"local-area run done in {time.time() - started:.0f}s", flush=True)
        for region in registry.regions:
            if region.region_type not in ("state", "congressional_district"):
                continue
            strategy = region.scoping_strategy
            column = "state_fips" if strategy.variable_name == "state_fips" else "district_geoid"
            part = subset(local, column, int(strategy.variable_value))
            sample = len(part["household"])
            if sample < MIN_SAMPLE_HOUSEHOLDS:
                print(f"{region.code}: {sample} households, left out", flush=True)
                continue
            is_state = region.region_type == "state"
            label = region.state_name if is_state else region.code.split("/", 1)[1]
            regions[region.code] = {
                "label": label,
                "sample_households": sample,
                **figures(part, with_breakdowns=is_state),
            }

    for code, region in regions.items():
        if code in benchmarks:
            region["benchmarks"] = benchmarks[code]

    out = {
        "schema_version": 1,
        "country": "us",
        "year": args.year,
        "placeholder": False,
        "receipt": {
            "bundle": f"us-{version('policyengine')}",
            "model": f"policyengine-us {version('policyengine-us')}",
            "datasets": {key: pin["path"].split("/")[-2] for key, pin in pins.items()},
            "computed_at": date.today().isoformat(),
        },
        "regions": round_floats(regions),
    }
    target = args.out or OUT_DIR / f"{args.year}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {target} ({target.stat().st_size / 1e3:.0f} kB, {len(regions)} regions)")


if __name__ == "__main__":
    main()
