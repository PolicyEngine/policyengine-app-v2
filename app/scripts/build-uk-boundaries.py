#!/usr/bin/env python3
"""Build the UK boundary files the local-area maps draw.

Downloads two Office for National Statistics boundary sets from the ONS
Open Geography Portal's ArcGIS feature services, in WGS 84 longitude and
latitude:

- Westminster Parliamentary Constituencies (July 2024) Boundaries UK BUC
- Local Authority Districts (May 2023) Boundaries UK BUC

BUC is ONS's ultra generalised (500 m), coastline-clipped version. The
script keeps each area's code and name, rounds coordinates to 4 decimal
places (about 11 m), drops points that rounding makes repeat and rings that
collapse, sorts the areas by code, and writes compact GeoJSON to
app/public/data/geojson/. It uses only the Python standard library.

Usage (from the repository root):
    python3 app/scripts/build-uk-boundaries.py [--input-dir DIR]

--input-dir reads previously downloaded responses (pcon24_buc.geojson and
lad23_buc.geojson) instead of downloading them.
"""

import argparse
import json
import pathlib
import urllib.parse
import urllib.request

FEATURE_SERVICE_ROOT = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"
COORDINATE_DECIMALS = 4

BOUNDARY_SETS = [
    {
        "service": "Westminster_Parliamentary_Constituencies_July_2024_Boundaries_UK_BUC",
        "download_name": "pcon24_buc.geojson",
        "code_property": "PCON24CD",
        "name_property": "PCON24NM",
        "expected_count": 650,
        "output": "uk_constituencies_2024.geojson",
    },
    {
        "service": "Local_Authority_Districts_May_2023_UK_BUC_V2",
        "download_name": "lad23_buc.geojson",
        "code_property": "LAD23CD",
        "name_property": "LAD23NM",
        "expected_count": 361,
        "output": "uk_local_authorities_2023.geojson",
    },
]


def download_boundaries(boundary_set):
    query = urllib.parse.urlencode(
        {
            "where": "1=1",
            "outFields": f"{boundary_set['code_property']},{boundary_set['name_property']}",
            "outSR": "4326",
            "f": "geojson",
        }
    )
    url = f"{FEATURE_SERVICE_ROOT}/{boundary_set['service']}/FeatureServer/0/query?{query}"
    with urllib.request.urlopen(url, timeout=300) as response:
        return json.load(response)


def signed_area(ring):
    """Twice the ring's signed area in degrees: negative when it runs clockwise."""
    return sum(
        ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1]
        for index in range(len(ring) - 1)
    )


def round_ring(ring):
    """
    The ring with rounded coordinates and without repeated points. None if
    rounding collapses it: fewer than three distinct points, no area, or its
    direction reversed. The direction matters: d3-geo, which draws the maps,
    reads a clockwise ring as an area's outline and an anticlockwise one as a
    hole, so a reversed sliver would cover the whole map.
    """
    rounded = []
    for longitude, latitude, *_ in ring:
        point = [round(longitude, COORDINATE_DECIMALS), round(latitude, COORDINATE_DECIMALS)]
        if not rounded or point != rounded[-1]:
            rounded.append(point)
    if rounded[0] != rounded[-1]:
        rounded.append(rounded[0])
    if len(rounded) < 4:
        return None
    original_area = signed_area(ring)
    rounded_area = signed_area(rounded)
    if rounded_area == 0 or (rounded_area > 0) != (original_area > 0):
        return None
    return rounded


def round_polygon(polygon):
    """The polygon with rounded rings; None if its outer ring collapses."""
    outer = round_ring(polygon[0])
    if outer is None:
        return None
    holes = [ring for ring in (round_ring(hole) for hole in polygon[1:]) if ring is not None]
    return [outer, *holes]


def round_geometry(geometry):
    polygons = (
        [geometry["coordinates"]]
        if geometry["type"] == "Polygon"
        else geometry["coordinates"]
    )
    kept = [polygon for polygon in (round_polygon(polygon) for polygon in polygons) if polygon]
    if not kept:
        # Never lose an area: keep its largest polygon unrounded.
        kept = [max(polygons, key=lambda polygon: len(polygon[0]))]
    if len(kept) == 1:
        return {"type": "Polygon", "coordinates": kept[0]}
    return {"type": "MultiPolygon", "coordinates": kept}


def check_directions(boundary_set, features):
    """Every outline runs clockwise and every hole anticlockwise, as d3-geo reads them."""
    for feature in features:
        geometry = feature["geometry"]
        polygons = (
            [geometry["coordinates"]]
            if geometry["type"] == "Polygon"
            else geometry["coordinates"]
        )
        for polygon in polygons:
            if signed_area(polygon[0]) >= 0 or any(signed_area(hole) <= 0 for hole in polygon[1:]):
                code = feature["properties"][boundary_set["code_property"]]
                raise SystemExit(f"{boundary_set['service']}: {code} has a ring in the wrong direction")


def build(boundary_set, collection):
    if collection.get("exceededTransferLimit"):
        raise SystemExit(f"{boundary_set['service']}: the service returned a partial result")
    features = []
    for feature in collection["features"]:
        properties = feature["properties"]
        features.append(
            {
                "type": "Feature",
                "properties": {
                    boundary_set["code_property"]: properties[boundary_set["code_property"]],
                    boundary_set["name_property"]: properties[boundary_set["name_property"]],
                },
                "geometry": round_geometry(feature["geometry"]),
            }
        )
    features.sort(key=lambda feature: feature["properties"][boundary_set["code_property"]])
    check_directions(boundary_set, features)
    if len(features) != boundary_set["expected_count"]:
        raise SystemExit(
            f"{boundary_set['service']}: {len(features)} areas, expected {boundary_set['expected_count']}"
        )
    return {"type": "FeatureCollection", "features": features}


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--input-dir", type=pathlib.Path)
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=pathlib.Path(__file__).resolve().parent.parent / "public" / "data" / "geojson",
    )
    arguments = parser.parse_args()
    for boundary_set in BOUNDARY_SETS:
        if arguments.input_dir:
            with open(arguments.input_dir / boundary_set["download_name"]) as handle:
                collection = json.load(handle)
        else:
            collection = download_boundaries(boundary_set)
        output_path = arguments.output_dir / boundary_set["output"]
        with open(output_path, "w") as handle:
            json.dump(build(boundary_set, collection), handle, separators=(",", ":"))
            handle.write("\n")
        print(f"{output_path}: {output_path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
