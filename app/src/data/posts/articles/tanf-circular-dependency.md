Microsimulation models compute government benefits simultaneously for every household. This works well when programs are independent, but breaks down when Program A's benefit depends on Program B, which depends on Program A. We recently encountered this problem across three state TANF programs — Florida, Arizona, and Vermont — where housing costs create a genuine circular dependency. Auditing other suspected cycles revealed that some were implementation artifacts rather than real policy interactions.

<center><iframe src="/assets/posts/tanf-circular-dependency/cycle-diagram.html" width="100%" height="560" style="border:none;"></iframe></center>

## The dependency cycle

PolicyEngine computes each household's TANF benefit by summing state-specific programs. When we added Florida's Temporary Cash Assistance (TCA) program, tests failed with a circular dependency error. Arizona's TANF program has the same cycle through its `az_tanf_payment_standard`, which reduces benefits by 37% for households without shelter costs. Vermont's Reach Up program hits the same cycle through its housing allowance, which caps benefits at actual housing costs.

The chain works like this:

1. **tanf** sums all state TANF programs, including Florida's `fl_tca`
2. **fl_tca** computes its benefit as payment standard minus countable income
3. **fl_tca_payment_standard** looks up a shelter tier (zero, low, or high) based on the household's `housing_cost`
4. **housing_cost** includes `rent`, which is calculated net of subsidies
5. **rent** subtracts `housing_assistance` (Section 8 vouchers, public housing) from pre-subsidy rent
6. **housing_assistance** depends on `hud_annual_income` to determine subsidy amounts
7. **hud_annual_income** counts TANF as income per [HUD's definition of annual income](https://www.law.cornell.edu/cfr/text/24/5.609)

And we're back to step 1.

## Why this doesn't happen in real life

Real benefit agencies don't have this problem because they operate sequentially. When someone applies for TANF at Florida's Department of Children and Families, the caseworker asks: "What do you pay for housing?" The applicant reports their current situation. If they already have a Section 8 voucher, they report their subsidized rent. If not, they report market rent. The caseworker doesn't recalculate HUD benefits on the spot.

But a microsimulation model computes everything simultaneously. There's no "sequence" unless we impose one, and the variable dependency graph must be acyclic.

## How we fixed it

Florida's statute defines the relevant concept as ["shelter obligation"](https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-65A-4-220) — the household's responsibility to pay for housing. We changed `fl_tca_payment_standard` to use `pre_subsidy_rent` (plus mortgage, taxes, and insurance) instead of `housing_cost`:

```python
# Before: created circular dependency
monthly_shelter = spm_unit("housing_cost", period)

# After: uses gross shelter obligation
pre_subsidy_rent = add(spm_unit, period, ["pre_subsidy_rent"])
other_housing = add(
    spm_unit,
    period,
    ["real_estate_taxes", "homeowners_association_fees",
     "mortgage_payments", "homeowners_insurance"],
)
monthly_shelter = pre_subsidy_rent + other_housing
```

This breaks the cycle at the right conceptual point. The `pre_subsidy_rent` variable has no dependency on housing assistance programs, so the chain from `fl_tca_payment_standard` down to `hud_annual_income` never forms.

## Is this accurate?

For the small share of households receiving both TANF and Section 8, this overstates their shelter obligation. Their actual out-of-pocket housing cost would be lower, potentially placing them in a lower shelter tier with a smaller payment standard.

But in practice, this overlap is small. Section 8 waiting lists are [years long](https://www.cbpp.org/research/housing/long-waitlists-for-housing-vouchers-show-pressing-unmet-need-for-assistance), and most TANF recipients pay market rent. Among the 51 state TANF programs PolicyEngine models (all US states plus DC), three route through housing cost in a way that creates this cycle: Florida uses shelter tiers (zero, low, high), Arizona reduces payment standards by 37% for households without shelter costs, and Vermont caps its Reach Up housing allowance at actual housing costs. The other 48 jurisdictions compute payment standards based on family size, income, or fixed schedules that don't depend on housing.

## The childcare cycle that wasn't

We initially believed a separate circular dependency affected 24 state TANF programs that deduct childcare expenses from countable income. The suspected cycle ran: TANF → state TANF programs → childcare deduction → `childcare_expenses` → childcare subsidies (CO CCAP, CA, NE, MA) → SNAP → TANF.

To break this apparent cycle, we replaced `childcare_expenses` (post-subsidy) with `spm_unit_pre_subsidy_childcare_expenses` (pre-subsidy input) across all affected states. But an audit of the actual dependency chains revealed that **no real cycle existed**.

The only path that could create a cycle ran through Colorado's Child Care Assistance Program (CO CCAP). Its `co_ccap_countable_income` variable used SNAP income as a placeholder for the program's actual income definition, with a TODO comment acknowledging the shortcut:

```python
# Before: placeholder creating a false cycle
class co_ccap_countable_income(Variable):
    adds = ["snap_earned_income", "snap_unearned_income"]
    # TODO: Use income components from the manual.
```

We replaced this with the actual income sources specified in [8 CCR 1403-1 Section 7.105](https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=11042&fileName=8%20CCR%201403-1#page=22) — employment income, Social Security, pensions, child support, and other sources that don't depend on SNAP or TANF. The other three states with childcare subsidies (California, Nebraska, Massachusetts) never included SNAP in their income definitions, so they never contributed to a cycle.

With the root cause fixed, all 24 state TANF programs now use `childcare_expenses` directly — the post-subsidy amount — which is more accurate than the pre-subsidy workaround. SNAP's dependent care deduction also switched from `pre_subsidy_childcare_expenses` to `childcare_expenses`, since no childcare subsidy program depends on SNAP income.

The lesson: not every cycle in the static dependency graph represents a real policy interaction. OpenFisca builds its dependency graph from variable definitions at the code level. A variable like `co_ccap_countable_income` that references SNAP income creates a graph edge regardless of whether it's the correct income definition. Auditing the actual statutory requirements — not just the code — revealed the cycle was an implementation artifact.

## The SALT cycle: federal and state taxes

The FL/AZ TANF case isn't unique. PolicyEngine's largest circular dependency workaround involves the interaction between federal and state income taxes.

Six states — Alabama, Iowa, Louisiana, Missouri, Montana, and Oregon — allow taxpayers to [deduct federal income tax paid](https://taxfoundation.org/data/all/state/state-deduction-federal-income-taxes-2024/) from their state taxable income. Meanwhile, the federal tax code lets itemizers deduct state and local taxes (SALT) from federal taxable income. This creates a textbook cycle:

1. **State taxable income** depends on a deduction for federal income tax
2. **Federal income tax** depends on itemized deductions including SALT
3. **SALT** depends on state income tax paid
4. Back to step 1

In practice, employers withhold estimated state taxes throughout the year, and taxpayers claim that withheld amount as their SALT deduction — not their final computed liability. The IRS doesn't recompute your state tax to verify SALT.

PolicyEngine mirrors this with a parallel set of **simplified "withheld" tax variables** for each state. Instead of SALT depending on the fully computed state income tax (which would create the cycle), it depends on `state_withheld_income_tax` — a rough estimate computed from AGI, the maximum standard deduction, and single filing rates:

```python
class al_withheld_income_tax(Variable):
    def formula(person, period, parameters):
        agi = person("adjusted_gross_income_person", period)
        p = parameters(period).gov.states.al.tax.income
        standard_deduction = p.deductions.standard.amount.max["SINGLE"]
        reduced_agi = max_(agi - standard_deduction, 0)
        return p.rates.single.calc(reduced_agi)
```

This is a deliberate simplification. The withheld estimate ignores the actual filing status, state-specific credits, and the federal tax deduction itself. But it breaks the cycle cleanly: the simplified estimate has no dependency on federal tax, so states like Alabama can deduct `income_tax_before_refundable_credits` without creating a loop.

The CTC calculation has a related workaround. The non-refundable Child Tax Credit is limited by tax liability, which depends on taxable income, which depends on SALT. To avoid this becoming circular, PolicyEngine computes CTC-limiting liability on a [simulation branch](https://openfisca.org/doc/coding-the-legislation/40_legislation_evolutions.html) that zeros out the SALT deduction entirely — documented in the code as "an inaccuracy required to avoid circular dependencies."

## Other cycles in the codebase

The FL/AZ/VT TANF housing and SALT cases are the most architecturally significant, but PolicyEngine handles several other cycles with similar techniques:

| Cycle | Variables involved | Resolution |
|---|---|---|
| **Dependent income ↔ filing status** | Dependent gross income → taxable Social Security → filing status → dependent status → dependent income | Substitute pre-tax amounts (`social_security` for `taxable_social_security`) |
| **MT itemization ↔ federal tax** | MT itemized deductions → federal itemization choice → SALT → MT state tax | Parallel MT deduction variables that avoid the federal tax dependency |
| **VA/DE EITC refundability** | State EITC refundability → state tax liability → state credits → state EITC | Simulation branches that force refundable/non-refundable, compare outcomes |
| **NY CTC ↔ federal CTC** | NY CTC → federal CTC under pre-TCJA rules → tax liability → state credits | Simulation branch with cloned parameters rewound to 2017 values |
| **MD EITC ↔ age minimum** | MD EITC → federal EITC without age floor → federal EITC → tax liability → state credits | Disable cycle detection, delete and recompute cached values |
| **Itemization choice** | Whether to itemize → tax liability if itemizing/not → income tax → deductions → whether to itemize | Two simulation branches force each choice, compare |

These workarounds fall into three categories:

1. **Pre-subsidy substitution** (FL/AZ/VT TANF housing): Replace a post-subsidy amount with the pre-subsidy equivalent. Simple, low error, mirrors how agencies actually operate.

2. **Simplified parallel variables** (SALT withholding, MT federal itemization, dependent income): Compute a rough approximation that avoids the dependency chain entirely. Moderate error — the simplified estimate diverges from the true value.

3. **Simulation branches** (CTC/SALT, VA/DE EITC, NY CTC, MD EITC, itemization): Fork the computation, force specific assumptions in each branch, then compare or combine results. Most powerful but most complex — requires cloning simulation state and managing cache invalidation.

## Implications for policy modeling

Every circular dependency workaround introduces some inaccuracy. Using pre-subsidy rent for FL/AZ/VT TANF overstates shelter costs for subsidized households. Using simplified withholding for SALT understates the deduction for some filers. Zeroing out SALT for CTC computation ignores a real interaction.

But not every workaround is necessary. The childcare "cycle" turned out to be an implementation artifact — a placeholder income definition in one state program created a false dependency chain in the static graph. Auditing the actual statutory requirements let us remove the workaround and use more accurate post-subsidy amounts. This suggests other workarounds may also be overly conservative.

These tradeoffs matter most at the margins — households near program thresholds where small differences in computed values flip eligibility. For aggregate estimates across millions of households, the errors tend to wash out. But for individual household calculators, users should understand that the model imposes an ordering on program determinations that real agencies handle case by case.

The full dependency graph across all programs must remain a directed acyclic graph (DAG). When adding new state programs — especially those that incorporate housing costs or other amounts that themselves depend on benefit programs — checking for cycles is an essential part of validation. But it's equally important to audit whether a detected cycle reflects a real policy interaction or an implementation shortcut. PolicyEngine currently has about ten cycle-breaking workarounds across these three categories, each trading a modeling simplification for computational tractability.
