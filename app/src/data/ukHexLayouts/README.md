# UK hex-map layouts

Hex-grid positions for the UK local-area hex maps, one per area, keyed by ONS code. The v3 "Local areas" tab and the v2 constituency and local authority tabs place each area from these files by its ONS code, through `placeOnUKHexLayout`, instead of at the `x` and `y` that the Public API sends with each area. If any area in a result has no code, or a code these files lack (such as a district abolished in April 2023), every area in that result falls back to its `x` and `y`, on the untiled grid, so the map never mixes the two sets of positions.

| File | Areas | Boundaries | Source file |
|---|---|---|---|
| `constituencies_2024.json` | 650 Westminster constituencies | 2024 (`PCON24CD`) | [`maps/uk-constituencies-2023.hexjson`](https://github.com/odileeds/hexmaps/blob/4d3152010cc5c54841a6a75de6cb4d6fdd31d223/maps/uk-constituencies-2023.hexjson) at `4d31520` (18 July 2024) |
| `local_authorities_2023.json` | 361 local authority districts | April 2023 (`LAD23CD`) | [`maps/uk-local-authority-districts-2023.hexjson`](https://github.com/odileeds/hexmaps/blob/c67a3c9189c6b27efd2218897bb98ee135e9719f/maps/uk-local-authority-districts-2023.hexjson) at `c67a3c9` (30 October 2024) |

The constituency source file is named after the 2023 boundary review, whose constituencies took effect at the July 2024 general election: the same 650 codes as `public/data/geojson/uk_constituencies_2024.geojson`.

## Format

Each file maps an ONS code to `[q, r]`, the HexJSON `odd-r` position: `q` is the column, `r` the row, rows increase northwards, and odd rows sit half a hex to the right. `ukHexPosition` in `components/visualization/choropleth/ukHexLayout.ts` converts a position to the hex map's grid. The files keep only the codes and positions; the source files also carry names, regions and colours.

## Updating

1. Download the new HexJSON file from [odileeds/hexmaps](https://github.com/odileeds/hexmaps) (`maps/`) at a fixed commit.
2. Rebuild the file here as `{ code: [q, r] }`, sorted by code, and update the table above.
3. Run `bun run vitest -- src/tests/unit/data/ukBoundaryFiles.test.ts`. It checks that the codes match the boundary files exactly and that no two areas share a position.

## Licence

The layouts are by Open Innovations, under the MIT licence:

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
