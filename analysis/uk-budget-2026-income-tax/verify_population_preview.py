"""Verify the saved public preview aggregates offline and rebuild their summary."""

import csv
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
SNAPSHOT = BASE / "population-preview"
SOURCE = "https://ab2026-local-preview.vercel.app/uk/autumn-budget-2026/data/"
MEASURES = ("unearned_income_rates_up", "trading_allowance_raise")
TABLES = ("budgetary_impact", "distributional_impact", "winners_losers", "metrics")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text())


def main():
    provenance = read_json(BASE / "provenance.json")
    manifest = read_json(SNAPSHOT / "manifest.json")
    summary = {
        "status": "Provisional preview; reconciliation awaiting_source; not final approval",
        "manifest_url": SOURCE + "manifest.json",
        "manifest_updated_at": manifest["updated_at"],
        "manifest_sha256": hashlib.sha256((SNAPSHOT / "manifest.json").read_bytes()).hexdigest(),
        "units": {
            "budget_change_gbp_bn": "Annual government balance change, GBP billion; positive revenue, negative cost",
            "mean_household_change_gbp": "Weighted mean annual net income change, GBP per household; includes unaffected households",
            "income_change_pct": "Decile total income change / decile total baseline income * 100",
            "people_affected_pct": "Percentage of people in valid-decile households with abs(change / max(baseline income, GBP 1)) > 0.0001",
        },
        "limitations": [
            "No affected headcounts, household shares, winner/loser shares or survey support counts exported",
            "Static estimates; Treasury post-behavioural fiscal-year forecasts require separate reconciliation",
            "Trading allowance lacks gross receipts and may overstate cost",
        ],
        "measures": {},
    }
    for mid in MEASURES:
        entry = manifest["measures"][mid]
        receipt = read_json(SNAPSHOT / mid / "receipt.json")
        dashboard, execution = receipt["dashboard"], receipt["execution_receipt"]
        require(entry["status"] == "provisional", f"{mid}: unexpected publication status")
        require(entry["reconciliation"]["summary_status"] == "awaiting_source", f"{mid}: unexpected reconciliation")
        require(dashboard["publishable"] and execution["certification_status"] == "certified", f"{mid}: not publishable/certified")
        for package, key in (("policyengine", "wrapper"), ("policyengine-uk", "model"), ("policyengine-core", "core")):
            expected = provenance["package_versions"][package]
            require(execution[key]["version"] == expected == manifest["execution"]["identity"][key]["version"], f"{mid}: {package} mismatch")
        require(execution["data"]["dataset_sha256"] == provenance["population"]["sha256"], f"{mid}: dataset hash mismatch")
        require(manifest["execution"]["identity"]["data"]["dataset_sha256"] == execution["data"]["dataset_sha256"], f"{mid}: manifest dataset mismatch")
        require(execution["data"]["build_id"] == provenance["population"]["dataset"], f"{mid}: dataset build mismatch")
        require(execution["certificate"]["certified_dataset_sha256"] == execution["data"]["dataset_sha256"], f"{mid}: certificate mismatch")
        require(dashboard["digests"]["receipt_sha256"] == entry["receipt_sha256"], f"{mid}: receipt identity mismatch")
        floor = dashboard["disclosure_floor"]
        require(floor["checked"] and floor["survey_households"] == 3 and not floor["thin_cells_in_tables"], f"{mid}: disclosure floor failed")
        require(not any(cell["table"] in TABLES for cell in floor["thin_cells"]), f"{mid}: thin decile cells")
        tables = {}
        for name in TABLES:
            path = SNAPSHOT / mid / f"{name}.csv"
            require(hashlib.sha256(path.read_bytes()).hexdigest() == dashboard["files"][path.name], f"{mid}: {path.name} hash mismatch")
            tables[name] = list(csv.DictReader(path.open()))
        years = {}
        for year in entry["years"]:
            rows = {name: [row for row in data if int(row["year"]) == year] for name, data in tables.items()}
            cash = {row["decile"]: float(row["avg_change"]) for row in rows["winners_losers"]}
            percent = {int("".join(filter(str.isdigit, row["decile"]))): float(row["value"]) for row in rows["distributional_impact"]}
            require(set(cash) == {str(i) for i in range(1, 11)} | {"all"} and set(percent) == set(range(1, 11)), f"{mid}/{year}: incomplete deciles")
            require(len(rows["budgetary_impact"]) == len(rows["metrics"]) == 1, f"{mid}/{year}: incomplete headline")
            years[str(year)] = {
                "budget_change_gbp_bn": float(rows["budgetary_impact"][0]["value"]),
                "mean_household_change_gbp": cash["all"],
                "people_affected_pct": float(rows["metrics"][0]["people_affected"]),
                "deciles": [{"decile": i, "mean_household_change_gbp": cash[str(i)], "income_change_pct": percent[i]} for i in range(1, 11)],
            }
        summary["measures"][mid] = {
            "source_commit": dashboard["git_sha"], "generated_at": dashboard["generated_at"],
            "description": dashboard["description"], "execution": execution,
            "disclosure_floor": floor,
            "sources": {name: SOURCE + entry["artifact"] + f"/{name}.csv" for name in TABLES},
            "receipt_url": SOURCE + entry["artifact"] + "/receipt.json", "years": years,
        }
    (SNAPSHOT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print("Verified 8 aggregate CSV hashes, certified provenance and provisional disclosure gates; rebuilt population-preview/summary.json")


if __name__ == "__main__":
    main()
