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
ADMIN_COUNTS = HERE / "admin_by_state.csv"

# Programs whose recipients and totals the page shows, with the model
# variable and the unit counted: a person, an SPM unit (the family or
# household that shares food and housing), or a tax unit. Recipients are
# counted in that unit, so the counts compare with the agencies' counts
# of participants, households or returns. Two units are narrower:
# "child" counts children aged 5 to 17 in a family that gets free or
# reduced-price school meals (the agency counts lunches a day), and
# "marketplace_person" counts people with marketplace coverage in a tax
# unit that gets the credit (the agency counts enrollees with APTC).
PROGRAMS = {
    "snap": ("snap", "spm_unit"),
    "tanf": ("tanf", "spm_unit"),
    "school_meals": ("free_school_meals", "child"),
    "medicaid": ("medicaid", "person"),
    "ssi": ("ssi", "person"),
    "wic": ("wic", "person"),
    "social_security": ("social_security", "person"),
    "aca_ptc": ("aca_ptc", "marketplace_person"),
    "eitc": ("eitc", "tax_unit"),
    # `ctc` is the credit a tax unit could claim before the tax limit;
    # `ctc_value` is the credit it receives.
    "ctc": ("ctc_value", "tax_unit"),
    "state_credits": ("state_refundable_credits", "tax_unit"),
}

# The agency count shown beside each program's model count, in the same
# unit: the CSV measure, and the period to take when the file has several.
ADMIN_MEASURES = {
    "snap": ("snap_qc_households", None),
    "tanf": ("tanf_avg_monthly_families", None),
    # Free and reduced-price lunches a day; national only.
    "school_meals": ("nslp_free_reduced_avg_daily_participation", None),
    "medicaid": ("medicaid_enrollment_excl_chip", None),
    "ssi": ("ssi_recipients", None),
    "wic": ("wic_avg_monthly_participation", "FY2025"),
    "social_security": ("oasdi_beneficiaries", None),
    "aca_ptc": ("aca_oep_plan_selections_with_aptc", None),
    "eitc": ("eitc_returns", None),
    "ctc": ("ctc_odc_nonrefundable_returns", None),
}

# Agency counts that miss some recipients, so the page says "at least":
# IRS counts returns with the nonrefundable CTC or ODC, which leaves out
# returns that claim only the refundable part.
ADMIN_LOWER_BOUNDS = {"ctc"}

# Figures that need many households; districts leave them out.
NATION_AND_STATE_ONLY = {"deciles", "state_tax_by_quintile", "poverty_by_group"}

# Figures a district's few thousand sample households cannot support: a
# handful of very high incomes decides them (Gini above 1 where incomes
# are negative, top 1% shares over 60%, average state tax rates above the
# top rate). The page shows them for the nation and states only.
NOT_FOR_DISTRICTS = ("gini", "top_10_share", "top_1_share", "state_income_tax_rate") + tuple(
    # District benefit figures do not yet match survey estimates (microcosm#1673).
    f"{prefix}_{key}"
    for key in PROGRAMS
    for prefix in ("receipt", "recipients", "total")
) + ("eitc_per_recipient", "ctc_per_recipient", "state_credits_per_recipient")

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


def rate(flags, weights) -> float:
    """Weighted share of true flags. A missing flag (a person outside the
    SPM measurement) counts in neither the numerator nor the denominator,
    as in policyengine.py's `outputs/poverty.py`."""
    flags = pd.to_numeric(pd.Series(np.asarray(flags)), errors="coerce").to_numpy(dtype=float)
    weights = np.asarray(weights, dtype=float)
    measured = ~np.isnan(flags)
    total = weights[measured].sum()
    return float(np.sum(weights[measured] * flags[measured]) / total) if total else float("nan")


def managed_simulation(dataset: Path, legacy_local: bool):
    """A Microsimulation built as policyengine.py builds it for a report.

    `managed_microsimulation` applies the bundle's SPM settings and maps
    stored inputs that policyengine-us has renamed (WIC take-up,
    policyengine.py#531). The local-area build is a registered legacy SPM
    source: Census's ACS rule leaves group-quarters residents outside the
    poverty measurement, and policyengine.py derives that scope when it
    loads the file. A per-state file has its own hash, so this applies the
    registered derivation itself.
    """
    from policyengine.tax_benefit_models.us.legacy_spm import (
        derive_from_stored_tables,
        prepare_microsimulation,
        set_declarations,
    )
    from policyengine.tax_benefit_models.us.legacy_spm.registry import (
        MICROCOSM_US_2024_ACS_LOCAL_MICROCOSM_1263,
    )
    from policyengine.tax_benefit_models.us.model import managed_microsimulation

    sim = managed_microsimulation(dataset=str(dataset), allow_unmanaged=True)
    # The national file stores WIC take-up under its old name, which this
    # maps; the local-area build already stores the live name.
    renames = sim.policyengine_bundle.get("legacy_input_renames", {})
    print(f"{dataset.name}: legacy input renames {renames or 'none'}", flush=True)
    if legacy_local:
        declarations, years = derive_from_stored_tables(
            MICROCOSM_US_2024_ACS_LOCAL_MICROCOSM_1263, sim.dataset, data_dir=dataset.parent
        )
        prepare_microsimulation(sim)
        set_declarations(sim, declarations, years)
    return sim


def load_frames(dataset: Path, year: int, legacy_local: bool = False) -> dict[str, pd.DataFrame]:
    """One model run: the person, household, SPM-unit and tax-unit columns the figures need."""
    sim = managed_simulation(dataset, legacy_local)

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
    for key, (variable, unit) in PROGRAMS.items():
        if unit == "person":
            person[f"gets_{key}"] = calc(variable, "person") > 0
    age = person["age"].to_numpy()
    person["school_age"] = (age >= 5) & (age <= 17)
    meals = (calc("free_school_meals", "person") > 0) | (calc("reduced_price_school_meals", "person") > 0)
    person["gets_school_meals"] = meals & person["school_age"].to_numpy()
    person["gets_aca_ptc"] = (calc("aca_ptc", "person") > 0) & calc(
        "has_marketplace_health_coverage", "person"
    ).astype(bool)

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
    for key, (variable, _) in PROGRAMS.items():
        household[f"total_{key}"] = calc(variable, "household")

    spm_unit = pd.DataFrame(
        {
            "weight": calc("spm_unit_weight", "spm_unit"),
            "household_id": calc("household_id", "spm_unit"),
        }
    )

    tax_unit = pd.DataFrame(
        {
            "weight": calc("tax_unit_weight", "tax_unit"),
            "household_id": calc("household_id", "tax_unit"),
        }
    )
    for key, (variable, unit) in PROGRAMS.items():
        if unit == "spm_unit":
            spm_unit[f"gets_{key}"] = calc(variable, "spm_unit") > 0
        elif unit == "tax_unit":
            tax_unit[key] = calc(variable, "tax_unit")

    geography = household[["household_id", "state_fips", "district_geoid"]]
    person = person.merge(geography, on="household_id", how="left")
    tax_unit = tax_unit.merge(geography, on="household_id", how="left")
    spm_unit = spm_unit.merge(geography, on="household_id", how="left")
    return {"person": person, "household": household, "tax_unit": tax_unit, "spm_unit": spm_unit}


def _optional(sim, variable: str, year: int) -> np.ndarray:
    try:
        return np.asarray(sim.calculate(variable, year, map_to="household").values)
    except Exception:  # The national file may carry no district.
        return np.full(len(sim.calculate("household_id", year, map_to="household")), -1)


def figures(frames: dict[str, pd.DataFrame], with_breakdowns: bool) -> dict:
    p, h, t, s = frames["person"], frames["household"], frames["tax_unit"], frames["spm_unit"]
    pw, hw, tw = p["weight"].to_numpy(), h["weight"].to_numpy(), t["weight"].to_numpy()
    sw = s["weight"].to_numpy()
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
        "spm_units": float(sw.sum()),
        "tax_units": float(tw.sum()),
    }
    # Recipients in the program's own unit, and their share of all such units.
    for key, (_, unit) in PROGRAMS.items():
        if unit in ("person", "marketplace_person"):
            gets, weights = p[f"gets_{key}"].to_numpy(), pw
        elif unit == "child":
            school_age = p["school_age"].to_numpy()
            gets, weights = p[f"gets_{key}"].to_numpy()[school_age], pw[school_age]
        elif unit == "spm_unit":
            gets, weights = s[f"gets_{key}"].to_numpy(), sw
        else:
            gets, weights = t[key].to_numpy() > 0, tw
        metrics[f"recipients_{key}"] = float(np.sum(weights * gets))
        metrics[f"receipt_{key}"] = rate(gets, weights)
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


ENTITIES = ("household", "person", "tax_unit", "spm_unit", "family", "marital_unit")
CACHE = Path.home() / ".cache" / "policyengine-explore"


def split_states(local: Path, build: str) -> dict[int, Path]:
    """One small dataset per state, cut from the local-area file once and cached.

    Each holds the state's households, their people, and the tax units,
    SPM units, families and marital units those people belong to, in the
    same entity-table layout as the source file.
    """
    out_dir = CACHE / build
    done = out_dir / "COMPLETE"
    if done.exists():
        return {int(p.stem.split("_")[1]): p for p in sorted(out_dir.glob("state_*.h5"))}
    out_dir.mkdir(parents=True, exist_ok=True)
    started = time.time()
    with pd.HDFStore(local, "r") as store:
        tables = {name: store.select(f"/{name}") for name in ENTITIES}
        time_period = store.select("/_time_period")
    print(f"read the local-area file in {time.time() - started:.0f}s", flush=True)
    people = tables["person"]
    paths = {}
    for fips, households in tables["household"].groupby("state_fips"):
        members = people[people["person_household_id"].isin(households["household_id"])]
        parts = {"household": households, "person": members}
        for entity in ENTITIES[2:]:
            table = tables[entity]
            parts[entity] = table[table[f"{entity}_id"].isin(members[f"person_{entity}_id"])]
        path = out_dir / f"state_{int(fips):02d}.h5"
        with pd.HDFStore(path, "w") as out:
            for name, table in parts.items():
                out.put(name, table.reset_index(drop=True), format="table")
            out.put("_time_period", time_period, format="table")
        paths[int(fips)] = path
    done.write_text("ok")
    print(f"split into {len(paths)} state files in {time.time() - started:.0f}s", flush=True)
    return paths


def run_nation(dataset: Path, year: int) -> dict[str, dict]:
    frames = load_frames(dataset, year, legacy_local=False)
    return {"us": {"label": "United States", **figures(frames, with_breakdowns=True)}}


def run_state(
    dataset: Path, year: int, state: tuple[str, str], districts: list[tuple[int, str]]
) -> dict[str, dict]:
    """One state's figures and those of each of its congressional districts."""
    code, name = state
    frames = load_frames(dataset, year, legacy_local=True)
    regions = {
        code: {
            "label": name,
            "sample_households": len(frames["household"]),
            **figures(frames, with_breakdowns=True),
        }
    }
    for geoid, district in districts:
        part = subset(frames, "district_geoid", geoid)
        sample = len(part["household"])
        if sample < MIN_SAMPLE_HOUSEHOLDS:
            print(f"{district}: {sample} households, left out", flush=True)
            continue
        result = figures(part, with_breakdowns=False)
        for key in NOT_FOR_DISTRICTS:
            result["metrics"].pop(key, None)
        regions[district] = {
            "label": district.split("/", 1)[1],
            "sample_households": sample,
            **result,
        }
    return regions


def admin_counts() -> dict[str, dict]:
    """Agency counts by region code ("us", "state/ca"), keyed by receipt measure."""
    if not ADMIN_COUNTS.exists():
        return {}
    table = pd.read_csv(ADMIN_COUNTS)
    out: dict[str, dict] = {}
    for key, (measure, period) in ADMIN_MEASURES.items():
        rows = table[table["measure"] == measure]
        if not (rows["geography"] == "US").any():
            # Some state tables have no US row; the national summary has it, in thousands.
            national = table[table["measure"] == f"{measure}_national"].copy()
            thousands = national["unit"].str.startswith("thousand ")
            national.loc[thousands, "value"] *= 1000
            national.loc[thousands, "unit"] = national.loc[thousands, "unit"].str.removeprefix("thousand ")
            rows = pd.concat([rows, national])
        if period:
            rows = rows[rows["period"].str.startswith(period)]
        for _, row in rows.iterrows():
            code = "us" if row["geography"] == "US" else f"state/{row['geography'].lower()}"
            out.setdefault(code, {})[f"receipt_{key}"] = {
                **({"qualifier": "at least"} if key in ADMIN_LOWER_BOUNDS else {}),
                "value": float(row["value"]),
                "unit": row["unit"],
                "period": row["period"],
                "source": row["source"],
                "url": row["url"],
            }
    return out


def _limit_threads() -> None:
    import os

    for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        os.environ[name] = "1"


def main() -> None:
    from concurrent.futures import ProcessPoolExecutor, as_completed
    import multiprocessing

    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--nation-only", action="store_true")
    parser.add_argument("--states", help="Comma-separated state codes to run (for a test).")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--out", type=Path, help="Write here instead of the app's data folder.")
    args = parser.parse_args()

    from policyengine.countries.us.regions import build_us_region_registry

    paths = fetch(["populace_us_2024"] if args.nation_only else None)
    pins = json.loads((HERE / "datasets.json").read_text())
    benchmarks = json.loads(BENCHMARKS.read_text()) if BENCHMARKS.exists() else {}

    # The model's regions: states by FIPS code, and each state's districts.
    registry = build_us_region_registry()
    states: dict[int, tuple[str, str]] = {}
    districts: dict[int, list[tuple[int, str]]] = {}
    for region in registry.regions:
        strategy = region.scoping_strategy
        if region.region_type == "state":
            states[int(strategy.variable_value)] = (region.code, region.state_name)
        elif region.region_type == "congressional_district":
            geoid = int(strategy.variable_value)
            districts.setdefault(geoid // 100, []).append((geoid, region.code))
    if args.states:
        wanted = {code.strip().lower() for code in args.states.split(",")}
        states = {f: s for f, s in states.items() if s[0].split("/")[1] in wanted}

    started = time.time()
    jobs = [("nation", run_nation, (paths["populace_us_2024"], args.year))]
    if not args.nation_only:
        build = pins["populace_us_2024_acs_local"]["path"].split("/")[-2]
        state_files = split_states(paths["populace_us_2024_acs_local"], build)
        # Largest files first, so the big states do not finish last.
        order = sorted(states, key=lambda f: -state_files[f].stat().st_size)
        jobs += [
            (states[f][0], run_state, (state_files[f], args.year, states[f], districts.get(f, [])))
            for f in order
        ]

    regions: dict[str, dict] = {}
    context = multiprocessing.get_context("spawn")
    with ProcessPoolExecutor(args.workers, mp_context=context, initializer=_limit_threads) as pool:
        futures = {pool.submit(fn, *fn_args): (name, time.time()) for name, fn, fn_args in jobs}
        for done, future in enumerate(as_completed(futures), start=1):
            name, _ = futures[future]
            regions.update(future.result())
            print(
                f"[{done}/{len(jobs)}] {name} done, {time.time() - started:.0f}s since start",
                flush=True,
            )

    admin = admin_counts()
    for code, region in regions.items():
        if code in benchmarks:
            region["benchmarks"] = benchmarks[code]
        if code in admin:
            region["admin_counts"] = admin[code]

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
