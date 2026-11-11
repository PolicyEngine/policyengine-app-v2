# UK boundary sources

The UK local-area maps' geographic view draws these two files. `README.md` describes the US congressional district files.

| File                                | Areas                                                  | Join property (code, name) | Size   |
| ----------------------------------- | ------------------------------------------------------ | -------------------------- | ------ |
| `uk_constituencies_2024.geojson`    | 650 Westminster constituencies, 4 July 2024 boundaries | `PCON24CD`, `PCON24NM`     | 749 KB |
| `uk_local_authorities_2023.geojson` | 361 local authority districts, May 2023                | `LAD23CD`, `LAD23NM`       | 558 KB |

The code sets match .py 6.10.0's `src/policyengine/data/uk_geography/constituencies_2024.csv` and `local_authorities_2023.csv` exactly, names included. `app/src/tests/unit/data/ukBoundaryFiles.test.ts` checks this against copies of those lists.

## Origin

Office for National Statistics, [Open Geography Portal](https://geoportal.statistics.gov.uk/), downloaded from its ArcGIS feature services in WGS 84 (EPSG:4326):

- "Westminster Parliamentary Constituencies (July 2024) Boundaries UK BUC": service `Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BUC`
- "Local Authority Districts (May 2023) Boundaries UK BUC": service `Local_Authority_Districts_May_2023_UK_BUC_V2`

BUC is ONS's ultra generalised (500 m) version, clipped to the coastline. May 2023 local authority districts are the April 2023 set: Ards and North Down (`N09000011`) and the four April 2023 unitary authorities (`E06000063` to `E06000066`), without the 17 districts they replaced.

## Licence

Both are ONS digital boundary products, supplied under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) ([ONS licences](https://www.ons.gov.uk/methodology/geography/licences)). Wherever the maps appear they must carry:

- Source: Office for National Statistics licensed under the Open Government Licence v.3.0
- Contains OS data © Crown copyright and database right 2024 (constituencies) or 2023 (local authorities)

The map component prints this under each geographic map (`UK_BOUNDARY_ATTRIBUTION` in `app/src/components/visualization/choropleth/ukAreaBoundaries.ts`).

## Simplification

`app/scripts/build-uk-boundaries.py` (Python standard library only) downloads both sets and writes these files:

1. keeps each area's code and name and nothing else;
2. rounds coordinates to 4 decimal places (about 11 m), on top of ONS's 500 m generalisation;
3. drops points that rounding repeats, and rings that rounding collapses or reverses (a reversed ring would fill the whole map, as d3-geo reads clockwise rings as outlines and anticlockwise ones as holes);
4. sorts areas by code, checks the area count, and writes compact JSON.

To rebuild, from the repository root:

```bash
python3 app/scripts/build-uk-boundaries.py
```

When .py moves to new boundaries (for example LAD24), point the script at the matching ONS service and property names, rebuild, update `UK_BOUNDARY_FILES` and the attribution year, and refresh the test's copies of .py's lists.
