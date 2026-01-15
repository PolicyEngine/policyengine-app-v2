# Congressional District GeoJSON Data

## Current File

- **File:** `real_congressional_districts.geojson`
- **Congress:** 118th (used as fallback - boundaries nearly identical to 119th)
- **Source:** US Census Bureau via PolicyEngine/snap-district-map
- **Note:** 119th Congress boundaries differ only in 5 states (AL, GA, LA, NY, NC) due to court-ordered redistricting

## Pre-processing

The GeoJSON file has been pre-processed to add a `DISTRICT_ID` property to each feature. This property matches the district identifier format used by the PolicyEngine API (e.g., "AL-01", "CA-52").

### Why pre-process?

The Census Bureau uses FIPS codes for geographic identifiers:
- `STATEFP`: State FIPS code (e.g., "01" for Alabama)
- `GEOID`: Combined state FIPS + district number (e.g., "0101")

The PolicyEngine API returns district identifiers using state abbreviations:
- Format: `{STATE_ABBR}-{DISTRICT_NUM}` (e.g., "AL-01")

By adding `DISTRICT_ID` to the GeoJSON, we:
1. Eliminate runtime FIPS-to-abbreviation conversion
2. Remove duplicated state code mappings from the application code
3. Enable direct matching between API data and map features

### Regenerating DISTRICT_ID

If you update the GeoJSON file, run this script to add `DISTRICT_ID` properties:

```python
import json

FIPS_TO_STATE = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
    "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
    "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
    "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
    "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
    "56": "WY"
}

# At-large states use "00" in GeoJSON, API uses "01"
AT_LARGE_FIPS = {'02', '10', '38', '46', '50', '56'}  # AK, DE, ND, SD, VT, WY

with open('real_congressional_districts.geojson', 'r') as f:
    data = json.load(f)

for feature in data['features']:
    props = feature.get('properties', {})
    state_fips = props.get('STATEFP')
    district_num = props.get('CD118FP') or props.get('CD')

    if state_fips and district_num:
        state_abbr = FIPS_TO_STATE.get(state_fips)
        if state_abbr:
            # At-large states: GeoJSON "00" -> API "01"
            if state_fips in AT_LARGE_FIPS and district_num == '00':
                district_num = '01'
            # DC: GeoJSON "98" -> API "01"
            if state_fips == '11' and district_num == '98':
                district_num = '01'
            props['DISTRICT_ID'] = f"{state_abbr}-{district_num}"

with open('real_congressional_districts.geojson', 'w') as f:
    json.dump(data, f)
```

## Feature Properties

Each GeoJSON feature includes:

| Property | Description | Example |
|----------|-------------|---------|
| `DISTRICT_ID` | API-compatible district ID | "AL-01" |
| `STATEFP` | State FIPS code | "01" |
| `CD118FP` | District number | "01" |
| `GEOID` | Combined FIPS identifier | "0101" |

## Data Source

Original 118th Congress file from:
https://github.com/PolicyEngine/snap-district-map

## Update Schedule

- **Next update needed:** When 119th Congress compatible GeoJSON is available
- **Decennial redistricting:** After each Census (next: ~2033)
