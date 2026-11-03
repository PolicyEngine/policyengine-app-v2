"""Build the parameter → variable dependency map from a traced simulation.

The flagship validation layer needs to know which model variables a reform
touches, so it can look those variables up in the calibration dashboard and
the scorecard, and the report's household section uses the same map to
suggest the household inputs a reform reads. Grepping formula source for
parameter paths misses bracket, scale, and vectorised accesses; the only
exact record is what the model actually reads at run time. This script runs
a country model with policyengine-core's FullTracer, calculates every
variable, and writes two edge sets:

    readers[parameter_path]  -> variables whose formula read that parameter
    consumers[variable]      -> variables whose formula read that variable

The US map traces policyengine-us over a subsample of its default microdata.
The UK map traces policyengine-uk over a generated population of households
(see uk_situation): the UK microdata is not public, and the formula reads do
not depend on which households run, only on which formulas run, so a
population varied enough to reach every program's eligible cases serves.

Output (consumed by app/src/libs/flagship/parameterDependencies.ts):

    us: app/src/data/flagship/parameterDependencies.json
    uk: app/src/data/flagship/parameterDependencies.uk.json

Run from a Python environment with the country's package installed:

    python app/scripts/build-parameter-dependency-map.py [--country us|uk] [--households N] [--year YYYY]

Two core quirks are handled here rather than upstream:
  * core caches the yearly ParameterNodeAtInstant before its own tracing
    recast runs, so the cached node is untraced; we flag the parameter root
    for tracing and clear the at-instant caches before any calculation.
  * a formula can call a node below the root with its period
    (parameters.gov.usda.snap.emergency_allotment(period)), which core does
    not trace at all; we record the call as a read of that node, so a
    parameter under it maps to the formula through its nearest ancestor.
  * TracingParameterNodeAtInstant only records scalar/array leaves, so
    scale/bracket objects (p.base.calc(age), p.max[children]) are invisible;
    we record every non-node child access.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path

DATA_DIRECTORY = Path(__file__).resolve().parent.parent / "src" / "data" / "flagship"
OUTPUTS = {
    "us": DATA_DIRECTORY / "parameterDependencies.json",
    "uk": DATA_DIRECTORY / "parameterDependencies.uk.json",
}
PACKAGES = {"us": "policyengine-us", "uk": "policyengine-uk"}

# The simulation's tracer, once tracing is on (see patch_tracer).
TRACING: dict = {}

# Neutralisation switches mirror every variable 1:1 and carry no reform meaning.
IGNORED_PARAMETER_PREFIXES = ("gov.abolitions.",)


def patch_tracer() -> None:
    from policyengine_core import parameters as P
    from policyengine_core import tracers

    original = tracers.TracingParameterNodeAtInstant.get_traced_child

    def get_traced_child(self, child, key):
        is_node = isinstance(
            child, (P.ParameterNodeAtInstant, P.VectorialParameterNodeAtInstant)
        )
        is_leaf = isinstance(child, P.ALLOWED_PARAM_TYPES) or hasattr(child, "shape")
        if not is_node and not is_leaf:
            name = (
                self.parameter_node_at_instant._name
                if not isinstance(key, str)
                else ".".join([self.parameter_node_at_instant._name, key])
            )
            self.tracer.record_parameter_access(
                name, self.parameter_node_at_instant._instant_str, self.branch_name, None
            )
        return original(self, child, key)

    tracers.TracingParameterNodeAtInstant.get_traced_child = get_traced_child

    original_at_instant = P.ParameterNode._get_at_instant

    def _get_at_instant(self, instant):
        tracer = TRACING.get("tracer")
        # The root's own call is traced by core; any other node's is not.
        # A node builds its children at the instant too: only the outer
        # call is the formula's read.
        outer = not TRACING.get("building")
        if tracer is not None and outer and not self.trace and "." in (self.name or ""):
            tracer.record_parameter_access(self.name, str(instant), TRACING["branch"], None)
        TRACING["building"] = True
        try:
            return original_at_instant(self, instant)
        finally:
            TRACING["building"] = not outer

    P.ParameterNode._get_at_instant = _get_at_instant
    # Values are never read back; dropping them keeps the trace in memory.
    tracers.FullTracer.record_calculation_result = lambda self, value: None


def enable_parameter_tracing(simulation) -> None:
    root = simulation.tax_benefit_system.parameters
    root.trace = True
    root.tracer = simulation.tracer
    root.branch_name = simulation.branch_name
    TRACING["tracer"] = simulation.tracer
    TRACING["branch"] = simulation.branch_name

    def clear(node) -> None:
        cache = getattr(node, "_at_instant_cache", None)
        if cache is not None:
            cache.clear()
        children = getattr(node, "children", None)
        if isinstance(children, dict):
            for child in children.values():
                clear(child)

    clear(root)


def calculate_everything(simulation, year: int) -> dict[str, int]:
    """Calculate every variable, falling back to a monthly period. Returns failure counts."""
    from policyengine_core.periods import ETERNITY

    outcomes = {"ok": 0, "failed": 0}
    variables = simulation.tax_benefit_system.variables
    for index, name in enumerate(sorted(variables)):
        variable = variables[name]
        if variable.definition_period == ETERNITY:
            periods = [ETERNITY]
        elif variable.definition_period == "month":
            periods = [f"{year}-01"]
        else:
            periods = [year, f"{year}-01"]
        for period in periods:
            try:
                simulation.calculate(name, period)
                outcomes["ok"] += 1
                break
            except Exception:  # noqa: BLE001 - any formula failure just skips the variable
                continue
        else:
            outcomes["failed"] += 1
        if index % 500 == 0:
            print(f"  {index}/{len(variables)} variables", file=sys.stderr, flush=True)
    return outcomes


def collect_edges(simulation):
    readers: dict[str, set[str]] = defaultdict(set)
    consumers: dict[str, set[str]] = defaultdict(set)
    seen: set[int] = set()

    def walk(node) -> None:
        if id(node) in seen:
            return
        seen.add(id(node))
        for parameter in node.parameters:
            if not parameter.name.startswith(IGNORED_PARAMETER_PREFIXES):
                readers[parameter.name].add(node.name)
        for child in node.children:
            if child.name != node.name:
                consumers[child.name].add(node.name)
            walk(child)

    for tree in simulation.tracer.trees:
        walk(tree)
    return readers, consumers


# The UK inputs the generated population varies, by how each is drawn. Enum
# inputs draw any of the model's own values, so the list never names a value
# the model does not have.
UK_PERSON_AMOUNTS = {
    "employment_income": (0.6, 150_000),
    "self_employment_income": (0.15, 80_000),
    "private_pension_income": (0.2, 40_000),
    "savings_interest_income": (0.4, 5_000),
    "dividend_income": (0.15, 60_000),
    "property_income": (0.1, 30_000),
    "childcare_expenses": (0.15, 12_000),
    "hours_worked": (0.6, 2_400),
}
UK_PERSON_FLAGS = {"is_disabled_for_benefits": 0.15, "is_blind": 0.03}
UK_PERSON_ENUMS = ("pip_dl_category", "pip_m_category", "dla_sc_category", "dla_m_category")
UK_HOUSEHOLD_AMOUNTS = {"rent": (0.4, 18_000)}
UK_HOUSEHOLD_ENUMS = ("region", "tenure_type", "council_tax_band")


def enum_names(system, variable_name: str) -> list[str]:
    variable = system.variables[variable_name]
    return [member.name for member in variable.possible_values]


def uk_situation(system, households: int, year: int, seed: int) -> dict:
    """A varied UK population: singles, couples, children, pensioners, carers' cases,
    every region, tenure and council tax band, and each income source, drawn with a
    fixed seed so the map is reproducible."""
    draw = random.Random(seed)
    period = str(year)
    people: dict = {}
    benunits: dict = {}
    household_records: dict = {}
    for household_index in range(households):
        adult_count = draw.choice((1, 1, 2, 2, 2))
        child_count = draw.choice((0, 0, 1, 2, 3, 4))
        # Some households are of pension age, some of working age.
        adult_age_range = draw.choice(((18, 30), (25, 64), (40, 66), (66, 95)))
        members = []
        for adult_index in range(adult_count):
            person_name = f"household {household_index} adult {adult_index}"
            person = {"age": {period: draw.randint(*adult_age_range)}}
            for variable_name, (share, ceiling) in UK_PERSON_AMOUNTS.items():
                if draw.random() < share:
                    person[variable_name] = {period: round(draw.uniform(0, ceiling))}
            for variable_name, share in UK_PERSON_FLAGS.items():
                person[variable_name] = {period: draw.random() < share}
            for variable_name in UK_PERSON_ENUMS:
                if draw.random() < 0.15:
                    person[variable_name] = {
                        period: draw.choice(enum_names(system, variable_name))
                    }
            people[person_name] = person
            members.append(person_name)
        for child_index in range(child_count):
            person_name = f"household {household_index} child {child_index}"
            people[person_name] = {"age": {period: draw.randint(0, 19)}}
            if draw.random() < 0.05:
                people[person_name]["is_disabled_for_benefits"] = {period: True}
            members.append(person_name)
        benunits[f"household {household_index} benefit unit"] = {"members": members}
        household = {"members": list(members)}
        for variable_name, (share, ceiling) in UK_HOUSEHOLD_AMOUNTS.items():
            if draw.random() < share:
                household[variable_name] = {period: round(draw.uniform(0, ceiling))}
        for variable_name in UK_HOUSEHOLD_ENUMS:
            household[variable_name] = {period: draw.choice(enum_names(system, variable_name))}
        household_records[f"household {household_index}"] = household
    return {"people": people, "benunits": benunits, "households": household_records}


def load_simulation(country: str, households: int, year: int):
    """The traced simulation and the name of the data it runs on."""
    if country == "us":
        from policyengine_us import Microsimulation

        simulation = Microsimulation()
        # Subsampling rewraps the data as a plain dataframe; keep the real name.
        dataset_name = getattr(simulation.dataset, "name", None)
        simulation = simulation.subsample(n=households, seed=0) or simulation
        return simulation, dataset_name
    from policyengine_uk import CountryTaxBenefitSystem, Simulation

    situation = uk_situation(CountryTaxBenefitSystem(), households, year, seed=0)
    simulation = Simulation(situation=situation, trace=True)
    return simulation, "generated households (scripts/build-parameter-dependency-map.py)"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--country", choices=sorted(OUTPUTS), default="us")
    parser.add_argument("--households", type=int, default=None)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    households = args.households or (2000 if args.country == "us" else 400)
    output = args.output or OUTPUTS[args.country]

    patch_tracer()
    started = time.time()
    simulation, dataset_name = load_simulation(args.country, households, args.year)
    simulation.trace = True
    enable_parameter_tracing(simulation)
    print(f"loaded {households} households in {time.time() - started:.0f}s", file=sys.stderr)

    started = time.time()
    outcomes = calculate_everything(simulation, args.year)
    print(
        f"calculated {outcomes['ok']} variables ({outcomes['failed']} failed) in {time.time() - started:.0f}s",
        file=sys.stderr,
    )

    readers, consumers = collect_edges(simulation)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": {
            "package": PACKAGES[args.country],
            "version": version(PACKAGES[args.country]),
            "coreVersion": version("policyengine-core"),
            "dataset": dataset_name,
            "households": households,
            "year": args.year,
        },
        "variablesCalculated": outcomes["ok"],
        "variablesFailed": outcomes["failed"],
        "readers": {path: sorted(names) for path, names in sorted(readers.items())},
        "consumers": {name: sorted(users) for name, users in sorted(consumers.items())},
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(
        f"wrote {output} — {len(readers)} parameter paths, {len(consumers)} consumed variables",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
