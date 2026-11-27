"""Download the bundle's US datasets at their pinned revisions and check their sha256.

Usage (from the repository root):
    analysis/explore-baseline/.venv/bin/python analysis/explore-baseline/fetch_data.py

Prints one line per dataset: its key and local path. Needs Hugging Face
access to policyengine/populace-us (a login with `hf auth login`).
"""

import hashlib
import json
from pathlib import Path

from huggingface_hub import hf_hub_download

HERE = Path(__file__).parent
REPO_ID = "policyengine/populace-us"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 24), b""):
            digest.update(block)
    return digest.hexdigest()


def fetch(keys: list[str] | None = None) -> dict[str, Path]:
    pins = json.loads((HERE / "datasets.json").read_text())
    paths = {}
    for key, pin in pins.items():
        if keys is not None and key not in keys:
            continue
        path = Path(
            hf_hub_download(
                REPO_ID, pin["path"], repo_type="dataset", revision=pin["revision"]
            )
        )
        actual = sha256(path)
        if actual != pin["sha256"]:
            raise SystemExit(f"{key}: sha256 {actual} does not match the pin {pin['sha256']}")
        paths[key] = path
        print(key, path, flush=True)
    return paths


if __name__ == "__main__":
    fetch()
