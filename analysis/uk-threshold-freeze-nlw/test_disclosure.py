"""Properties of disclosure.py on made-up records.

    pytest analysis/uk-threshold-freeze-nlw/test_disclosure.py

Needs numpy, scipy and hypothesis. Runs no model code and reads no microdata.
"""

import itertools
import math
from dataclasses import replace

import numpy as np
import pytest
from hypothesis import HealthCheck, assume, given, settings
from hypothesis import strategies as st
from scipy.optimize import linprog

import disclosure
from disclosure import (
    FLOOR,
    MAX_TOP_SHARE,
    MIN_REST_SHARE,
    SHARE,
    DisclosureError,
    Reader,
    Support,
    change_cell,
    count_cell,
    figure_of,
    margin_needed,
    mean_cell,
    passes,
    remainder,
    rest_share,
    share_cell,
    side_passes,
    support,
    supports_of,
    withhold,
)

SPACE = "records"


def brute_support(weights, contributions, sources, tolerance=0.0) -> Support:
    """support() spelled out one survey household at a time."""
    parts = {}
    for w, c, s in zip(weights, contributions, sources):
        if w > 0 and abs(c) > tolerance:
            weight, magnitude, signed = parts.get(s, (0.0, 0.0, 0.0))
            parts[s] = (weight + w, magnitude + abs(w * c), signed + w * c)
    if not parts:
        return disclosure.NO_SUPPORT
    weight = np.array([p[0] for p in parts.values()])
    magnitude = np.array([p[1] for p in parts.values()])
    signed = np.array([p[2] for p in parts.values()])
    return Support(
        len(parts),
        float(weight.sum() ** 2 / (weight**2).sum()),
        float(magnitude.max() / magnitude.sum()),
        brute_rest_share(signed),
    )


def brute_rest_share(signed) -> float:
    """For each household i, the error of a reader who knows the total, and of
    each other household j that also knows its own part, as a share of |c_i|."""
    parts = [c for c in signed if c != 0]
    if not parts:
        return math.inf
    total = float(np.sum(signed))
    best = math.inf
    for i, c in enumerate(parts):
        rest = total - c
        errors = [abs(rest)] + [abs(rest - other) for j, other in enumerate(parts) if j != i]
        best = min(best, min(errors) / abs(c))
    return best


records = st.integers(1, 40).flatmap(
    lambda n: st.tuples(
        st.lists(st.sampled_from([0.0, 0.5, 1.0, 2.0, 7.5]), min_size=n, max_size=n),
        st.lists(st.integers(-4, 4).map(float), min_size=n, max_size=n),
        st.lists(st.integers(0, 12), min_size=n, max_size=n),
    )
)


@settings(deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(records, st.sampled_from([0.0, 0.5, 1.0, 2.5]))
def test_support_matches_one_household_at_a_time(data, tolerance):
    weights, contributions, sources = (np.array(x, dtype=float) for x in data)
    got = support(weights, contributions, sources, tolerance)
    want = brute_support(weights, contributions, sources, tolerance)
    assert got.n_sources == want.n_sources
    for a, b in zip(got[1:], want[1:]):
        assert a == pytest.approx(b, rel=1e-9, abs=1e-12)


@pytest.fixture(scope="module")
def layer():
    return pytest.importorskip("policyengine.disclosure.support")


@settings(deadline=None)
@given(data=records)
def test_support_matches_policyengine(layer, data):
    weights, contributions, sources = (np.array(x, dtype=float) for x in data)
    got = support(weights, contributions, sources)
    want = layer.support(weights, contributions, sources.astype(int))
    assert got.n_sources == want.n_sources
    for a, b in zip(got[1:], want[1:]):
        assert a == pytest.approx(b, rel=1e-12, abs=1e-12)


@settings(deadline=None)
@given(data=records)
def test_a_tolerance_matches_policyengine_on_changes_it_sets_to_zero(layer, data):
    """PolicyEngine's layer sets each change of £1 or less to zero before it
    counts support. Leaving the change in and passing the tolerance counts the
    same households."""
    weights, contributions, sources = (np.array(x, dtype=float) for x in data)
    got = support(weights, contributions, sources, disclosure.CHANGE_TOLERANCE)
    zeroed = np.where(np.abs(contributions) > disclosure.CHANGE_TOLERANCE, contributions, 0.0)
    want = layer.support(weights, zeroed, sources.astype(int))
    assert got.n_sources == want.n_sources
    for a, b in zip(got[1:], want[1:]):
        assert a == pytest.approx(b, rel=1e-12, abs=1e-12)


@settings(deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(st.lists(st.integers(-50, 50).map(float), max_size=12))
def test_rest_share_matches_every_attacker(parts):
    assert rest_share(np.array(parts)) == pytest.approx(brute_rest_share(parts), rel=1e-12)


def test_rest_share_of_one_household_is_zero():
    assert rest_share(np.array([0.0, 40.0, 0.0])) == 0


def test_a_side_needs_ten_households_none_holding_half_and_the_p_percent_rule():
    assert side_passes(disclosure.NO_SUPPORT)
    assert not side_passes(Support(FLOOR - 1, 9.0, 0.2, 5.0))
    assert side_passes(Support(FLOOR, 10.0, MAX_TOP_SHARE, MIN_REST_SHARE))
    assert not side_passes(Support(FLOOR, 10.0, MAX_TOP_SHARE + 0.01, 5.0))
    assert not side_passes(Support(FLOOR, 10.0, 0.2, MIN_REST_SHARE - 0.01))


def test_a_figure_on_fewer_than_30_effective_households_is_approximate():
    assert not disclosure.approximate((disclosure.NO_SUPPORT,))
    assert disclosure.approximate((Support(40, 29.9, 0.1, 5.0),))
    assert not disclosure.approximate((Support(40, 30.0, 0.1, 5.0),))
    # A share is as rough as its rougher side.
    assert disclosure.approximate((Support(40, 35.0, 0.1, 5.0), Support(12, 12.0, 0.1, 5.0)))


sides = st.lists(
    st.builds(
        Support,
        st.integers(0, 60),
        st.floats(0, 60, allow_nan=False),
        st.floats(0, 1, allow_nan=False),
        st.one_of(st.just(math.inf), st.floats(0, 2, allow_nan=False)),
    ),
    min_size=1,
    max_size=2,
)


@settings(deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(sides)
def test_passes_and_approximate_match_policyengines_tiers(layer, cell_sides):
    """Each record of a national figure sits in one area, the UK, so the layer's
    floor on effective households does not apply."""
    schema = pytest.importorskip("policyengine.disclosure.schema")
    theirs = tuple(layer.Support(*side) for side in cell_sides)
    tier, _ = layer.cell_tier(theirs, schema.DisclosureSettings(), one_area_per_record=True, noise=False)
    assert passes(tuple(cell_sides)) == (tier != schema.WITHHELD)
    if tier != schema.WITHHELD:
        assert disclosure.approximate(tuple(cell_sides)) == (tier == schema.APPROXIMATE)


def spaces_for(sources, weights=None):
    sources = np.asarray(sources, dtype=float)
    weights = np.ones(len(sources)) if weights is None else np.asarray(weights, dtype=float)
    return {SPACE: (weights, sources)}


def publish(cells: dict, spaces: dict, decimals: int) -> tuple[dict, dict]:
    """Each published cell rounded to `decimals` places, and its figure."""
    cells = {key: replace(cell, decimals=decimals) if cell.published else cell for key, cell in cells.items()}
    figures = {}
    for key, cell in cells.items():
        if cell.published:
            value = figure_of(cell, spaces)
            figures[key] = None if value is None else round(value, decimals)
    return cells, figures


def test_a_change_of_1_or_less_adds_to_the_total_but_gives_no_support():
    delta = np.array([0.5, -1.0, 1.5, -3.0, 0.0])
    cell = change_cell(SPACE, delta)
    assert cell.index.tolist() == [0, 1, 2, 3]
    spaces = spaces_for(np.arange(5))
    assert disclosure.total(cell, spaces) == pytest.approx(-2.0)
    (side,) = supports_of(cell, spaces)
    assert side.n_sources == 2


def test_copies_of_one_survey_household_count_once():
    sources = np.repeat(np.arange(FLOOR - 1), 3)
    cell = count_cell(SPACE, np.ones(len(sources), dtype=bool))
    (side,) = supports_of(cell, spaces_for(sources))
    assert side.n_sources == FLOOR - 1
    assert not passes((side,))


def test_a_share_fails_when_the_rest_of_its_group_is_thin():
    sources = np.arange(40)
    group = np.ones(40, dtype=bool)
    mostly = np.arange(40) >= 3
    sides = supports_of(share_cell(SPACE, mostly, group), spaces_for(sources))
    assert sides[0].n_sources == 37 and sides[1].n_sources == 3
    assert not passes(sides)


def test_a_mean_rests_on_its_change_alone():
    sources = np.arange(5)
    group = np.ones(5, dtype=bool)
    nothing_moves = mean_cell(SPACE, np.zeros(5), group)
    assert passes(supports_of(nothing_moves, spaces_for(sources)))
    one_moves = mean_cell(SPACE, np.array([0.0, 0.0, 9.0, 0.0, 0.0]), group)
    assert not passes(supports_of(one_moves, spaces_for(sources)))


def test_a_remainder_adds_signed_parts_and_drops_what_cancels():
    cells = {
        "a": change_cell(SPACE, np.array([5.0, 3.0, 0.0])),
        "b": change_cell(SPACE, np.array([5.0, 0.0, 4.0])),
    }
    rest = remainder([("a", 1), ("b", -1)], cells)
    assert rest.index.tolist() == [1, 2]
    assert rest.parts.tolist() == [3.0, -4.0]


def test_a_remainder_takes_the_largest_tolerance_of_its_cells():
    """The stricter choice: a record that adds £1 or less to a remainder of a
    change and a sum of amounts gives it no support, as it gives the change
    none."""
    cells = {
        "change": change_cell(SPACE, np.array([0.0, 0.0, 3.0])),
        "amounts": disclosure.level_cell(SPACE, np.array([0.5, 40.0, 0.0])),
    }
    both = remainder([("change", 1), ("amounts", 1)], cells)
    assert both.tolerance == disclosure.CHANGE_TOLERANCE


def test_a_remainder_of_shares_keeps_the_rest_of_their_groups():
    group = np.array([True, True, True, True, False, False])
    other = ~group
    mask = np.array([True, False, False, False, True, True])
    cells = {"in": share_cell(SPACE, mask, group), "out": share_cell(SPACE, mask, other)}
    both = remainder([("in", 1), ("out", 1)], cells)
    assert both.kind == SHARE
    assert both.group.tolist() == list(range(6))
    assert both.index.tolist() == [0, 4, 5]


def test_the_margin_is_the_largest_household_part_on_a_failing_side():
    sources = np.array([0, 0, 1, 2] + list(range(3, 40)))
    weights = np.ones(len(sources))
    weights[0] = 4.0
    values = np.zeros(len(sources))
    values[:4] = [3.0, 2.0, 5.0, 1.0]
    spaces = spaces_for(sources, weights)
    # Two survey households count, since a change of £1 gives no support. The
    # first holds 4 * 3 + 2 = 14.
    assert margin_needed(change_cell(SPACE, values), spaces) == pytest.approx(14.0)
    # Forty households, none holding half, pass, so need no margin.
    assert margin_needed(count_cell(SPACE, np.ones(len(sources), dtype=bool)), spaces) == 0
    # A share whose rest is thin needs the rest's largest household.
    group = np.ones(len(sources), dtype=bool)
    most = np.arange(len(sources)) >= 4
    assert margin_needed(share_cell(SPACE, most, group), spaces) == pytest.approx(5.0)


def one_link(decimals: int):
    """a = b + c, with c on three survey households."""
    values_b = np.zeros(23)
    values_b[:20] = 2.0
    values_c = np.zeros(23)
    values_c[20:] = 7.0
    spaces = spaces_for(np.arange(23))
    cells = {
        "a": change_cell(SPACE, values_b + values_c),
        "b": change_cell(SPACE, values_b),
        "c": change_cell(SPACE, values_c),
    }
    cells, figures = publish(cells, spaces, decimals)
    return cells, [(("a", 1), ("b", -1), ("c", -1))], spaces, figures


def test_a_reader_bounds_a_withheld_figure_by_the_rounding_of_its_link():
    """a is 61 and b is 40, published to the nearest 10 as 60 and 40, so the
    reader puts a between 55 and 65, b between 35 and 45, and c = a - b between
    10 and 30: 11 below its true 21 and 9 above."""
    cells, links, spaces, figures = one_link(decimals=-1)
    reader = Reader(cells, links, spaces, figures)
    below, above, low, high = reader.reach((("c", 1),), {"c"})
    assert (below, above) == (pytest.approx(11.0), pytest.approx(9.0))
    assert set(low) == set(high) == {"a", "b"}
    # c rests on three households, the largest holding 7, and the rounding
    # leaves the reader more than 7 either side.
    (target,) = reader.targets({"c"})
    assert target.margin == 7.0 and reader.covers(target, {"c"})
    assert withhold(cells, links, spaces, figures)[0] == {"c"}


def test_finer_rounding_takes_a_second_figure_with_it():
    cells, links, spaces, figures = one_link(decimals=0)
    withheld, _ = withhold(cells, links, spaces, figures)
    # b rests on fewer households than a.
    assert withheld == {"b", "c"}
    reader = Reader(cells, links, spaces, figures)
    below, above, _, _ = reader.reach((("c", 1),), withheld)
    # Without b the reader knows only that b, and so c, is not negative.
    assert below == pytest.approx(21.0) and above >= 40


def test_a_rank_keeps_the_figure_we_would_rather_show():
    """Withholding a or b each keeps c out of reach, so a rank that puts a first
    takes a and leaves b, though b rests on fewer households."""
    cells, links, spaces, figures = one_link(decimals=0)
    withheld, _ = withhold(cells, links, spaces, figures, rank=lambda key: 0 if key == "a" else 1)
    assert withheld == {"a", "c"}
    reader = Reader(cells, links, spaces, figures)
    assert all(reader.covers(target, withheld) for target in reader.targets(withheld))


def unbounded_as_infeasible(real):
    """linprog as HiGHS sometimes answers: an unbounded programme comes back
    infeasible."""

    def solve(*args, **kwargs):
        result = real(*args, **kwargs)
        if result.status == 3:
            result.status, result.message = 2, "The problem is infeasible."
        return result

    return solve


def test_an_unbounded_side_called_infeasible_still_gives_no_bound(monkeypatch):
    """With a, b and c all withheld, the reader knows only that each is not
    negative, so c = a - b has no upper limit. If HiGHS calls that side
    infeasible, a direction without limit still settles it."""
    cells, links, spaces, figures = one_link(decimals=-1)
    reader = Reader(cells, links, spaces, figures)
    hidden = {"a", "b", "c"}
    below, above, _, _ = reader.reach((("c", 1),), hidden)
    assert below == pytest.approx(21.0) and math.isinf(above)
    monkeypatch.setattr(disclosure, "linprog", unbounded_as_infeasible(disclosure.linprog))
    assert reader.reach((("c", 1),), hidden)[:2] == (below, above)


def test_a_bounded_side_called_infeasible_fails(monkeypatch):
    """With a and b shown, c has a limit on each side, so no direction backs an
    infeasible verdict, and the reader stops."""
    cells, links, spaces, figures = one_link(decimals=-1)
    reader = Reader(cells, links, spaces, figures)
    real, calls = disclosure.linprog, []

    def first_call_infeasible(*args, **kwargs):
        result = real(*args, **kwargs)
        calls.append(result.status)
        if len(calls) == 1:
            result.status, result.message = 2, "The problem is infeasible."
        return result

    monkeypatch.setattr(disclosure, "linprog", first_call_infeasible)
    with pytest.raises(DisclosureError, match="linear programme failed"):
        reader.reach((("c", 1),), {"c"})
    assert calls == [0, 0]


@settings(deadline=None, max_examples=60)
@given(
    signs=st.lists(st.sampled_from([-1, 1]), min_size=2, max_size=6),
    lows=st.lists(st.one_of(st.none(), st.floats(-5, 0)), min_size=6, max_size=6),
    highs=st.lists(st.one_of(st.none(), st.floats(0, 5)), min_size=6, max_size=6),
    target=st.integers(0, 5),
)
def test_a_direction_without_limit_matches_highs_on_an_unbounded_answer(signs, lows, highs, target):
    """On one link, the direction check finds no limit exactly when HiGHS solves
    the programme as unbounded."""
    n = len(signs)
    assume(target < n)
    from scipy.sparse import csr_matrix

    matrix = csr_matrix(np.array([signs], dtype=float))
    bounds = list(zip(lows[:n], highs[:n]))
    objective = np.zeros(n)
    objective[target] = 1.0
    result = disclosure.linprog(objective, A_eq=matrix, b_eq=[0.0], bounds=bounds, method="highs")
    assume(result.status in (0, 3))
    assert disclosure.lowers_without_limit(objective, matrix, bounds) == (result.status == 3)


def test_a_published_figure_must_match_its_records():
    cells, links, spaces, figures = one_link(decimals=0)
    with pytest.raises(DisclosureError):
        Reader(cells, links, spaces, {**figures, "a": figures["a"] + 2})


def test_a_link_must_add_up():
    cells, _, spaces, figures = one_link(decimals=0)
    with pytest.raises(DisclosureError):
        Reader(cells, [(("a", 1), ("b", -1))], spaces, figures)


def test_a_link_to_a_missing_cell_or_figure_fails_loudly():
    cells, links, spaces, figures = one_link(decimals=0)
    with pytest.raises(KeyError):
        withhold(cells, [*links, (("a", 1), ("d", -1))], spaces, figures)
    with pytest.raises(KeyError):
        withhold(cells, links, spaces, {"a": figures["a"], "c": figures["c"]})


def test_a_share_stays_between_none_and_all_of_its_group():
    """Two shares of one group and its size: withholding both leaves the reader
    only that each lies between none and all of the group."""
    sources = np.arange(40)
    group = np.ones(40, dtype=bool)
    few = np.arange(40) < 3
    cells = {
        "few": share_cell(SPACE, few, group),
        "rest": share_cell(SPACE, ~few, group),
        "all": count_cell(SPACE, group),
    }
    spaces = spaces_for(sources)
    cells, figures = publish(cells, spaces, 3)
    reader = Reader(cells, [(("few", 1), ("rest", 1), ("all", -1))], spaces, figures)
    below, above, _, _ = reader.reach((("few", 1),), {"few", "rest"})
    assert (below, above) == (pytest.approx(3.0), pytest.approx(37.0))


def test_a_share_stays_within_its_group_when_its_group_size_is_withheld_too():
    """The link few + rest = all bounds neither share once we withhold all three,
    so only the group caps them: few lies between none and all of the group.
    Each of the 40 records weighs 2, so the cap is the group's weight, 80, not
    its number of records."""
    sources = np.arange(40)
    group = np.ones(40, dtype=bool)
    few = np.arange(40) < 3
    cells = {
        "few": share_cell(SPACE, few, group),
        "rest": share_cell(SPACE, ~few, group),
        "all": count_cell(SPACE, group),
    }
    spaces = spaces_for(sources, np.full(40, 2.0))
    cells, figures = publish(cells, spaces, 3)
    reader = Reader(cells, [(("few", 1), ("rest", 1), ("all", -1))], spaces, figures)
    below, above, _, _ = reader.reach((("few", 1),), {"few", "rest", "all"})
    assert (below, above) == (pytest.approx(6.0), pytest.approx(74.0))


def test_a_reader_keeps_the_sign_of_a_figure_that_rounds_to_zero():
    """T = A + B. A adds up changes that never fall below zero and rounds to 0 at
    the nearest 100, so a reader knows it lies between 0 and 50, and with T
    published, that B lies between T - 50 and T."""
    a = np.where(np.arange(30) < 20, 2.0, 0.0)
    b = np.where(np.arange(30) >= 20, 15.0, 0.0)
    cells = {"A": change_cell(SPACE, a), "B": change_cell(SPACE, b), "T": change_cell(SPACE, a + b)}
    cells = {key: replace(cell, decimals=-2 if key == "A" else 3) for key, cell in cells.items()}
    figures = {"A": 0.0, "B": 150.0, "T": 190.0}
    reader = Reader(cells, [(("T", 1), ("A", -1), ("B", -1))], spaces_for(np.arange(30)), figures)
    assert reader.shown_bounds[reader.column["A"]].tolist() == [pytest.approx(-40.0), pytest.approx(10.0)]
    below, above, _, _ = reader.reach((("B", 1),), {"B"})
    assert below == pytest.approx(10.0, abs=1e-3)
    assert above == pytest.approx(40.0, abs=1e-3)


def grid(rows, columns, values, cell_of, sources, weights=None, decimals=6):
    """A table of sums with row, column and grand totals, all published, and the
    links among them."""
    values = np.asarray(values, dtype=float)
    cells = {}
    row_of, column_of = cell_of
    for r in range(rows):
        for c in range(columns):
            cells[(r, c)] = change_cell(SPACE, values, (row_of == r) & (column_of == c))
        cells[(r, "total")] = change_cell(SPACE, values, row_of == r)
    for c in range(columns):
        cells[("total", c)] = change_cell(SPACE, values, column_of == c)
    cells[("total", "total")] = change_cell(SPACE, values)
    links = [((((r, "total"), 1),) + tuple(((r, c), -1) for c in range(columns))) for r in range(rows)]
    links += [((("total", c), 1),) + tuple(((r, c), -1) for r in range(rows)) for c in range(columns)]
    links.append(((("total", "total"), 1),) + tuple((("total", c), -1) for c in range(columns)))
    links.append(((("total", "total"), 1),) + tuple(((r, "total"), -1) for r in range(rows)))
    spaces = spaces_for(sources, weights)
    cells, figures = publish(cells, spaces, decimals)
    return cells, links, spaces, figures


def check_withheld(cells, links, spaces, figures, withheld):
    """What withhold() promises."""
    reader = Reader(cells, links, spaces, figures)
    hidden = {key for key, cell in cells.items() if not cell.published} | withheld
    for key, cell in cells.items():
        if cell.published and key not in withheld:
            assert reader.ok[key], key
    for target in reader.targets(hidden):
        below, above, _, _ = reader.reach(target.members, hidden)
        assert min(below, above) >= target.margin * (1 - 1e-6) - 1e-6, target
    # Withholding again from what we publish withholds nothing more.
    again = {key: replace(cell, published=False) if key in withheld else cell for key, cell in cells.items()}
    assert withhold(again, links, spaces, figures)[0] == set()


def test_two_withheld_parts_that_fail_together_become_a_target():
    """T = A + B + C. A fails on its own and B passes, but one household holds most
    of A + B. With A and B withheld and T and C shown, a reader gets A + B from
    T - C, so the reader protects A + B as well, and the audit fails until we
    withhold more."""
    values = np.concatenate([[1_000.0, 5.0, 5.0], np.full(30, 10.0), np.full(100, 20.0)])
    part = np.repeat(np.array(["a", "b", "c"]), [3, 30, 100])
    cells = {("part", name): change_cell(SPACE, values, part == name) for name in "abc"}
    cells[("part", "total")] = change_cell(SPACE, values)
    links = [((("part", "total"), 1), (("part", "a"), -1), (("part", "b"), -1), (("part", "c"), -1))]
    spaces = spaces_for(np.arange(len(values)))
    cells, figures = publish(cells, spaces, decimals=6)
    reader = Reader(cells, links, spaces, figures)
    a, b = ("part", "a"), ("part", "b")
    assert not reader.ok[a] and all(reader.ok[("part", name)] for name in ("b", "c", "total"))
    assert not passes(supports_of(remainder([(a, 1), (b, 1)], cells), spaces))
    together = [target for target in reader.targets({a, b}) if {key for key, _ in target.members} == {a, b}]
    assert together
    with pytest.raises(DisclosureError):
        disclosure.audit(reader, {a, b})
    withheld, _ = withhold(cells, links, spaces, figures)
    assert a in withheld
    check_withheld(cells, links, spaces, figures, withheld)


def test_parts_of_opposite_signs_that_fail_together_become_a_target():
    """T = A - B + C. A, B and A + B each rest on at least 19 households, but A - B
    rests on one. With A and B withheld, T and C give A - B away, so one of them
    goes blank too."""
    index = np.arange(40)
    a = np.where(index < 20, 10.0, 0.0)
    b = np.where((index >= 1) & (index < 20), 10.0, 0.0)
    c = np.where(index >= 20, 10.0, 0.0)
    cells = {
        "A": change_cell(SPACE, a),
        "B": change_cell(SPACE, b),
        "C": change_cell(SPACE, c),
        "T": change_cell(SPACE, a - b + c),
    }
    spaces = spaces_for(index)
    cells, figures = publish(cells, spaces, 6)
    links = [(("T", 1), ("A", -1), ("B", 1), ("C", -1))]
    assert all(passes(supports_of(cell, spaces)) for cell in cells.values())
    assert passes(supports_of(remainder([("A", 1), ("B", 1)], cells), spaces))
    assert not passes(supports_of(remainder([("A", 1), ("B", -1)], cells), spaces))
    withheld, _ = withhold(cells, links, spaces, figures, first={"A", "B"})
    assert {"A", "B"} <= withheld and withheld & {"T", "C"}
    check_withheld(cells, links, spaces, figures, withheld)


def corner_table(decimals: int):
    """Three rows and three columns. Thirty survey households stand in each cell
    but the corner, which holds three."""
    rows = columns = 3
    sizes = {(r, c): 30 for r in range(rows) for c in range(columns)}
    sizes[(0, 0)] = 3
    row_of = np.concatenate([np.full(n, r) for (r, c), n in sizes.items()])
    column_of = np.concatenate([np.full(n, c) for (r, c), n in sizes.items()])
    values = np.random.default_rng(0).uniform(10, 20, len(row_of))
    return grid(rows, columns, values, (row_of, column_of), np.arange(len(row_of)), decimals=decimals)


def test_one_thin_cell_with_fine_rounding_takes_a_rectangle_with_it():
    cells, links, spaces, figures = corner_table(decimals=6)
    withheld, _ = withhold(cells, links, spaces, figures)
    assert (0, 0) in withheld
    interior = {key for key in withheld if "total" not in key}
    # The corner, one more cell in its row and in its column, and the cell where
    # they cross.
    assert len(interior) == 4
    assert len({r for r, _ in interior}) == len({c for _, c in interior}) == 2
    check_withheld(cells, links, spaces, figures, withheld)


def test_one_thin_cell_with_coarse_rounding_goes_alone():
    """Rounded to the nearest 100, every figure leaves the reader at least 50
    either side, more than the corner's largest household holds."""
    cells, links, spaces, figures = corner_table(decimals=-2)
    withheld, _ = withhold(cells, links, spaces, figures)
    assert withheld == {(0, 0)}
    check_withheld(cells, links, spaces, figures, withheld)


def thin_complement(decimals: int):
    sources = np.arange(60)
    group = np.ones(60, dtype=bool)
    a, b = np.arange(60) < 30, np.arange(60) >= 33  # three households in neither
    cells = {
        "a": share_cell(SPACE, a, group),
        "b": share_cell(SPACE, b, group),
        "_neither": share_cell(SPACE, ~a & ~b, group, published=False),
        "all": count_cell(SPACE, group),
    }
    spaces = spaces_for(sources)
    cells, figures = publish(cells, spaces, decimals)
    return cells, [(("a", 1), ("b", 1), ("_neither", 1), ("all", -1))], spaces, figures


def test_the_complement_of_a_thin_share_stays_hidden_through_its_total():
    cells, links, spaces, figures = thin_complement(decimals=3)
    withheld, _ = withhold(cells, links, spaces, figures)
    assert withheld & {"a", "b"}
    check_withheld(cells, links, spaces, figures, withheld)
    # Shares to one decimal place leave the reader three households either side.
    cells, links, spaces, figures = thin_complement(decimals=1)
    assert withhold(cells, links, spaces, figures)[0] == set()


def two_pairs(decimals: int = 6):
    sources = np.arange(40)
    x = np.zeros(40)
    x[:3] = 5.0
    y = np.zeros(40)
    y[10:40] = 2.0
    cells = {
        "x": change_cell(SPACE, x),
        "y": change_cell(SPACE, y),
        "sum": change_cell(SPACE, x + y),
        "difference": change_cell(SPACE, x - y),
    }
    spaces = spaces_for(sources)
    cells, figures = publish(cells, spaces, decimals)
    links = [(("sum", 1), ("x", -1), ("y", -1)), (("difference", 1), ("x", -1), ("y", 1))]
    return cells, links, spaces, figures


def test_two_links_together_bound_a_cell_neither_bounds_alone():
    """With x and y both withheld, neither link alone gives x away, but the sum
    and the difference together give x to within their rounding."""
    cells, links, spaces, figures = two_pairs()
    reader = Reader(cells, links, spaces, figures)
    below, above, _, _ = reader.reach((("x", 1),), {"x", "y"})
    assert max(below, above) < 1e-5
    with pytest.raises(DisclosureError):
        disclosure.audit(reader, {"x", "y"})
    withheld, _ = withhold(cells, links, spaces, figures)
    assert "x" in withheld and withheld & {"sum", "difference"}
    check_withheld(cells, links, spaces, figures, withheld)


def test_the_cells_we_name_first_go_blank():
    cells, links, spaces, figures = one_link(decimals=-1)
    assert withhold(cells, links, spaces, figures, first={"a"})[0] == {"a", "c"}


def random_grid(seed: int, rows: int, columns: int, n: int, households: int, decimals: int):
    rng = np.random.default_rng(seed)
    row_of, column_of = rng.integers(0, rows, n), rng.integers(0, columns, n)
    sources = rng.integers(0, households, n)
    weights = rng.choice([0.5, 1.0, 3.0, 40.0], n)
    values = rng.choice([-30.0, -2.0, 0.0, 0.0, 3.0, 25.0, 400.0], n)
    return grid(rows, columns, values, (row_of, column_of), sources, weights, decimals)


@settings(max_examples=60, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    rows=st.integers(1, 3),
    columns=st.integers(1, 3),
    n=st.integers(5, 120),
    households=st.integers(3, 60),
    seed=st.integers(0, 2**16),
    decimals=st.sampled_from([-3, -2, -1, 0, 6]),
)
def test_withholding_leaves_every_failing_figure_out_of_a_readers_reach(rows, columns, n, households, seed, decimals):
    cells, links, spaces, figures = random_grid(seed, rows, columns, n, households, decimals)
    try:
        withheld, _ = withhold(cells, links, spaces, figures)
    except DisclosureError:
        return
    check_withheld(cells, links, spaces, figures, withheld)


@settings(max_examples=40, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(seed=st.integers(0, 2**16), decimals=st.sampled_from([-2, -1, 0, 6]), data=st.data())
def test_withholding_more_never_narrows_a_readers_bounds(seed, decimals, data):
    cells, links, spaces, figures = random_grid(seed, 3, 3, 90, 40, decimals)
    reader = Reader(cells, links, spaces, figures)
    keys = sorted(cells, key=str)
    hidden = set(data.draw(st.lists(st.sampled_from(keys), min_size=1, max_size=4)))
    more = hidden | set(data.draw(st.lists(st.sampled_from(keys), max_size=4)))
    target = data.draw(st.sampled_from(sorted(hidden, key=str)))
    before = reader.reach(((target, 1),), hidden)[:2]
    after = reader.reach(((target, 1),), more)[:2]
    for narrow, wide in zip(before, after):
        assert wide >= narrow * (1 - 1e-6) - 1e-6


@settings(max_examples=40, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(seed=st.integers(0, 2**16), decimals=st.sampled_from([-2, -1, 0, 3]))
def test_a_readers_bounds_always_hold_the_true_value(seed, decimals):
    """Zero shift lies within every bound: the reader never rules out the truth."""
    cells, links, spaces, figures = random_grid(seed, 2, 3, 60, 30, decimals)
    reader = Reader(cells, links, spaces, figures)
    assume(reader.keys)
    assert np.all(reader.shown_bounds[:, 0] <= 0) and np.all(reader.shown_bounds[:, 1] >= 0)
    assert np.all(reader.hidden_bounds[:, 0] <= 0) and np.all(reader.hidden_bounds[:, 1] >= 0)
    for key in reader.keys:
        below, above, _, _ = reader.reach(((key, 1),), {key})
        assert below >= 0 and above >= 0


def mixed_table(seed: int, rows: int, columns: int, n: int, households: int):
    """A made-up table like the national ones. It holds a grid of sums of changes
    with its totals, and for each row and for all rows, a mean change, a count,
    the shares with less and more, a count with the same that we never publish,
    a sum of amounts that never fall below zero, and the net of the two: the sum
    of changes less the amounts. Some rows hold changes of one sign. Each figure
    takes its own rounding, and, as the national tables publish billions and
    millions, some sums and counts publish figures in hundreds or thousands.

    Also returns, for each cell, its level and what a reader knows of it without
    its figure, worked out from the records alone, without disclosure.py, and the
    families of cells that share links."""
    rng = np.random.default_rng(seed)
    row_of, column_of = rng.integers(0, rows, n), rng.integers(0, columns, n)
    sources = rng.integers(0, households, n)
    weights = rng.choice([0.5, 1.0, 3.0, 8.0], n)
    sign_of_row = rng.choice([-1.0, 0.0, 1.0], rows)
    signs = np.where(sign_of_row[row_of] == 0, rng.choice([-1.0, 1.0], n), sign_of_row[row_of])
    values = signs * rng.choice([0.0, 0.0, 0.5, 1.0, 3.0, 25.0, 400.0], n)
    amounts = rng.choice([0.0, 0.0, 5.0, 60.0, 300.0], n)
    cells, truth = {}, {}

    def add(key, cell, parts, group=None, share=False):
        """`parts` gives what each record adds to the cell, and zero for a record
        it leaves out. A share or a mean also names its group."""
        some = parts[parts != 0]
        group_weight = float(weights[group].sum()) if group is not None else None
        published = cell.published
        decimals = int(rng.choice([-2, -1, 0, 1, 3])) if published else None
        unit = float(rng.choice([1.0, 1.0, 100.0, 1_000.0])) if published and group is None else 1.0
        cells[key] = replace(cell, decimals=decimals, unit=unit) if published else cell
        truth[key] = {
            "level": float(np.dot(weights, parts)),
            # A reader knows a figure's sign when all its parts share one, and
            # that a share cannot exceed its group.
            "low": 0.0 if np.all(some >= 0) else -math.inf,
            "high": min(0.0 if np.all(some <= 0) else math.inf, group_weight if share else math.inf),
            "denominator": group_weight if group is not None else unit,
            "decimals": decimals,
        }

    sums = lambda mask: np.where(mask, values, 0.0)
    for r in range(rows):
        for c in range(columns):
            m = (row_of == r) & (column_of == c)
            add((r, c), change_cell(SPACE, values, m), sums(m))
        add((r, "total"), change_cell(SPACE, values, row_of == r), sums(row_of == r))
    for c in range(columns):
        add(("total", c), change_cell(SPACE, values, column_of == c), sums(column_of == c))
    add(("total", "total"), change_cell(SPACE, values), values.copy())
    links = [((((r, "total"), 1),) + tuple(((r, c), -1) for c in range(columns))) for r in range(rows)]
    links += [((("total", c), 1),) + tuple(((r, c), -1) for r in range(rows)) for c in range(columns)]
    links.append(((("total", "total"), 1),) + tuple((("total", c), -1) for c in range(columns)))
    links.append(((("total", "total"), 1),) + tuple(((r, "total"), -1) for r in range(rows)))

    less, more = values < -disclosure.CHANGE_TOLERANCE, values > disclosure.CHANGE_TOLERANCE
    same = ~less & ~more
    groups = {r: row_of == r for r in range(rows)} | {"all": np.ones(n, dtype=bool)}
    for g, m in groups.items():
        add(("mean", g), mean_cell(SPACE, values, m), sums(m), group=m)
        add(("n", g), count_cell(SPACE, m), m.astype(float))
        add(("less", g), share_cell(SPACE, less, m), (less & m).astype(float), group=m, share=True)
        add(("more", g), share_cell(SPACE, more, m), (more & m).astype(float), group=m, share=True)
        add(("same", g), count_cell(SPACE, same & m, published=False), (same & m).astype(float))
        add(("amount", g), disclosure.level_cell(SPACE, amounts, m), np.where(m, amounts, 0.0))
        add(("net", g), change_cell(SPACE, values - amounts, m), np.where(m, values - amounts, 0.0))
        row_total = (g, "total") if g != "all" else ("total", "total")
        links.append(((("less", g), 1), (("more", g), 1), (("same", g), 1), (("n", g), -1)))
        links.append(((("mean", g), 1), (row_total, -1)))
        links.append(((("net", g), 1), (row_total, -1), (("amount", g), 1)))
    for column in ("n", "less", "more", "same", "amount", "net"):
        links.append((((column, "all"), 1), *(((column, r), -1) for r in range(rows))))

    spaces = spaces_for(sources, weights)
    figures = {}
    for key, t in truth.items():
        if t["decimals"] is not None:
            figures[key] = round(t["level"] / t["denominator"], t["decimals"]) if t["denominator"] else None
    changes = [key for key in cells if key[0] not in ("mean", "n", "less", "more", "same", "amount")]
    changes += [("mean", g) for g in groups]
    counts = [(column, g) for column in ("n", "less", "more", "same") for g in groups]
    # The net links the changes with the amounts, so they form one family.
    families = [changes + [("amount", g) for g in groups], counts]
    return cells, links, spaces, figures, truth, families


def bounds_in_levels(truth, links, figures, members, hidden):
    """How far below and above its true value a reader can push a signed sum of
    cells, from a linear programme in the cells' levels over every cell at once.
    It takes each cell's level, sign, cap and denominator from `truth`, which
    mixed_table works out from the records without disclosure.py. Reader.reach
    works in shifts from the true values, one linked component at a time, and
    widens each interval to hold the truth. This programme works in levels over
    every component at once, and moves a bound only by float noise, so the two
    agree only if both bound what the reader knows."""
    keys = sorted({key for link in links for key, _ in link}, key=str)
    column = {key: i for i, key in enumerate(keys)}
    matrix = np.zeros((len(links), len(keys)))
    for r, link in enumerate(links):
        for key, sign in link:
            matrix[r, column[key]] += sign
    levels = np.array([truth[key]["level"] for key in keys])
    # The true levels meet every link and every bound below, so the programme
    # always has a solution.
    assert np.all(np.abs(matrix @ levels) <= 1e-9 * (1 + np.abs(matrix) @ np.abs(levels)))
    bounds = []
    for key in keys:
        t = truth[key]
        low, high = t["low"], t["high"]
        if t["decimals"] is not None and key not in hidden:
            figure = figures[key]
            if figure is None:
                shown_low = shown_high = 0.0
            else:
                half = 0.5 * 10.0 ** (-t["decimals"])
                shown_low, shown_high = sorted(((figure - half) * t["denominator"], (figure + half) * t["denominator"]))
            low, high = max(low, shown_low), min(high, shown_high)
        value = t["level"]
        slack = 1e-9 * (1 + abs(value))
        assert low - slack <= value <= high + slack, key
        low, high = min(low, value), max(high, value)
        bounds.append((None if math.isinf(low) else low, None if math.isinf(high) else high))
    objective = np.zeros(len(keys))
    for key, sign in members:
        objective[column[key]] += sign
    truth_of_sum = float(objective @ levels)
    extremes = []
    for direction in (1, -1):
        result = linprog(direction * objective, A_eq=matrix, b_eq=np.zeros(len(links)), bounds=bounds, method="highs")
        # With the true levels feasible, HiGHS can only fail on an unbounded
        # programme, which it sometimes calls infeasible.
        if result.status in (2, 3):
            extremes.append(-direction * math.inf)
            continue
        assert result.status == 0, result.message
        extremes.append(direction * float(result.fun))
    lowest, highest = extremes
    return max(0.0, truth_of_sum - lowest), max(0.0, highest - truth_of_sum), float(np.abs(levels).max())


@settings(max_examples=80, deadline=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    seed=st.integers(0, 2**16),
    rows=st.integers(1, 3),
    columns=st.integers(1, 3),
    n=st.integers(5, 60),
    households=st.integers(3, 40),
    data=st.data(),
)
def test_a_readers_bounds_match_a_programme_in_levels(seed, rows, columns, n, households, data):
    cells, links, spaces, figures, truth, families = mixed_table(seed, rows, columns, n, households)
    reader = Reader(cells, links, spaces, figures)
    published = sorted((key for key, cell in cells.items() if cell.published), key=str)
    hidden = set(data.draw(st.lists(st.sampled_from(published), max_size=6)))
    family = data.draw(st.sampled_from(families))
    chosen = data.draw(st.lists(st.sampled_from(family), min_size=1, max_size=3, unique=True))
    members = tuple((key, data.draw(st.sampled_from([1, -1]))) for key in chosen)
    below, above, _, _ = reader.reach(members, hidden)
    level_below, level_above, scale = bounds_in_levels(truth, links, figures, members, hidden)
    # The tolerance stays below 2.5e-4, the smallest half unit in levels we
    # draw: half of 0.001, times the smallest denominator, 0.5. So a reader who
    # moved the end of a rounding interval that binds a bound by a half unit
    # would fail.
    tolerance = 1e-9 * (1 + scale)
    assert tolerance < 2.5e-4
    for ours, theirs in ((below, level_below), (above, level_above)):
        if math.isinf(theirs):
            assert math.isinf(ours)
        else:
            assert ours == pytest.approx(theirs, rel=0, abs=tolerance)


def test_a_made_up_table_reaches_every_kind_of_figure():
    """Across seeds, mixed_table gives figures blank for an empty group, figures
    whose sign a reader knows that round to zero, shares and means at every
    rounding, sums of changes of every sign, sums in hundreds or thousands, and
    a net whose parts take both signs."""
    seen = set()
    for seed in range(40):
        cells, _, _, figures, truth, families = mixed_table(seed, 3, 2, 4 + seed % 20, 20)
        changes = {key for key in families[0] if key[0] != "amount"}
        for key, t in truth.items():
            kind = cells[key].kind
            if t["decimals"] is None:
                seen.add("never published")
                continue
            seen.add((kind, t["decimals"]))
            if cells[key].unit != 1:
                seen.add(("unit", kind))
            if key[0] == "net" and math.isinf(t["low"]) and math.isinf(t["high"]):
                seen.add("net of both signs")
            if figures[key] is None:
                seen.add("blank")
            elif figures[key] == 0 and t["level"] != 0 and (t["low"] == 0 or t["high"] == 0):
                seen.add("signed zero")
            if key in changes and kind == disclosure.SUM and t["level"] != 0:
                seen.add(("sign", t["low"] == 0, t["high"] == 0))
    assert {"never published", "blank", "signed zero", ("unit", disclosure.SUM), "net of both signs"} <= seen
    assert {(SHARE, d) for d in (-2, -1, 0, 1, 3)} <= seen
    assert {(disclosure.MEAN, d) for d in (-2, -1, 0, 1, 3)} <= seen
    assert {("sign", True, False), ("sign", False, True), ("sign", False, False)} <= seen


def test_withholding_succeeds_on_most_tables():
    solved = 0
    for seed in range(40):
        rng = np.random.default_rng(seed)
        n = 200
        row_of, column_of = rng.integers(0, 3, n), rng.integers(0, 3, n)
        sources = rng.integers(0, 80, n)
        values = rng.choice([-30.0, 0.0, 3.0, 25.0, 400.0], n)
        cells, links, spaces, figures = grid(3, 3, values, (row_of, column_of), sources, rng.uniform(1, 5, n))
        try:
            withheld, _ = withhold(cells, links, spaces, figures)
        except DisclosureError:
            continue
        check_withheld(cells, links, spaces, figures, withheld)
        solved += 1
    assert solved >= 36


def test_withholding_is_deterministic():
    rng = np.random.default_rng(3)
    n = 150
    row_of, column_of = rng.integers(0, 3, n), rng.integers(0, 2, n)
    sources = rng.integers(0, 50, n)
    values = rng.choice([-30.0, 0.0, 3.0, 25.0, 400.0], n)
    cells, links, spaces, figures = grid(3, 2, values, (row_of, column_of), sources)
    first = withhold(cells, links, spaces, figures)[0]
    for order in itertools.islice(itertools.permutations(links), 5):
        assert withhold(cells, list(order), spaces, figures)[0] == first


def test_protection_records_each_target_with_room_to_spare():
    cells, links, spaces, figures = corner_table(decimals=6)
    withheld, _ = withhold(cells, links, spaces, figures)
    reader = Reader(cells, links, spaces, figures)
    rows = disclosure.protection(reader, withheld)
    assert rows
    for row in rows:
        for distance in (row["below"], row["above"]):
            assert distance is None or distance >= row["margin"] * (1 - 1e-6)
