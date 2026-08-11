New York has one of the highest personal income tax rates in the country: 10.9% on very high incomes. The unusual part is not the rate — it is what happens at the $25 million threshold. For a single filer in 2026, raising New York adjusted gross income from exactly $25,000,000 to $25,000,002 cuts household net income by about $150,000, according to [PolicyEngine](https://policyengine.org/us) simulations. The cliff appears across all five filing statuses, ranging from $149,897 for surviving spouses to $149,953 for single and married-filing-separately filers. CPA Israel Steinberg [flagged the same effect on LinkedIn](https://www.linkedin.com/posts/israel-steinberg-cpa_how-earning-1-can-trigger-a-150000-tax-activity-7392173786948841472-3oL9), calculating $149,952 for a single filer.

![Net income by earnings around New York's $25 million recapture threshold, by filing status](/assets/posts/ny-25m-tax-cliff/ny-25m-tax-cliff.png)

The cliff comes from New York's *supplemental income tax*, sometimes called tax benefit recapture. Once New York adjusted gross income exceeds $25 million, the calculation applies the 10.9% top rate to *all* New York taxable income, not only the dollars above $25 million. The supplemental tax recaptures every lower bracket's benefit at once.

## What the cliff looks like

PolicyEngine modeled a wage-only household in New York for 2026, varying employment income around the threshold. The statutory threshold is $25 million of New York adjusted gross income; the simulation steps from $25,000,000 to $25,000,002 — the smallest increment above the threshold that registers as distinct in 64-bit floating-point arithmetic at this scale. The form logic creates the cliff as soon as income is over the threshold.

For a single filer:

| Scenario        |    Earnings | Household net income | NY supplemental tax |
| :-------------- | ----------: | -------------------: | ------------------: |
| At threshold    | $25,000,000 |          $12,628,149 |             $65,286 |
| Above threshold | $25,000,002 |          $12,478,198 |            $215,238 |
| Change          |         +$2 |            -$149,951 |           +$149,952 |

The cliff is similar for every filing status, varying by less than $60 across the five:

| Filing status             | Estimated cliff |
| :------------------------ | --------------: |
| Single                    |        $149,953 |
| Married filing separately |        $149,953 |
| Head of household         |        $149,925 |
| Married filing jointly    |        $149,903 |
| Surviving spouse          |        $149,897 |

The differences track where each status's bracket structure sits at the threshold. Just below $25 million, the tax schedule has not yet fully recaptured the benefit of the lower brackets. Just above it, the top-rate calculation applies to the full taxable-income base. The discontinuity is the size of that remaining benefit.

## Why New York's form creates it

The cliff is not a rounding artifact — it is what the [New York IT-201 instructions](https://www.tax.ny.gov/forms/current-forms/it/it201i.htm) prescribe. Filers compute state tax before credits on line 39, using New York taxable income on line 38 and New York adjusted gross income on line 33. For income above $25 million, the instructions direct filers to multiply taxable income by the top rate. New York's 2026 budget bill keeps the $25 million top threshold and the 10.9% rate in place.[^1]

That produces a discrete jump at the threshold. At exactly $25 million of New York AGI, the lower tax computation still applies. Just above $25 million, the high-income computation applies. In the single-filer simulation, state tax before credits at $25,000,002 matches 10.9% of New York taxable income to within rounding — the high-income worksheet's exact instruction.

The model implementation is the [`ny_supplemental_tax`](https://github.com/PolicyEngine/policyengine-us/blob/master/policyengine_us/variables/gov/states/ny/tax/income/ny_supplemental_tax.py) variable in PolicyEngine-US. The notebook for this analysis is available as an [executed Gist](https://gist.github.com/MaxGhenis/7ea03fb0b121ac4dcd6be822a7b32f7e).

## Is this the largest cliff in America?

It depends on the universe.

Among annual household net-income cliffs modeled in PolicyEngine-US, this is the largest we have found. The next largest is New Jersey's Stay NJ cliff at about $6,500. The New York cliff is about 23 times larger.

We would not call it the largest *policy* cliff in America without qualification. Other policy areas use different bases and can produce larger dollar cliffs. New York's estate tax has its own cliff at 105% of the estate-tax exclusion, where exceeding the threshold eliminates the exclusion entirely.[^2] Estate, transfer, employer-side payroll, and many local programs sit outside PolicyEngine-US.

So the precise claim is:

> New York's $25 million income-tax recapture is the largest annual household net-income cliff modeled in PolicyEngine-US.

## Why this matters

A high marginal rate reduces the return to the next dollar of income. A cliff can make the next dollar reduce net income — sometimes, as here, by a lot.

A household just below $25 million of New York AGI can lose around $150,000 from a single additional dollar of earnings. Discontinuities of this size are easy to miss when analysts inspect only statutory bracket tables: they live in the form, not the schedule. A line that reads "10.9% above $25 million" looks marginal; running the full form calculation shows it is not.

This is why open-source tax-benefit models matter. Cliff effects depend on form-level interactions — recapture lines, supplemental tax worksheets, alternative tax computations — that bracket summaries hide.

[^1]: See Part O of [New York Senate Bill S3009C](https://legislation.nysenate.gov/pdf/bills/2025/S3009C), the fiscal year 2026 revenue bill.

[^2]: New York's Department of Taxation and Finance lists a $7,350,000 basic exclusion for 2026; estates above 105% of that amount lose the exclusion entirely.
