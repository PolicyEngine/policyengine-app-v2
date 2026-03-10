The Keep Your Pay Act (KYPA), introduced by Senator Cory Booker, would more than double the standard deduction, from $32,200 to $75,000 for married couples filing jointly. For some high earners, this creates an interaction with the Alternative Minimum Tax (AMT) that claws back over half of the tax savings compared to a simple bracket calculation.

Senator Booker's [tax calculator](https://www.booker.senate.gov/tax-calculator) does not model this interaction. As a result, it shows larger tax savings than affected filers would actually receive. [PolicyEngine's Keep Your Pay Act calculator](/us/keep-your-pay-act) does account for the AMT interaction.

## How the AMT offsets part of the tax savings

The regular income tax and the AMT are two parallel tax calculations. You pay whichever is higher.

**Regular income tax** uses the standard deduction:

- Taxable income = AGI − standard deduction
- Tax = apply bracket rates to taxable income

**AMT** computes its own taxable base. It starts from taxable income, adds back the standard deduction and other preference items, then subtracts its own (smaller) exemption and applies a flatter rate:

- AMT income (AMTI) = taxable income + standard deduction + other AMT preference items
- AMT taxable = AMTI − AMT exemption ($140,200 for MFJ in 2026)
- Tentative minimum tax = 26% on first ~$250,000 + 28% above
- AMT owed = max(0, tentative minimum tax − regular tax)

Because AMTI adds back the standard deduction, increasing the standard deduction has no effect on the AMT calculation. It only reduces the regular tax. If the regular tax drops below the tentative minimum tax, the AMT covers the difference.

## Worked example

Consider a married couple in Texas (no state income tax) earning $500,000 in 2026.

| Line item             |  Current law |        KYPA |  Difference |
| :-------------------- | -----------: | ----------: | ----------: |
| AGI                   |     $500,000 |    $500,000 |           — |
| Standard deduction    |      $32,200 |     $75,000 |    +$42,800 |
| Taxable income        |     $467,800 |    $425,000 |    −$42,800 |
| Regular tax           |     $102,608 |     $88,912 |    −$13,696 |
| AMTI                  |     $500,000 |    $500,000 |           — |
| AMT exemption         |     $140,200 |    $140,200 |           — |
| AMT taxable           |     $359,800 |    $359,800 |           — |
| Tentative minimum tax |      $95,864 |     $95,864 |           — |
| **AMT owed**          |       **$0** |  **$6,952** | **+$6,952** |
| **Total income tax**  | **$102,608** | **$95,864** | **−$6,744** |

The simple bracket calculation shows $13,696 in savings (the regular tax difference). But KYPA pushes the regular tax below the tentative minimum tax, triggering $6,952 in AMT. The actual tax savings are $6,744 — 51% less than the headline figure. Senator Booker's calculator uses the simple bracket calculation and does not account for this AMT interaction.

## Who is affected

AMT primarily limits the KYPA savings for filers in the $450,000–$750,000 range (married filing jointly). Below that range, the standard deduction increase doesn't push regular tax below the AMT floor. Above that range, filers are already in higher brackets where the regular tax stays above AMT.

This does not affect lower- and middle-income households, who receive the full value of the standard deduction increase, CTC expansion, and EITC expansion.

## Methodology

All calculations use the [PolicyEngine US microsimulation model](https://policyengine.org) via API, which models AMT alongside regular income tax. The AMT exemption for married filing jointly in 2026 is $140,200 under the One Big Beautiful Bill Act.
