The Keep Your Pay Act (KYPA), introduced by Senator Cory Booker, would more than double the standard deduction, from $32,200 to $75,000 for married couples filing jointly. For high earners around $500,000–$700,000, this creates an interaction with the Alternative Minimum Tax (AMT) that reduces the tax savings by roughly $3,500 compared to a simple bracket calculation.

Senator Booker's [tax calculator](https://www.booker.senate.gov/tax-calculator) does not model this interaction. As a result, it shows larger tax savings than affected filers would actually receive. [PolicyEngine's Keep Your Pay Act calculator](/us/keep-your-pay-act) does account for the AMT interaction.

## How the AMT offsets part of the tax savings

The regular income tax and the AMT are two parallel tax calculations. You pay whichever is higher.

**Regular income tax** uses the standard deduction:

- Taxable income = AGI − standard deduction
- Tax = apply bracket rates to taxable income

**AMT** ignores the standard deduction entirely. It starts from AGI, subtracts its own (smaller) exemption, and applies a flatter rate:

- AMT income = AGI (standard deduction is added back)
- AMT taxable = AMT income − AMT exemption ($140,200 for MFJ in 2026)
- Tentative minimum tax = 26% on first ~$250,000 + 28% above
- AMT owed = max(0, tentative minimum tax − regular tax)

Because AMT doesn't use the standard deduction, increasing the standard deduction has no effect on the AMT calculation. It only reduces the regular tax. If the regular tax drops below the tentative minimum tax, the AMT covers the difference.

## Worked example

Consider a married couple in Texas (no state income tax) earning $587,000 in 2026.

### Current law

| Line item                                          |       Amount |
| :------------------------------------------------- | -----------: |
| AGI                                                |     $587,000 |
| Standard deduction                                 |      $32,200 |
| Taxable income                                     |     $554,800 |
| Regular tax                                        |     $131,719 |
| AMT income                                         |     $587,000 |
| AMT exemption                                      |     $140,200 |
| AMT taxable                                        |     $446,800 |
| Tentative minimum tax                              |    ~$120,200 |
| Regular tax ($131,719) > tentative min (~$120,200) |              |
| **AMT owed**                                       |       **$0** |
| **Total income tax**                               | **$131,719** |

### Under the Keep Your Pay Act

| Line item                                          |        Amount |
| :------------------------------------------------- | ------------: |
| AGI                                                |      $587,000 |
| Standard deduction                                 |       $75,000 |
| Taxable income                                     |      $512,000 |
| Regular tax                                        |      $116,752 |
| AMT income                                         |      $587,000 |
| AMT exemption                                      |      $140,200 |
| AMT taxable                                        |      $446,800 |
| Tentative minimum tax                              |     ~$120,200 |
| Regular tax ($116,752) < tentative min (~$120,200) |               |
| **AMT owed**                                       |   **~$3,500** |
| **Total income tax**                               | **~$120,200** |

### Comparison

|                               | Simple bracket calculation | With AMT |
| :---------------------------- | -------------------------: | -------: |
| Tax savings                   |                    $14,967 |  $11,495 |
| Effective savings reduction   |                          — |   $3,472 |
| Reduction as share of savings |                          — |      23% |

The simple bracket calculation (which is what Senator Booker's calculator uses) shows $14,967 in savings. The AMT offsets $3,472 of that, leaving actual savings of $11,495.

## Who is affected

AMT primarily limits the KYPA savings for filers in the $450,000–$750,000 range (married filing jointly). Below that range, the standard deduction increase doesn't push regular tax below the AMT floor. Above that range, filers are already in higher brackets where the regular tax stays above AMT.

This does not affect lower- and middle-income households, who receive the full value of the standard deduction increase, CTC expansion, and EITC expansion.

## Methodology

All calculations use the [PolicyEngine US microsimulation model](https://policyengine.org) via API, which models AMT alongside regular income tax. The AMT exemption for married filing jointly in 2026 is $140,200 under the One Big Beautiful Bill Act.
