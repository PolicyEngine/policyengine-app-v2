Write tests for the most recently completed migration task. Follow this process exactly.

## Step 1: Identify what to test

Read `.claude-plan/MIGRATION_PROGRESS.md` and identify the most recently completed task (the last `- [x]` entry). Determine which repo(s) were changed and what code was added or modified.

Read the relevant source files to understand what needs test coverage.

## Step 2: Plan tests

For each repo that was changed, plan the test files and fixture files to create. Present the plan and wait for approval before writing any code.

## Step 3: Write tests

Follow these conventions strictly for **all repos** (policyengine.py, policyengine-api-v2-alpha, policyengine-app-v2):

### Test naming: Given-When-Then

Every test name MUST follow the given-when-then pattern:

```python
# Python (pytest)
def test__given_baseline_and_reform__when_computing_intra_decile__then_proportions_sum_to_one():

class TestIntraDecile:
    def test__given_uniform_3pct_raise__then_all_households_in_gain_less_than_5pct(self):
    def test__given_no_income_change__then_all_households_in_no_change(self):
    def test__given_empty_decile__then_proportion_is_zero(self):
```

Use double underscores to separate the given/when/then clauses for readability.

### Code organization: Fixtures separate from tests

**ALL mock data, test constants, factory functions, setup helpers, and patches MUST go in a fixtures file**, not inline in the test file. The test file should import everything it needs from fixtures.

**policyengine.py fixture location:** `tests/fixtures/` with naming `{feature}_fixtures.py`
```
tests/fixtures/poverty_by_demographics_fixtures.py
tests/fixtures/intra_decile_fixtures.py
```

**policyengine-api-v2-alpha fixture location:** `test_fixtures/` with naming `fixtures_{feature}.py`
```
test_fixtures/fixtures_budget_summary.py
test_fixtures/fixtures_intra_decile.py
```

**policyengine-app-v2 fixture location:** `app/src/tests/fixtures/` mirroring source structure
```
app/src/tests/fixtures/api/economyAnalysisMocks.ts
app/src/tests/fixtures/adapters/ReportAdapterMocks.ts
```

### What goes in fixtures vs tests

**Fixtures file contains:**
- Test constants with descriptive names (e.g., `HOUSEHOLD_IN_POVERTY_WEIGHT = 2.0`)
- Mock data builders / factory functions (e.g., `def create_test_household_data(...)`)
- Reusable setup helpers (e.g., `def create_completed_report_with_budget(session)`)
- Expected result constants (e.g., `EXPECTED_UK_PROGRAM_NAMES = [...]`)
- Patches and mock configurations

**Test file contains:**
- Imports from fixtures
- Test classes organized by feature/function under test
- Given-When-Then test methods with minimal setup (delegating to fixture helpers)
- Assertions only

### Example structure

**Fixtures file** (`test_fixtures/fixtures_intra_decile.py`):
```python
"""Fixtures for intra-decile impact tests."""
import numpy as np

# --- Constants ---
NUM_HOUSEHOLDS = 100
DECILES = np.repeat(np.arange(1, 11), NUM_HOUSEHOLDS // 10)
UNIFORM_WEIGHTS = np.ones(NUM_HOUSEHOLDS) * 100.0
PEOPLE_PER_HOUSEHOLD = np.array([2.0] * NUM_HOUSEHOLDS)

# --- Factory functions ---
def make_household_data(
    baseline_income: np.ndarray,
    reform_income: np.ndarray | None = None,
    weights: np.ndarray | None = None,
) -> tuple[dict[str, np.ndarray], dict[str, np.ndarray]]:
    """Build baseline and reform household data dicts for intra-decile tests."""
    if reform_income is None:
        reform_income = baseline_income.copy()
    if weights is None:
        weights = UNIFORM_WEIGHTS
    baseline = {
        "household_net_income": baseline_income,
        "household_weight": weights,
        "household_count_people": PEOPLE_PER_HOUSEHOLD,
        "household_income_decile": DECILES.astype(float),
    }
    reform = {
        "household_net_income": reform_income,
        "household_weight": weights,
        "household_count_people": PEOPLE_PER_HOUSEHOLD,
        "household_income_decile": DECILES.astype(float),
    }
    return baseline, reform

def make_baseline_income() -> np.ndarray:
    """Create baseline incomes: decile N earns ~N*10k."""
    return DECILES * 10_000.0
```

**Test file** (`tests/test_intra_decile.py`):
```python
"""Tests for intra-decile income change computation."""
import numpy as np
from policyengine_api.api.intra_decile import compute_intra_decile, CATEGORY_COLUMNS
from test_fixtures.fixtures_intra_decile import make_household_data, make_baseline_income

class TestComputeIntraDecile:
    def test__given_no_income_change__then_all_in_no_change_category(self):
        # Given
        income = make_baseline_income()
        baseline, reform = make_household_data(income, income)

        # When
        rows = compute_intra_decile(baseline, reform)

        # Then
        for row in rows:
            assert row["no_change"] == 1.0

    def test__given_uniform_3pct_raise__then_all_in_gain_less_than_5pct(self):
        # Given
        income = make_baseline_income()
        baseline, reform = make_household_data(income, income * 1.03)

        # When
        rows = compute_intra_decile(baseline, reform)

        # Then
        for row in rows:
            assert row["gain_less_than_5pct"] == 1.0
```

### Additional rules

- **One logical assertion per test** when possible. Multiple related asserts (e.g., checking all fields of a result) are OK, but don't test unrelated things together.
- **Test edge cases**: empty inputs, zero weights, zero incomes, missing deciles, boundary values at thresholds.
- **Test the public interface**, not internal helpers (unless those helpers are complex enough to warrant direct testing, like formula functions).
- **Use realistic-looking data**, not "foo"/"bar"/"test123".
- For API endpoint tests, use the `TestClient` pattern already established in the repo.

## Step 4: Run ONLY the new tests

After writing the tests, delegate test execution to a subagent using the Task tool with `subagent_type="general-purpose"`. The subagent should:

1. Run ONLY the newly created test file(s) — never the full test suite
2. If tests fail, fix the issues (in either tests or fixtures, NOT in the source code under test)
3. Re-run until all new tests pass
4. Report back the results

For policyengine.py:
```bash
cd ~/Documents/PolicyEngine/policyengine.py && PYTHONPATH=src python -m pytest tests/test_NEW_FILE.py -v
```

For policyengine-api-v2-alpha:
```bash
cd ~/Documents/PolicyEngine/policyengine-api-v2-alpha && PYTHONPATH=src python -m pytest tests/test_NEW_FILE.py -v
```

For policyengine-app-v2:
```bash
cd ~/Documents/PolicyEngine/policyengine-app-v2/app && npx vitest run src/tests/unit/PATH/TO/NEW_FILE.test.ts
```

## Step 5: Present results

Show:
1. The test files created (with paths)
2. The fixture files created (with paths)
3. Test results (all passing)
4. Summary of what's covered

Then ask: **"Ready to commit these tests?"**
