Microsimulation models compute government benefits simultaneously for every household. This works well when programs are independent, but breaks down when Program A's benefit depends on Program B, which depends on Program A. We recently encountered this exact problem when wiring up Florida's TANF program, and the fix reveals something interesting about how benefit programs interact in practice.

## The dependency cycle

PolicyEngine computes each household's TANF benefit by summing state-specific programs. When we added Florida's Temporary Cash Assistance (TCA) program, tests failed with a circular dependency error.

Here's the cycle:

<center><iframe src="/assets/posts/tanf-circular-dependency/cycle-diagram.html" width="100%" height="580" style="border:none;"></iframe></center>

Click any node to see its connections. The animated path traces the full cycle.

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

But in practice, this overlap is small. Section 8 waiting lists are [years long](https://www.cbpp.org/research/housing/long-waitlists-for-housing-vouchers-show-pressing-unmet-need-for-assistance), and most TANF recipients pay market rent. Among the 39 state TANF programs PolicyEngine models, only Florida routes through housing cost in a way that creates this cycle. The other 38 states compute payment standards based on family size, income, or fixed schedules that don't depend on housing.

## The SALT cycle: federal and state taxes

The FL TANF case isn't unique. PolicyEngine's largest circular dependency workaround involves the interaction between federal and state income taxes.

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

The FL TANF and SALT cases are the most architecturally significant, but PolicyEngine handles several other cycles with similar techniques:

| Cycle | Variables involved | Resolution |
|---|---|---|
| **SNAP ↔ childcare subsidies** | SNAP deductions → childcare expenses → childcare subsidies → income → SNAP | Use `pre_subsidy_childcare_expenses` |
| **SNAP ↔ electricity subsidies** | Utility allowance → electricity expenses → LIHEAP → SNAP enrollment → utility allowance | Use `pre_subsidy_electricity_expense` |
| **KS TANF ↔ childcare subsidies** | KS TANF earned income → dependent care deduction → childcare subsidies → income → TANF | Use `spm_unit_pre_subsidy_childcare_expenses` |
| **Dependent income ↔ filing status** | Dependent gross income → taxable Social Security → filing status → dependent status → dependent income | Substitute pre-tax amounts (`social_security` for `taxable_social_security`) |
| **MT itemization ↔ federal tax** | MT itemized deductions → federal itemization choice → SALT → MT state tax | Parallel "for_federal_itemization" variable set |
| **VA/DE EITC refundability** | State EITC refundability → state tax liability → state credits → state EITC | Simulation branches that force refundable/non-refundable, compare outcomes |
| **NY CTC ↔ federal CTC** | NY Empire State CTC → federal CTC under pre-TCJA rules → tax liability → state credits | Simulation branch with cloned parameters rewound to 2017 values |
| **MD EITC ↔ age minimum** | MD EITC → federal EITC without age floor → federal EITC → tax liability → state credits | Disable cycle detection, delete and recompute cached values |
| **Itemization choice** | Whether to itemize → tax liability if itemizing/not → income tax → deductions → whether to itemize | Two simulation branches force each choice, compare |

These workarounds fall into three categories:

1. **Pre-subsidy substitution** (SNAP childcare, SNAP electricity, FL TANF, KS TANF): Replace a post-subsidy amount with the pre-subsidy equivalent. Simple, low error, mirrors how agencies actually operate.

2. **Simplified parallel variables** (SALT withholding, MT federal itemization, dependent income): Compute a rough approximation that avoids the dependency chain entirely. Moderate error — the simplified estimate diverges from the true value.

3. **Simulation branches** (CTC/SALT, VA/DE EITC, NY CTC, itemization): Fork the computation, force specific assumptions in each branch, then compare or combine results. Most powerful but most complex — requires cloning simulation state and managing cache invalidation.

## Implications for policy modeling

Every circular dependency workaround introduces some inaccuracy. Using pre-subsidy rent for FL TANF overstates shelter costs for subsidized households. Using simplified withholding for SALT understates the deduction for some filers. Zeroing out SALT for CTC computation ignores a real interaction.

These tradeoffs matter most at the margins — households near program thresholds where small differences in computed values flip eligibility. For aggregate estimates across millions of households, the errors tend to wash out. But for individual household calculators, users should understand that the model imposes an ordering on program determinations that real agencies handle case by case.

The full dependency graph across all programs must remain a directed acyclic graph (DAG). When adding new state programs — especially those that incorporate housing costs, medical expenses, or other amounts that themselves depend on benefit programs — checking for cycles is an essential part of validation. PolicyEngine currently has at least twelve documented cycle-breaking workarounds across these three categories, each trading a modeling simplification for computational tractability.
