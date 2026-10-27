# UK hex-map layouts

Hex-grid positions for the UK local-area hex maps, one per area, keyed by ONS code. The v3 "Local areas" tab and the v2 constituency and local authority tabs place each area from these files by its ONS code, through `placeOnUKHexLayout`. The app does not read the `x` and `y` that the Public API sends with each area. An area whose code these files lack (such as a district abolished in April 2023), or that has no code, is left off the hex map, and a note under the map says how many are.

`withheldUKHexAreas` lists the areas of a report's region that a result leaves out, each at its position here and named from the name files below. The region's areas are every code in these files for a UK-wide report, and the nation's codes for a nation's report. For a level from a local-area breakdown, which disclosure control applies to, the hex maps draw each such area hatched, outside the colour scale, with "Not reported" in its tooltip. A saved result, which disclosure control did not apply to, draws only its own areas.

| File | Areas | Boundaries | Source file |
|---|---|---|---|
| `constituencies_2024.json` | 650 Westminster constituencies | 2024 (`PCON24CD`) | [`maps/uk-constituencies-2023.hexjson`](https://github.com/odileeds/hexmaps/blob/4d3152010cc5c54841a6a75de6cb4d6fdd31d223/maps/uk-constituencies-2023.hexjson) at `4d31520` (18 July 2024) |
| `local_authorities_2023.json` | 361 local authority districts | April 2023 (`LAD23CD`) | [`maps/uk-local-authority-districts-2023.hexjson`](https://github.com/odileeds/hexmaps/blob/c67a3c9189c6b27efd2218897bb98ee135e9719f/maps/uk-local-authority-districts-2023.hexjson) at `c67a3c9` (30 October 2024) |
| `constituency_names_2024.json` | 650 constituency names | 2024 (`PCON24NM`) | `public/data/geojson/uk_constituencies_2024.geojson` |
| `local_authority_names_2023.json` | 361 local authority names | April 2023 (`LAD23NM`) | `public/data/geojson/uk_local_authorities_2023.geojson` |

The constituency source file is named after the 2023 boundary review, whose constituencies took effect at the July 2024 general election: the same 650 codes as `public/data/geojson/uk_constituencies_2024.geojson`.

## Format

Each layout file maps an ONS code to `[q, r]`, the HexJSON `odd-r` position: `q` is the column, `r` the row, rows increase northwards, and odd rows sit half a hex to the right. `ukHexPosition` in `components/visualization/choropleth/ukHexLayout.ts` converts a position to the hex map's grid. The files keep only the codes and positions; the source files also carry names, regions and colours.

Each name file maps an ONS code to the area's name in the app's boundary file (`PCON24NM` or `LAD23NM`), which is also its name in .py 6.10.0's area lists.

## Updating

1. Download the new HexJSON file from [odileeds/hexmaps](https://github.com/odileeds/hexmaps) (`maps/`) at a fixed commit.
2. Rebuild the file here as `{ code: [q, r] }`, sorted by code, and update the table above.
3. Rebuild the name file from the boundary file as `{ code: name }`, sorted by code.
4. Run `bun run vitest -- src/tests/unit/data/ukBoundaryFiles.test.ts`. It checks that the codes match the boundary files exactly, that no two areas share a position, and that each name file gives the boundary file's name for every code.

## Licence

The name files come from the boundary files, whose source and licence are in `public/data/geojson/SOURCES.md`. The layouts are by Open Innovations, under the MIT licence:

```
MIT License

Copyright (c) 2017- Open Innovations

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
