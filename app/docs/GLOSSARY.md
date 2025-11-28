# Glossary

Key terminology used in the PolicyEngine app architecture.

---

## Report

A complete analysis comparing two policy scenarios (baseline vs reform) for a given population. Reports contain simulation results and are stored in the database.

**Related:** [Simulation](#simulation), [Base Report vs User Report](#base-report-vs-user-report)

---

## Base Report vs User Report

- **Base Report:** The immutable calculation results stored in the API database. Contains simulation IDs, status, and output data.
- **User Report:** User-specific metadata stored locally (localStorage) or in the API. Links to a base report via `reportId` and contains user-defined labels and timestamps.

Multiple user reports can reference the same base report (enables sharing).

---

## Simulation

A single policy calculation run. Each simulation references:
- A [Policy](#policy) (the rules being applied)
- A [Population](#population) (who is being analyzed)
- A year (when the calculation applies)

Reports typically contain 1-2 simulations (baseline and/or reform).

---

## Population

Defines who is being analyzed. Two types:

- **Household:** A specific family/individual with defined characteristics (age, income, etc.)
- **Geography:** A region (state, country) representing aggregate population data

---

## Household

A structured data object representing a family unit for microsimulation. Contains:
- **People:** Individual members with variables (age, income, etc.)
- **Group entities:** Tax units, marital units, SPM units, benefit units (country-specific)

See `src/types/ingredients/Household.ts`

---

## Policy

A set of parameter values defining tax/benefit rules. Two roles in analysis:

- **Baseline:** Current law or reference policy (often unmodified)
- **Reform:** Modified policy being evaluated

---

## Parameter

A single configurable value within a policy (e.g., tax rate, benefit threshold). Parameters are:
- Defined in the country model (policyengine-us, policyengine-uk)
- Time-indexed (values can change by year)
- Organized hierarchically (e.g., `gov.irs.income.bracket.rates`)

---

## Variable

A calculated or input value associated with an entity (person, household, etc.). Two types:

- **Input Variable:** User-provided data (e.g., `age`, `employment_income`)
- **Output Variable:** Calculated by the model (e.g., `income_tax`, `net_income`)

Variables have metadata including: entity type, value type (int/float/bool/string), definition period, and default value.

---

## Entity

A unit that variables can belong to. Common entities:

| Entity | Description | Example Variables |
|--------|-------------|-------------------|
| `person` | Individual | age, employment_income |
| `household` | Physical dwelling | state_name, rent |
| `tax_unit` | IRS filing unit (US) | filing_status |
| `spm_unit` | Supplemental Poverty Measure unit (US) | spm_resources |
| `benunit` | Benefit unit (UK) | benunit_rent |
| `marital_unit` | Married couple or single adult | marital_status |

---

## Year / Tax Year

The fiscal year for calculations. Affects:
- Which parameter values apply
- Variable time periods
- Available policy options

Set at the [Report](#report) level and propagated via `ReportYearContext`.

---

## Pathway

A multi-step user flow for creating an ingredient. Examples:
- **Report Pathway:** Create report → select year → choose population → configure policy → view results
- **Population Pathway:** Choose type → build household or select geography

Implemented as state machines in `src/pathways/`.

---

## Metadata

Country-specific configuration loaded from the API containing:
- All available [variables](#variable) and their properties
- All available [parameters](#parameter) and their structures
- Entity definitions
- Current law policy values

Stored in Redux state (`state.metadata`).
