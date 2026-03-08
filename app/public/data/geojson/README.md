# Congressional District Geographic Data

## Current Files

### Geographic Boundaries (Natural)

- **File:** `congressional_districts.geojson`
- **Format:** GeoJSON (direct from Census cartographic boundary files)
- **Congress:** 119th (January 2025 - January 2027)
- **Source:** [US Census Bureau Cartographic Boundary Files](https://www2.census.gov/geo/tiger/GENZ2024/shp/)
- **Resolution:** 1:20,000,000 (20m) - simplified for web visualization (~729 KB)
- **Coverage:** 50 US states + DC + Puerto Rico (437 districts)

### Hexagonal Grid (Equal-Size)

- **File:** `congressional_districts_hex.geojson`
- **Format:** GeoJSON with hexagonal polygon geometries
- **Congress:** 119th (compatible - district IDs match)
- **Source:** [PolicyEngine/snap-district-map](https://github.com/PolicyEngine/snap-district-map) (based on Daily Kos/The Downballot hex layout v3.1)
- **Coverage:** 50 US states + DC (436 districts, excludes PR)
- **Purpose:** Equal visual representation for each district regardless of geographic size

**Note:** The hex positions are based on the number of districts per state, not internal boundaries. Since the 5 states that redistricted for the 119th Congress (AL, GA, LA, NY, NC) kept the same number of districts, the hex map positions remain valid. All district IDs match the 119th Congress natural boundaries.

The hex map shows each congressional district as an equal-area shape, arranged in a recognizable US shape. This eliminates the visual distortion where large rural districts dominate the map while densely-populated urban districts are barely visible.

### Why Irregular "Blob" Shapes Instead of Uniform Hexagons?

The hex map uses irregular polygon shapes (blobs) rather than uniform hexagons **by design**. This is because:

1. **The artistic arrangement requires it.** The Daily Kos/Downballot map arranges 436 districts to form a recognizable US shape. In dense areas (urban districts in NY, CA, etc.), districts are packed tightly together.

2. **Uniform hexagons would overlap.** Analysis of the centroid positions shows some district pairs are only 0.5 units apart (e.g., KS-01 & KS-04). Uniform hexagons would need ~1.0 unit spacing to avoid overlap.

3. **The blobs are designed to tessellate.** The irregular shapes fit together like puzzle pieces, ensuring no overlap while maintaining the overall US shape.

**Comparison with UK constituencies hex map:** The UK map uses uniform hexagons because it was designed from scratch on a perfect grid. The US map was designed as an artistic cartogram where visual shape takes priority over geometric uniformity.

## Why GeoJSON?

We use GeoJSON directly for simplicity and compatibility:

- **No runtime conversion** - Plotly.js supports GeoJSON natively
- **Smaller file size** - The 20m simplified version is only ~729 KB
- **Standard format** - Widely supported across mapping libraries

## Pre-processing

The data has been pre-processed to add a `DISTRICT_ID` property to each feature. This property matches the district identifier format used by the PolicyEngine API (e.g., "AL-01", "CA-52").

### Why pre-process?

The Census Bureau uses FIPS codes for geographic identifiers:

- `STATEFP`: State FIPS code (e.g., "01" for Alabama)
- `CD119FP`: District number (e.g., "01")
- `GEOID`: Combined state FIPS + district number (e.g., "0101")

The PolicyEngine API returns district identifiers using state abbreviations:

- Format: `{STATE_ABBR}-{DISTRICT_NUM}` (e.g., "AL-01")

By adding `DISTRICT_ID` to the data, we:

1. Eliminate runtime FIPS-to-abbreviation conversion
2. Enable direct matching between API data and map features

## Versioning and Historical Data

The Census Bureau maintains yearly archives of geographic data:

- **Current data:** https://www2.census.gov/geo/tiger/GENZ2024/shp/
- **Historical archives:** https://www2.census.gov/geo/tiger/

Available cartographic boundary files by year:

- `GENZ2024/` - 119th Congress (2025-2027)
- `GENZ2023/` - 118th Congress
- `GENZ2022/` - 118th Congress
- `GENZ2021/` - 117th Congress
- etc.

To use a different Congress version, download from the appropriate year's archive.

## Regenerating from Source

If you need to update the district boundaries:

1. **Download the shapefile** from Census:

   ```bash
   curl -o cd119.zip "https://www2.census.gov/geo/tiger/GENZ2024/shp/cb_2024_us_cd119_20m.zip"
   ```

2. **Convert shapefile to GeoJSON** using shpjs (Node.js):

   ```javascript
   const shp = await import('shpjs');
   const fs = await import('fs');
   const buffer = fs.readFileSync('cd119.zip');
   const geojson = await shp.default(buffer);
   fs.writeFileSync('output.geojson', JSON.stringify(geojson));
   ```

3. **Add DISTRICT_ID properties** using the Node.js script below:

```javascript
const fs = require('fs');

const FIPS_TO_STATE = {
  '01': 'AL',
  '02': 'AK',
  '04': 'AZ',
  '05': 'AR',
  '06': 'CA',
  '08': 'CO',
  '09': 'CT',
  10: 'DE',
  11: 'DC',
  12: 'FL',
  13: 'GA',
  15: 'HI',
  16: 'ID',
  17: 'IL',
  18: 'IN',
  19: 'IA',
  20: 'KS',
  21: 'KY',
  22: 'LA',
  23: 'ME',
  24: 'MD',
  25: 'MA',
  26: 'MI',
  27: 'MN',
  28: 'MS',
  29: 'MO',
  30: 'MT',
  31: 'NE',
  32: 'NV',
  33: 'NH',
  34: 'NJ',
  35: 'NM',
  36: 'NY',
  37: 'NC',
  38: 'ND',
  39: 'OH',
  40: 'OK',
  41: 'OR',
  42: 'PA',
  44: 'RI',
  45: 'SC',
  46: 'SD',
  47: 'TN',
  48: 'TX',
  49: 'UT',
  50: 'VT',
  51: 'VA',
  53: 'WA',
  54: 'WV',
  55: 'WI',
  56: 'WY',
  60: 'AS',
  66: 'GU',
  69: 'MP',
  72: 'PR',
  78: 'VI',
};

// At-large states use '00' in Census data but API uses '01'
const AT_LARGE_FIPS = new Set(['02', '10', '38', '46', '50', '56']);

const data = JSON.parse(fs.readFileSync('input.geojson'));

data.features.forEach((feature) => {
  const props = feature.properties || {};
  const stateFips = props.STATEFP;
  let districtNum = props.CD119FP;

  if (stateFips && districtNum) {
    const stateAbbr = FIPS_TO_STATE[stateFips];
    if (stateAbbr) {
      // At-large states: Census '00' -> API '01'
      if (AT_LARGE_FIPS.has(stateFips) && districtNum === '00') {
        districtNum = '01';
      }
      // DC: Census '98' -> API '01'
      if (stateFips === '11' && districtNum === '98') {
        districtNum = '01';
      }
      props.DISTRICT_ID = stateAbbr + '-' + districtNum;
    }
  }

  // Optional: reduce coordinate precision to save space
  if (feature.geometry) {
    feature.geometry.coordinates = roundCoords(feature.geometry.coordinates, 5);
    delete feature.geometry.bbox;
  }
});

function roundCoords(coords, precision) {
  if (typeof coords[0] === 'number') {
    return coords.map((c) => Math.round(c * Math.pow(10, precision)) / Math.pow(10, precision));
  }
  return coords.map((c) => roundCoords(c, precision));
}

fs.writeFileSync('congressional_districts.geojson', JSON.stringify(data));
```

## Feature Properties

Each feature includes:

| Property      | Description                | Example                    |
| ------------- | -------------------------- | -------------------------- |
| `DISTRICT_ID` | API-compatible district ID | "AL-01"                    |
| `STATEFP`     | State FIPS code            | "01"                       |
| `CD119FP`     | District number            | "01"                       |
| `GEOID`       | Combined FIPS code         | "0101"                     |
| `NAMELSAD`    | Full district name         | "Congressional District 1" |

## Update Schedule

- **Current version:** 119th Congress (2025-2027)
- **Next regular update:** 120th Congress (January 2027)
- **Decennial redistricting:** After each Census (next: ~2033)
- **Mid-cycle updates:** Check for court-ordered redistricting changes

## Alternative Resolutions

Census provides multiple resolutions for different use cases:

| Scale | File                        | Size    | Use Case                    |
| ----- | --------------------------- | ------- | --------------------------- |
| 20m   | `cb_2024_us_cd119_20m.zip`  | ~400 KB | Web visualization (current) |
| 5m    | `cb_2024_us_cd119_5m.zip`   | ~2 MB   | Higher detail maps          |
| 500k  | `cb_2024_us_cd119_500k.zip` | ~7 MB   | Print-quality maps          |
