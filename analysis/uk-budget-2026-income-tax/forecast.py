"""The exact October forecast used by Pavel's PTA comparison.

The stored JSON is unchanged from dashboard commit 640426575270224db9b04d6c94d30e264a347be2.
The fuel-duty path follows that commit's forecast_parameter_changes, including
its ROUND_HALF_UP rule. Synthetic households load no population data, so passing
these changes to pe.uk before calculation is equivalent to with_forecast.
"""

from decimal import ROUND_HALF_UP, Decimal
from functools import lru_cache
import hashlib
import json
from pathlib import Path


COMMIT = "640426575270224db9b04d6c94d30e264a347be2"
FORECAST_PATH = Path(__file__).with_name("obr_october_2026.json")
EXPECTED_BLOB = "b504a48fffb93714ff358d869cad712b6daea20e"


@lru_cache(maxsize=None)
def parameter_changes() -> dict:
    raw = FORECAST_PATH.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    assert blob == EXPECTED_BLOB, (blob, EXPECTED_BLOB)
    record = json.loads(raw)
    changes = {
        path: dict(entry["values"])
        for path, entry in record["parameter_changes"].items()
    }
    rate = Decimal("0.6059")
    steps = [("2027-04-01", float(rate))]
    for year in range(2028, 2033):
        growth = Decimal(str(changes["gov.economic_assumptions.yoy_growth.obr.rpi"][f"{year - 1}-01-01.{year - 1}-12-31"]))
        rate = (rate * (1 + growth)).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        steps.append((f"{year}-04-01", float(rate)))
    changes["gov.hmrc.fuel_duty.petrol_and_diesel"] = {
        f"{day}.{int(day[:4]) + 1}-03-31": rate for day, rate in steps
    }
    return changes


def with_forecast(reform: dict) -> dict:
    """Apply the common forecast, with the isolated measure taking precedence."""
    return {**parameter_changes(), **reform}


def provenance() -> dict:
    return {
        "dashboard_commit": COMMIT,
        "source": f"https://github.com/PolicyEngine/uk-autumn-budget-dashboard-2026/blob/{COMMIT}/src/uk_budget_data/forecast/obr_october_2026.json",
        "forecast_file_git_blob": EXPECTED_BLOB,
        "forecast_module_git_blob": "b2ca186b6fd514f334ced11934d38b256e6d2127",
        "forecast_file_sha256": hashlib.sha256(FORECAST_PATH.read_bytes()).hexdigest(),
        "baseline_and_reform": True,
        "nominal_household_inputs": "Held fixed in 2027; the forecast updates model parameters, not the supplied income amounts.",
        "remaining_series": "March paths remain for cpih, non-labour income, private rent, mortgage interest, per-capita series, council tax and fuel volumes/prices, as recorded by this forecast vintage.",
    }
