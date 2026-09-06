"""Build the parameter → variable dependency map from a traced simulation.

The flagship validation layer needs to know which model variables a reform
touches, so it can look those variables up in the calibration dashboard and
the scorecard. Grepping formula source for parameter paths misses bracket,
scale, and vectorised accesses; the only exact record is what the model
actually reads at run time. This script runs policyengine-us with
policyengine-core's FullTracer over a subsample of the default microdata,
calculates every variable, and writes two edge sets:

    readers[parameter_path]  -> variables whose formula read that parameter
    consumers[variable]      -> variables whose formula read that variable

Output: app/src/data/flagship/parameterDependencies.json (consumed by
app/src/libs/flagship/parameterDependencies.ts).

Run from a Python environment with policyengine-us installed:

    python app/scripts/build-parameter-dependency-map.py [--households N] [--year YYYY]

Two core quirks are handled here rather than upstream:
  * core caches the yearly ParameterNodeAtInstant before its own tracing
    recast runs, so the cached node is untraced; we flag the parameter root
    for tracing and clear the at-instant caches before any calculation.
  * TracingParameterNodeAtInstant only records scalar/array leaves, so
    scale/bracket objects (p.base.calc(age), p.max[children]) are invisible;
    we record every non-node child access.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path

OUTPUT = (
    Path(__file__).resolve().parent.parent
    / "src"
    / "data"
    / "flagship"
    / "parameterDependencies.json"
)

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
    # Values are never read back; dropping them keeps the trace in memory.
    tracers.FullTracer.record_calculation_result = lambda self, value: None


def enable_parameter_tracing(simulation) -> None:
    root = simulation.tax_benefit_system.parameters
    root.trace = True
    root.tracer = simulation.tracer
    root.branch_name = simulation.branch_name

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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--households", type=int, default=2000)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    patch_tracer()
    from policyengine_us import Microsimulation

    started = time.time()
    simulation = Microsimulation()
    # Subsampling rewraps the data as a plain dataframe; keep the real name.
    dataset_name = getattr(simulation.dataset, "name", None)
    simulation = simulation.subsample(n=args.households, seed=0) or simulation
    simulation.trace = True
    enable_parameter_tracing(simulation)
    print(f"loaded microdata subsample in {time.time() - started:.0f}s", file=sys.stderr)

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
            "package": "policyengine-us",
            "version": version("policyengine-us"),
            "coreVersion": version("policyengine-core"),
            "dataset": dataset_name,
            "households": args.households,
            "year": args.year,
        },
        "variablesCalculated": outcomes["ok"],
        "variablesFailed": outcomes["failed"],
        "readers": {path: sorted(names) for path, names in sorted(readers.items())},
        "consumers": {name: sorted(users) for name, users in sorted(consumers.items())},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(
        f"wrote {args.output} — {len(readers)} parameter paths, {len(consumers)} consumed variables",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
