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

## A broader pattern

This case illustrates a general challenge in microsimulation: benefit programs are interconnected in ways that can create computational cycles, even though they're administered sequentially in practice.

Common examples include:

- **TANF and housing**: TANF counts as income for HUD programs; HUD subsidies affect housing costs that some states use for TANF
- **SNAP and taxes**: SNAP benefits aren't taxable, but SNAP eligibility depends on income that's affected by tax credits
- **Medicaid and SSI**: SSI eligibility can depend on Medicaid costs, while Medicaid eligibility can depend on SSI income

Each of these requires a modeling choice about where to "break" the cycle. The right answer usually comes from understanding which program's determination happens first in practice, and using the pre-determination value for the other program's calculation.

In PolicyEngine's case, the full dependency graph across all programs needs to remain a directed acyclic graph (DAG). When adding new state programs — especially those that incorporate housing costs, medical expenses, or other amounts that themselves depend on benefit programs — checking for cycles is an essential part of validation.
