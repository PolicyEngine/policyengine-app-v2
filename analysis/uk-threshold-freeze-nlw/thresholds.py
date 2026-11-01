"""Threshold paths and plain arithmetic for the threshold freeze post.

Holds no model code, so the tests can run without PolicyEngine UK.
"""

from decimal import ROUND_CEILING, Decimal

YEARS = (2026, 2027)

# ONS D7G7, CPI 12-month rate each September.
CPI_SEP = {2021: 0.031, 2022: 0.101, 2023: 0.067, 2024: 0.017, 2025: 0.038, 2026: 0.035}
# ONS D7BT, CPI index (2015=100).
D7BT = {"2022 JUL": 122.5, "2025 SEP": 139.3, "2026 SEP": 144.1}

NLW = {2026: 12.71, 2027: 13.21}
ACTUAL_PA = 12_570
ACTUAL_PT_WEEK = 241.73  # 12,570 / 52, as the model stores it

# Allowance indexed by CPI, stopping short of the s57 round-up.
UNROUNDED_PA = {2026: 16_070, 2027: 16_632}


def s57_allowance(cpi_sep: dict = CPI_SEP) -> dict:
    """ITA 2007 s57 from £12,570 in 2021-22: round each increase up to £10."""
    pa, out = Decimal(ACTUAL_PA), {}
    for year in range(2022, 2028):
        step = pa * Decimal(str(cpi_sep[year - 1]))
        pa += (step / 10).to_integral_value(ROUND_CEILING) * 10
        out[year] = int(pa)
    return out


def rounded_weekly_path(start: float, first_year: int, cpi_sep: dict = CPI_SEP) -> dict:
    """Index a weekly threshold by September CPI, to the nearest £1."""
    week, out = start, {}
    for year in range(first_year + 1, 2028):
        week = round(week * (1 + cpi_sep[year - 1]) + 1e-9)
        out[year] = week
    return out


S57_PA = s57_allowance()
PT_2021_WEEK = rounded_weekly_path(184, 2021)
PT_JUL22_WEEK = rounded_weekly_path(242, 2022)
# £242 a week from July 2022 to the September before each tax year.
PT_P2P_WEEK = {
    2026: round(242 * D7BT["2025 SEP"] / D7BT["2022 JUL"]),
    2027: round(242 * D7BT["2026 SEP"] / D7BT["2022 JUL"]),
}


def scenarios(year: int, pa: dict) -> dict:
    """Row name: (allowance, primary threshold a year), for one allowance path."""
    a = pa[year]
    return {
        "ni_tracks_allowance": (a, a),
        "ni_sep_cpi_from_jul22": (a, PT_JUL22_WEEK[year] * 52),
        "ni_p2p_from_jul22": (a, PT_P2P_WEEK[year] * 52),
        "allowance_only": (a, ACTUAL_PT_WEEK * 52),
        "ni_sep_cpi_from_2021": (a, PT_2021_WEEK[year] * 52),
    }


def hand(earnings: float, pa: float, pt: float) -> tuple[float, float]:
    """Income tax and NI of a basic rate worker, with no model code."""
    return 0.20 * max(0, earnings - pa), 0.08 * max(0, earnings - pt)
