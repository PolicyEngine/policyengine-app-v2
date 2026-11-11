"""Which national figures we publish from Family Resources Survey records.

We apply the rules of PolicyEngine's disclosure layer (`policyengine.disclosure`
in policyengine 6.16.1) to every figure in the CSVs we publish. A figure rests on
the survey households whose records add to it, and it passes when:

- at least 10 survey households stand behind it, or none do;
- no one household holds more than half of it; and
- no reader, and no other household that knows its own part, can estimate one
  household's part to within 10% (the p% rule).

As in PolicyEngine's layer, a change of £1 a year or less gives a figure no
support. A share must pass on both of its sides, the records it counts and the
rest of its group. A mean passes on its change alone: like PolicyEngine's layer,
which checks an average change on its change and treats its count of households
as public, we publish each group's size. Copies of one survey household count
once.

We round every figure we publish no more finely than the minimum rounding bases
of PolicyEngine's layer: £1,000 for totals, £1 for averages, 0.0001 for relative
changes and 0.001 for shares. The layer also coarsens a figure's rounding to the
order of magnitude of its bootstrap standard error. We compute no standard
errors, so we can print a figure more finely than the layer would, and the
reader below works from our rounding.

The figures add up in ways a reader knows, so a reader can bound a figure we
withhold. We record each identity as a link, and credit the reader
with each published figure to within its rounding, the sign of any figure whose
parts all share one, and the size of each share's group. A linear programme over
every link then gives the reader's tightest bounds on each withheld figure that
fails the rules, and on the withheld figures of each link taken together when
those fail. Each bound must lie at least one household's largest part from the
true value, on every side that fails. We withhold further figures until they
do, and then check every bound again from scratch. This module runs no model
code.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import NamedTuple, Optional

import numpy as np
from scipy.optimize import linprog
from scipy.sparse import csr_matrix

FLOOR = 10
MAX_TOP_SHARE = 0.5
MIN_REST_SHARE = 0.1
# PolicyEngine's layer marks a figure approximate when fewer than 30 effective
# survey households stand behind it.
APPROXIMATE_BELOW_N_EFF = 30
# PolicyEngine's layer counts a change of £1 a year or less as none.
CHANGE_TOLERANCE = 1.0
# A count adds 1 for each record it counts.
COUNT_TOLERANCE = 0.5
# A link holds when its figures cancel to within this share of their size.
LINK_TOLERANCE = 1e-6
# The linear programme's answers carry rounding error of about this share.
SOLVER_TOLERANCE = 1e-6

SUM, SHARE, MEAN = "sum", "share", "mean"


class DisclosureError(RuntimeError):
    """The figures cannot be published as they stand."""


class Support(NamedTuple):
    n_sources: int
    n_eff: float
    top_share: float
    rest_share: float = math.inf


NO_SUPPORT = Support(0, 0.0, 0.0)


def support(weights: np.ndarray, contributions: np.ndarray, sources: np.ndarray, tolerance: float = 0.0) -> Support:
    """The survey households behind a figure, as policyengine.disclosure's
    `support` counts them: a record counts when it has weight and adds more than
    `tolerance`, and we sum records by survey household first."""
    contributing = (weights > 0) & (np.abs(contributions) > tolerance)
    if not contributing.any():
        return NO_SUPPORT
    _, source = np.unique(sources[contributing], return_inverse=True)
    w = weights[contributing]
    weighted = w * contributions[contributing]
    source_weight = np.bincount(source, weights=w)
    magnitude = np.bincount(source, weights=np.abs(weighted))
    signed = np.bincount(source, weights=weighted)
    return Support(
        len(source_weight),
        float(source_weight.sum() ** 2 / (source_weight**2).sum()),
        float(magnitude.max() / magnitude.sum()),
        rest_share(signed),
    )


def rest_share(signed: np.ndarray) -> float:
    """The p% measure on each household's signed part. A reader of the total
    estimates household i's part with error R = T - c_i, and a household j that
    knows its own part with error R - c_j. We return the smallest such error as a
    share of |c_i|, over every i and every j."""
    parts = signed[signed != 0]
    if not len(parts):
        return math.inf
    rest = float(signed.sum()) - parts
    order = np.argsort(parts, kind="stable")
    ranked = parts[order]
    rank = np.empty(len(parts), dtype=int)
    rank[order] = np.arange(len(parts))
    # The part nearest each R sits next to where R would sort, or one step
    # further when the nearest is the household's own.
    slot = np.searchsorted(ranked, rest)
    error = np.abs(rest)
    for step in (-2, -1, 0, 1):
        position = slot + step
        valid = (position >= 0) & (position < len(ranked)) & (position != rank)
        nearest = ranked[np.clip(position, 0, len(ranked) - 1)]
        error = np.where(valid, np.minimum(error, np.abs(rest - nearest)), error)
    return float(np.min(error / np.abs(parts)))


def side_passes(side: Support) -> bool:
    if side.n_sources == 0:
        return True
    return side.n_sources >= FLOOR and side.top_share <= MAX_TOP_SHARE and side.rest_share >= MIN_REST_SHARE


@dataclass(frozen=True)
class Cell:
    """A figure as the records behind it. `index` picks records in one record
    space, and `parts` gives what each adds to the figure's total before
    weighting. A share or a mean also names its group. We never publish a cell
    with `published` false: it stands for a figure the published ones could give
    away, such as the number of households whose net income stays the same. A
    part of `tolerance` or less adds to the total but gives the figure no support.
    The published figure times `unit`, and times the group's weight for a share
    or a mean, gives the total; we publish the figure to `decimals` places."""

    space: str
    index: np.ndarray
    parts: np.ndarray
    kind: str = SUM
    group: Optional[np.ndarray] = None
    published: bool = True
    tolerance: float = CHANGE_TOLERANCE
    unit: float = 1.0
    decimals: Optional[int] = None


def change_cell(
    space: str, delta: np.ndarray, mask: Optional[np.ndarray] = None, published: bool = True, unit: float = 1.0
) -> Cell:
    """A sum of a change over the records a mask picks. A change of £1 or less
    adds to the sum but gives it no support."""
    values = np.asarray(delta, dtype=float)
    pick = values != 0
    if mask is not None:
        pick = pick & mask
    index = np.flatnonzero(pick)
    return Cell(space, index, values[index], published=published, unit=unit)


def mean_cell(space: str, delta: np.ndarray, group: np.ndarray, published: bool = True) -> Cell:
    """A mean change over a group."""
    changed = change_cell(space, delta, group)
    return Cell(space, changed.index, changed.parts, kind=MEAN, group=np.flatnonzero(group), published=published)


def level_cell(space: str, values: np.ndarray, mask: Optional[np.ndarray] = None, published: bool = True) -> Cell:
    """A sum of amounts on one side, such as income tax with thresholds frozen.
    Any amount gives it support."""
    values = np.asarray(values, dtype=float)
    pick = values != 0
    if mask is not None:
        pick = pick & mask
    index = np.flatnonzero(pick)
    return Cell(space, index, values[index], published=published, tolerance=0.0)


def count_cell(space: str, mask: np.ndarray, published: bool = True) -> Cell:
    """A count of the records a mask picks, by weight."""
    index = np.flatnonzero(mask)
    return Cell(space, index, np.ones(len(index)), published=published, tolerance=COUNT_TOLERANCE)


def signed_count_cell(space: str, plus: np.ndarray, minus: np.ndarray, published: bool = True) -> Cell:
    """The weighted count of records in `plus`, less those in `minus`."""
    parts = np.asarray(plus, dtype=float) - np.asarray(minus, dtype=float)
    index = np.flatnonzero(parts)
    return Cell(space, index, parts[index], published=published, tolerance=COUNT_TOLERANCE)


def share_cell(space: str, mask: np.ndarray, group: np.ndarray, published: bool = True) -> Cell:
    """The share of a group that a mask picks."""
    index = np.flatnonzero(mask & group)
    return Cell(
        space,
        index,
        np.ones(len(index)),
        kind=SHARE,
        group=np.flatnonzero(group),
        published=published,
        tolerance=COUNT_TOLERANCE,
    )


Spaces = dict  # record space -> (weights, survey household of each record)


def _rest(cell: Cell) -> np.ndarray:
    """The records of a share's group that it does not count."""
    return np.setdiff1d(cell.group, cell.index[np.abs(cell.parts) > cell.tolerance])


def _sides(cell: Cell) -> list:
    """(index, parts, tolerance) for each side of a cell: its records, and for a
    share the rest of its group, as policyengine.disclosure's `family_supports`
    sets them."""
    sides = [(cell.index, cell.parts, cell.tolerance)]
    if cell.kind == SHARE:
        rest = _rest(cell)
        sides.append((rest, np.ones(len(rest)), 0.0))
    return sides


def supports_of(cell: Cell, spaces: Spaces) -> tuple[Support, ...]:
    weights, sources = spaces[cell.space]
    return tuple(
        support(weights[index], parts, sources[index], tolerance) for index, parts, tolerance in _sides(cell)
    )


def passes(sides: tuple[Support, ...]) -> bool:
    return all(side_passes(side) for side in sides)


def approximate(sides: tuple[Support, ...]) -> bool:
    """Whether PolicyEngine's layer would mark the figure approximate: fewer than
    30 effective survey households behind one of its sides."""
    return any(side.n_sources and side.n_eff < APPROXIMATE_BELOW_N_EFF for side in sides)


def total(cell: Cell, spaces: Spaces) -> float:
    """What the cell's records add to, by weight."""
    weights, _ = spaces[cell.space]
    return float(np.dot(weights[cell.index], cell.parts))


def group_weight(cell: Cell, spaces: Spaces) -> float:
    weights, _ = spaces[cell.space]
    return float(weights[cell.group].sum()) if cell.group is not None else 0.0


def denominator(cell: Cell, spaces: Spaces) -> float:
    """What one of the cell's published figures stands for in its total."""
    if cell.kind in (SHARE, MEAN):
        return cell.unit * group_weight(cell, spaces)
    return cell.unit


def figure_of(cell: Cell, spaces: Spaces) -> Optional[float]:
    """The figure the cell's records give, before rounding, or None for a share
    or a mean of an empty group."""
    den = denominator(cell, spaces)
    return total(cell, spaces) / den if den else None


def margin_needed(cell: Cell, spaces: Spaces) -> float:
    """How far a reader's bounds on the cell's total must stay from its true
    value: the largest part of one survey household on each side that fails the
    rules, or 0 when none does."""
    weights, sources = spaces[cell.space]
    margin = 0.0
    for index, parts, tolerance in _sides(cell):
        w, s = weights[index], sources[index]
        if side_passes(support(w, parts, s, tolerance)):
            continue
        contributing = (w > 0) & (np.abs(parts) > tolerance)
        _, household = np.unique(s[contributing], return_inverse=True)
        sizes = np.bincount(household, weights=np.abs(w[contributing] * parts[contributing]))
        margin = max(margin, float(sizes.max(initial=0.0)))
    return margin


def _signed_union(indices: list, signs: list) -> tuple[np.ndarray, np.ndarray]:
    index = np.concatenate(indices) if indices else np.zeros(0, dtype=int)
    parts = np.concatenate(signs) if signs else np.zeros(0)
    index, inverse = np.unique(index, return_inverse=True)
    return index, np.bincount(inverse, weights=parts, minlength=len(index))


def remainder(members: list, cells: dict, published: bool = True, kind: Optional[str] = None) -> Cell:
    """The signed sum of some cells of one link, as one cell. Means add up as
    sums, since their groups' weights stand in the tables. Shares add up as a
    share of their groups, which nest within a link; pass `kind=SUM` to add the
    counts alone, as for two shares whose groups differ."""
    chosen = [(cells[key], sign) for key, sign in members]
    tolerance = max(cell.tolerance for cell, _ in chosen)
    index, parts = _signed_union([cell.index for cell, _ in chosen], [sign * cell.parts for cell, sign in chosen])
    # Parts that cancel leave only floating-point residue.
    keep = np.abs(parts) > 1e-9 * max(1.0, float(np.abs(parts).max(initial=0.0)))
    space = chosen[0][0].space
    if kind is None:
        kind = SHARE if all(cell.kind == SHARE for cell, _ in chosen) else SUM
    if kind == SHARE:
        group, weight = _signed_union(
            [cell.group for cell, _ in chosen], [np.full(len(cell.group), float(sign)) for cell, sign in chosen]
        )
        return Cell(
            space,
            index[keep],
            parts[keep],
            kind=SHARE,
            group=group[np.abs(weight) > 0.5],
            published=published,
            tolerance=tolerance,
        )
    return Cell(space, index[keep], parts[keep], published=published, tolerance=tolerance)


@dataclass(frozen=True)
class Target:
    """A signed sum of withheld cells that fails the rules and that a reader
    could bound: one cell, or the withheld cells of one link. `margin` says how
    far the reader's bounds must stay from its true value."""

    members: tuple
    margin: float


def _signs(link: tuple) -> dict:
    """Each cell's net sign in a link, in a fixed order."""
    signs: dict = {}
    for key, sign in link:
        signs[key] = signs.get(key, 0) + sign
    return {key: signs[key] for key in sorted(signs, key=str) if signs[key]}


def _normalised(members: tuple) -> tuple:
    """A sum and its negative make one target."""
    members = tuple(sorted(members, key=lambda pair: str(pair[0])))
    if members[0][1] < 0:
        members = tuple((key, -sign) for key, sign in members)
    return members


def _wide_enough(distance: float, margin: float) -> bool:
    return distance >= margin * (1 - SOLVER_TOLERANCE) - SOLVER_TOLERANCE


def lowers_without_limit(objective, matrix, bounds) -> bool:
    """Whether the shifts can lower `objective` without limit: some direction
    meets every link and moves each cell only where its bounds leave it no
    limit. We look for one inside a unit box, where HiGHS always finds an
    answer."""
    box = [(-1.0 if low is None else 0.0, 1.0 if high is None else 0.0) for low, high in bounds]
    result = linprog(objective, A_eq=matrix, b_eq=np.zeros(matrix.shape[0]), bounds=box, method="highs")
    if result.status != 0:
        raise DisclosureError(f"the reader's direction programme failed: {result.message}")
    return float(result.fun) < -SOLVER_TOLERANCE


class Reader:
    """What a reader can work out from the figures we publish. `figures` holds
    each published figure as we print it, rounded, or None when it stays blank
    because its group is empty.

    We write each cell's total as its true value plus an unknown shift. Every
    link holds for the true values, so the shifts of its cells cancel too. A
    published figure confines its cell's shift to the interval its rounding
    leaves, intersected with what the reader knows without it: the cell's sign,
    when all its parts share one, and for a share that it cannot exceed its
    group. The reader's tightest bounds on a signed sum of cells are then the
    least and greatest shift a linear programme finds for it."""

    def __init__(self, cells: dict, links: list, spaces: Spaces, figures: dict):
        for link in links:
            for key, _ in link:
                if key not in cells:
                    raise KeyError(f"link member {key} has no cell")
        self.cells, self.spaces = cells, spaces
        # In a fixed order, so the same figures give the same result.
        self.links = sorted({tuple(link) for link in links}, key=str)
        self.signs = [_signs(link) for link in self.links]
        self.sides = {key: supports_of(cell, spaces) for key, cell in cells.items()}
        self.ok = {key: passes(sides) for key, sides in self.sides.items()}
        self.keys = sorted({key for signs in self.signs for key in signs}, key=str)
        self.column = {key: i for i, key in enumerate(self.keys)}
        self.value = np.array([total(cells[key], spaces) for key in self.keys])
        rows, columns, entries = [], [], []
        for r, signs in enumerate(self.signs):
            for key, sign in signs.items():
                rows.append(r)
                columns.append(self.column[key])
                entries.append(float(sign))
        matrix = csr_matrix((entries, (rows, columns)), shape=(len(self.links), len(self.keys)))
        residual = np.abs(matrix @ self.value)
        scale = abs(matrix) @ np.abs(self.value)
        for r in np.flatnonzero(residual > LINK_TOLERANCE * scale + LINK_TOLERANCE):
            raise DisclosureError(f"the figures of link {self.links[r]} do not add up")
        self.hidden_bounds = np.array([self._known(key) for key in self.keys]).reshape(-1, 2)
        self.shown_bounds = np.array(
            [self._published(key, figures) if cells[key].published else self._known(key) for key in self.keys]
        ).reshape(-1, 2)
        self._components(matrix)
        self._margins: dict = {}
        self._remainders: dict = {}

    def _known(self, key) -> tuple[float, float]:
        """The shifts a reader allows a cell without its published figure."""
        cell = self.cells[key]
        value = self.value[self.column[key]]
        low, high = -math.inf, math.inf
        parts = cell.parts
        if not len(parts) or parts.min() >= 0:
            low = 0.0
        if not len(parts) or parts.max() <= 0:
            high = 0.0
        is_share = cell.kind == SHARE and cell.group is not None and len(cell.group)
        if is_share and len(parts) and parts.min() >= 0 and parts.max() <= 1:
            high = min(high, group_weight(cell, self.spaces))
        return min(low - value, 0.0), max(high - value, 0.0)

    def _published(self, key, figures: dict) -> tuple[float, float]:
        """The shifts a reader allows a cell once we publish its figure."""
        cell = self.cells[key]
        if key not in figures:
            raise KeyError(f"no published figure for {key}")
        if cell.decimals is None:
            raise DisclosureError(f"no rounding set for {key}")
        value = self.value[self.column[key]]
        figure = figures[key]
        if figure is None:
            low = high = 0.0
        else:
            den = denominator(cell, self.spaces)
            half = 0.5 * 10.0 ** (-cell.decimals)
            low, high = sorted(((figure - half) * den, (figure + half) * den))
        slack = 1e-9 * max(1.0, abs(value), abs(low), abs(high))
        if not low - slack <= value <= high + slack:
            raise DisclosureError(f"the published figure for {key} does not match its records")
        known_low, known_high = self._known(key)
        return min(max(low - value, known_low), 0.0), max(min(high - value, known_high), 0.0)

    def _components(self, matrix) -> None:
        """Cells that share links, directly or through other cells, with those
        links: a reader's bounds on one cell draw on its component alone."""
        parent = list(range(len(self.keys)))

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        for signs in self.signs:
            columns = [self.column[key] for key in signs]
            for other in columns[1:]:
                a, b = find(columns[0]), find(other)
                if a != b:
                    parent[max(a, b)] = min(a, b)
        self.root = np.array([find(i) for i in range(len(self.keys))], dtype=int)
        rows_of: dict = {}
        for r, signs in enumerate(self.signs):
            if signs:
                rows_of.setdefault(int(self.root[self.column[next(iter(signs))]]), []).append(r)
        self.component = {}
        for root, rows in rows_of.items():
            columns = np.flatnonzero(self.root == root)
            self.component[root] = (
                columns,
                matrix[rows][:, columns].tocsr(),
                {int(c): j for j, c in enumerate(columns)},
            )

    def margin(self, key) -> float:
        if key not in self._margins:
            self._margins[key] = margin_needed(self.cells[key], self.spaces)
        return self._margins[key]

    def targets(self, hidden: set) -> list:
        """Each withheld cell that fails the rules and sits in a link, then the
        withheld cells of each link that also shows a figure, where together
        they fail the rules."""
        found = [Target(((key, 1),), self.margin(key)) for key in self.keys if key in hidden and not self.ok[key]]
        for signs in self.signs:
            members = tuple((key, sign) for key, sign in signs.items() if key in hidden)
            if len(members) < 2 or len(members) == len(signs):
                continue
            members = _normalised(members)
            if members not in self._remainders:
                cell = remainder(list(members), self.cells)
                ok = passes(supports_of(cell, self.spaces))
                self._remainders[members] = None if ok else margin_needed(cell, self.spaces)
            if self._remainders[members] is not None:
                found.append(Target(members, self._remainders[members]))
        return list(dict.fromkeys(found))

    def reach(self, members: tuple, hidden: set) -> tuple[float, float, list, list]:
        """How far below and above its true value a reader can push a signed sum
        of cells, and the shown cells whose rounding stops it on each side."""
        roots = {int(self.root[self.column[key]]) for key, _ in members}
        if len(roots) != 1:
            raise ValueError(f"{members} span cells that share no link")
        columns, matrix, local = self.component[roots.pop()]
        objective = np.zeros(len(columns))
        for key, sign in members:
            objective[local[self.column[key]]] += sign
        withheld = np.array([self.keys[c] in hidden for c in columns])
        bounds = np.where(withheld[:, None], self.hidden_bounds[columns], self.shown_bounds[columns])
        bounds = [(None if math.isinf(low) else low, None if math.isinf(high) else high) for low, high in bounds]
        below, low_binding = self._furthest(objective, matrix, bounds, withheld, columns)
        above, high_binding = self._furthest(-objective, matrix, bounds, withheld, columns)
        return below, above, low_binding, high_binding

    def _furthest(self, objective, matrix, bounds, withheld, columns) -> tuple[float, list]:
        """How far the reader can lower `objective` from zero, and the shown
        cells whose bounds hold it there. Zero shifts meet every link and bound,
        so the programme always has a solution. HiGHS can call an unbounded
        programme infeasible, so we accept either verdict only when a direction
        the links and bounds allow lowers the objective without limit."""
        result = linprog(objective, A_eq=matrix, b_eq=np.zeros(matrix.shape[0]), bounds=bounds, method="highs")
        if result.status in (2, 3):
            if lowers_without_limit(objective, matrix, bounds):
                return math.inf, []
            raise DisclosureError(f"the reader's linear programme failed: {result.message}")
        if result.status != 0:
            raise DisclosureError(f"the reader's linear programme failed: {result.message}")
        pressure = np.abs(result.lower.marginals) + np.abs(result.upper.marginals)
        binding = [self.keys[columns[j]] for j in np.flatnonzero((pressure > 1e-9) & ~withheld)]
        return max(0.0, -float(result.fun)), binding

    def covers(self, target: Target, hidden: set) -> bool:
        below, above, _, _ = self.reach(target.members, hidden)
        return _wide_enough(below, target.margin) and _wide_enough(above, target.margin)

    def first_problem(self, hidden: set, covered: set) -> Optional[tuple]:
        """The first target a reader can bound too closely, with the shown cells
        that stop the reader's bounds on each side that falls short. `covered`
        holds targets already wide enough: withholding more only widens bounds."""
        for target in self.targets(hidden):
            if target in covered:
                continue
            below, above, low, high = self.reach(target.members, hidden)
            short_below = not _wide_enough(below, target.margin)
            short_above = not _wide_enough(above, target.margin)
            if not (short_below or short_above):
                covered.add(target)
                continue
            return target, (low if short_below else []) + (high if short_above else [])
        return None

    def shown_beside(self, target: Target, hidden: set) -> list:
        """Every shown cell that shares links with a target."""
        columns, _, _ = self.component[int(self.root[self.column[target.members[0][0]]])]
        return [self.keys[c] for c in columns if self.keys[c] not in hidden]


def choose(reader: Reader, first=(), rank=None) -> set:
    """Every cell a reader does not see: those we never publish, and the
    published ones we leave blank.

    We first withhold each cell that fails the rules, and the cells in `first`.
    Then, while a reader can bound a target too closely, we withhold one more
    shown cell whose rounding stops the reader's bounds: the first, in order,
    that widens them enough, or, if none does alone, the first. We order the
    cells by `rank`, lowest first, and then by the number of survey households
    behind them, fewest first. A figure with no records behind it comes after
    the rest, since a reader may know it is zero."""
    cells = reader.cells
    hidden = {key for key, cell in cells.items() if not cell.published or not reader.ok[key]} | set(first)
    rank = rank or (lambda key: 0)
    size = lambda key: (
        reader.sides[key][0].n_sources == 0,
        rank(key),
        reader.sides[key][0].n_sources,
        str(key),
    )
    covered: set = set()
    while True:
        problem = reader.first_problem(hidden, covered)
        if problem is None:
            break
        target, binding = problem
        options = sorted(set(binding), key=size) or sorted(reader.shown_beside(target, hidden), key=size)
        if not options:
            raise DisclosureError(f"no published figure left to withhold for {target.members}")
        choice = next((key for key in options if reader.covers(target, hidden | {key})), options[0])
        hidden.add(choice)
    audit(reader, hidden)
    return hidden


def withhold(cells: dict, links: list, spaces: Spaces, figures: dict, first=(), rank=None) -> tuple[set, dict]:
    """The published cells to leave blank, and every cell's supports."""
    reader = Reader(cells, links, spaces, figures)
    hidden = choose(reader, first, rank)
    return {key for key in hidden if cells[key].published}, reader.sides


def audit(reader: Reader, hidden: set) -> None:
    """Fail unless every shown cell passes the rules and the reader's bounds on
    every target stay wide enough, each checked again from scratch."""
    for key in reader.cells:
        if key not in hidden and not reader.ok[key]:
            raise DisclosureError(f"{key} fails the rules but stays shown")
    for target in reader.targets(hidden):
        if not reader.covers(target, hidden):
            raise DisclosureError(f"a reader can bound {target.members} too closely")


def protection(reader: Reader, hidden: set) -> list:
    """Each target with the reader's furthest shifts below and above its true
    value and the margin it needs. The margins come from single households, so
    the result stays private."""
    rows = []
    for target in reader.targets(hidden):
        below, above, _, _ = reader.reach(target.members, hidden)
        rows.append(
            {
                "members": [["|".join(map(str, key)), sign] for key, sign in target.members],
                "margin": target.margin,
                "below": None if math.isinf(below) else below,
                "above": None if math.isinf(above) else above,
            }
        )
    return rows
