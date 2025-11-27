## Introduction

Salary sacrifice arrangements allow employees to exchange part of their salary for non-cash benefits before tax and National Insurance are calculated. The Financial Times [reported](https://www.ft.com/content/11602ac1-44fc-4b58-8b17-af5e851f5c95) that the government is considering capping the amount that can be put into pension salary sacrifice schemes at £2,000 annually without paying National Insurance. Above this threshold, standard NI rates would apply. UK government guidance [defines](https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye) salary sacrifice as an arrangement where an employee gives up the right to part of their cash pay, usually in return for a non-cash benefit.

HMRC's research [shows](https://www.gov.uk/government/publications/understanding-the-attitudes-and-behaviours-of-employers-towards-salary-sacrifice-for-pensions/understanding-the-attitudes-and-behaviours-of-employers-towards-salary-sacrifice-for-pensions) that salary sacrifice is widely used when it is available: in 2019, 30% of private-sector employees and 9% of public-sector employees in organisations offering salary sacrifice contributed to pensions through these arrangements.

The Financial Times [reports](https://www.ft.com/content/11602ac1-44fc-4b58-8b17-af5e851f5c95) that the government estimates the proposed £2,000 cap would raise around £2 billion, though pension experts have warned that employers may respond by reducing contributions. This analysis examines the cap's impact on households, government revenue, and income distribution.

### Data

This analysis uses salary sacrifice pension contribution data from the Family Resources Survey (FRS). PolicyEngine's microsimulation identifies 1.22 million workers with salary sacrifice pension contributions (3.8% of employees). Among these contributors, average annual contributions are £5,673, with a median of £2,197. For more information on PolicyEngine's data methodology, see the [PolicyEngine UK data documentation](https://policyengine.github.io/policyengine-uk-data/).

### Assumptions

This analysis models the cap's effects under the following assumptions:

1. **Continued pension saving**: Employees currently using salary sacrifice maintain their desire to contribute the same total amount to pensions.

2. **Contribution redirection**: Contributions exceeding the £2,000 cap shift from salary sacrifice to regular employee pension contributions (which receive income tax relief but not National Insurance relief).

3. **Broad-based employer response**: Employers spread the increased National Insurance costs across all employees, maintaining cost neutrality. This is more defensible than assuming employers can target only affected workers, since if employers could identify and reduce compensation for specific individuals, those workers could simply restructure their benefits to avoid the targeting. With £4.93 billion in excess contributions generating £740 million in additional employer NI (at 15%), this translates to a 0.058% reduction in employment income across all workers.

4. **No changes to other benefits**: Employer pension matching rates and other employment benefits remain unchanged.

## Household impact

Under current law, when an employee makes pension contributions through salary sacrifice, both the employee and employer save on National Insurance contributions on the sacrificed amount. As an example, consider an employee earning £50,000 who contributes £5,000 to their pension through salary sacrifice. The table below shows the tax calculation:

**Table 1: Current system - £50,000 earner with £5,000 pension contribution via salary sacrifice**

| Component                           | Amount      | Calculation               |
| :---------------------------------- | :---------- | :------------------------ |
| Gross salary                        | £50,000     |                           |
| Salary sacrifice                    | £5,000      |                           |
| Taxable salary                      | £45,000     | £50,000 - £5,000          |
| Employee NI (8% on £12,570-£45,000) | £2,594      | 8% × (£45,000 - £12,570)  |
| Employer NI (15% on above £9,100)   | £5,385      | 15% × (£45,000 - £9,100)  |
| Income tax (20% on £12,570-£45,000) | £6,486      | 20% × (£45,000 - £12,570) |
| **Take-home pay**                   | **£35,920** | £45,000 - £2,594 - £6,486 |

### Impact of the proposed cap

With the cap in place, an employee previously contributing £5,000 via salary sacrifice faces the following changes under the broad-based employer response: the £3,000 excess becomes taxable income, and the employee redirects it to regular employee pension contributions. The employer spreads its increased NI costs (0.058% of payroll) across all workers, resulting in a £29 reduction for this worker. The employee now pays NI on the £3,000 excess (£240 at 8%), reducing take-home pay from £35,920 to £35,651.

**Table 2: With £2,000 cap - £50,000 earner with broad-based employer response**

| Component                           | Amount      | Calculation                        |
| :---------------------------------- | :---------- | :--------------------------------- |
| Original gross salary               | £50,000     |                                    |
| Broad-based haircut (0.058%)        | £29         | 0.058% × £50,000                   |
| Adjusted gross salary               | £49,971     | £50,000 - £29                      |
| Salary sacrifice                    | £2,000      | Capped at £2,000                   |
| Taxable salary                      | £47,971     | £49,971 - £2,000                   |
| Employee pension contribution       | £3,000      | Full excess redirected             |
| Taxable income (for IT)             | £44,971     | £47,971 - £3,000                   |
| Employee NI (8% on £12,570-£47,971) | £2,832      | 8% × (£47,971 - £12,570)           |
| Income tax (20% on £12,570-£44,971) | £6,480      | 20% × (£44,971 - £12,570)          |
| **Take-home pay**                   | **£35,659** | £47,971 - £3,000 - £2,832 - £6,480 |
| **Total pension contribution**      | **£5,000**  | £2,000 + £3,000                    |

Under the broad-based model, the affected worker maintains their full £5,000 pension contribution, but pays £240 more in employee NI on the excess. Unaffected workers see a £17-£58 annual reduction depending on their salary.

## Government revenue impact

PolicyEngine's microsimulation estimates that in 2026-27, 1.22 million people make pension contributions through salary sacrifice arrangements. Of these, 740,000 (60.8%) would exceed the £2,000 cap.

Under baseline policy, total salary sacrifice contributions amount to £6.93 billion. With the cap in place, £4.93 billion in excess contributions would shift to regular employee pension contributions. The broad-based employer response spreads £740 million in increased employer NI costs across all workers (a 0.058% haircut). Combined with £394 million in new employee NI on the excess, this generates total government revenue of £1.13 billion in 2026-27, rising to £1.20 billion by 2029-30.

**Table 3: Revenue impact of £2,000 salary sacrifice cap, 2026-27 to 2029-30**

| Fiscal year | Revenue increase (£bn) |
| :---------- | :--------------------- |
| 2026-27     | 1.12                   |
| 2027-28     | 1.12                   |
| 2028-29     | 1.16                   |
| 2029-30     | 1.20                   |

### Alternative behavioural responses

The revenue estimates above assume employees redirect their excess contributions to regular pension contributions, preserving their pension savings while losing only the NI relief. However, some employees may instead take the excess as taxable cash.

If employees take cash rather than maintaining pension contributions, revenue increases substantially—from £1.12 billion to £2.02 billion in 2026-27. This near-doubling of revenue occurs because:

1. **Pension contributions receive income tax relief**: When employees redirect excess to regular pension contributions, they still receive income tax relief on those contributions. They only lose the NI relief.

2. **Cash is fully taxable**: If employees take the excess as cash instead, they pay both income tax and National Insurance on the full amount. A higher-rate taxpayer taking £3,000 as cash faces 40% income tax plus 2% NI, compared to just 2% NI if they maintain pension contributions.

The interactive chart below shows revenue under all four combinations of employer response (spread vs absorb costs) and employee response (maintain pension vs take cash):

<iframe src="https://policyengine.github.io/uk-salary-sacrifice-analysis/revenue-by-year.html" width="100%" height="550" frameborder="0"></iframe>

This estimate is lower than the government's £2 billion figure, which may reflect differences in salary sacrifice data. The FRS-based data shows £6.93 billion in total salary sacrifice contributions, while external estimates based on NI relief costs suggest total contributions could be closer to £20 billion. If the underlying data were scaled to match these external estimates, revenue would be approximately £3 billion.

## Distributional analysis

The impact of the cap varies significantly by income and behavioural response. Under the baseline scenario (Spread Cost + Maintain Pension), lower-income deciles see small positive impacts from the employer cost-spreading, while upper deciles face losses. The top decile sees a 0.16% reduction in employment income, while decile 9 sees a 0.03% reduction.

If employees take cash instead of maintaining pension contributions, the impacts are larger and more concentrated at the top. The top decile would lose 0.33% of employment income—roughly double the loss under the "maintain pension" scenario—because they pay full income tax rather than just National Insurance on the excess.

The interactive chart below shows the distributional impact across all four behavioural scenarios:

<iframe src="https://policyengine.github.io/uk-salary-sacrifice-analysis/distributional-impact.html" width="100%" height="550" frameborder="0"></iframe>

Under all scenarios, the cap is progressive: lower-income households are largely unaffected while higher earners bear the burden. This reflects both the concentration of salary sacrifice usage among higher earners and the tendency for high earners to contribute amounts exceeding the £2,000 cap.

## Conclusion

The cap would raise between £1.1 billion and £2.3 billion annually depending on behavioural responses, affecting 740,000 workers who currently contribute above £2,000. If employees redirect excess contributions to regular pension schemes (preserving pension savings), revenue would be £1.1–1.4 billion. If employees take the excess as taxable cash, revenue would nearly double to £2.0–2.3 billion because they would pay full income tax rather than just National Insurance on the excess.

These estimates are lower than the government's £2 billion figure, likely due to differences in underlying salary sacrifice data. The impact is progressive under all scenarios: higher earners experience larger reductions while lower-income households are largely unaffected. The interactive charts above allow you to explore how different behavioural assumptions affect both revenue and distributional outcomes.

## Appendix: Data construction methodology

The Family Resources Survey (FRS) does not directly identify which pension contributions are made via salary sacrifice arrangements. To construct this variable, we use the following methodology:

### Imputation approach

1. **Identify salary sacrifice respondents**: The FRS asks a subset of respondents whether their pension contributions are made through salary sacrifice. We use these responses as a training set.

2. **Predict salary sacrifice usage**: Using the subset of respondents who answered the salary sacrifice question, we train a model to predict salary sacrifice usage based on observable characteristics including employment income, pension contribution amounts, employer type, and other demographic factors.

3. **Impute for non-respondents**: We apply this model to impute salary sacrifice status for respondents who were not asked the question, generating a complete picture of salary sacrifice usage across the population.

### Calibration

After imputation, we calibrate the dataset using PolicyEngine's standard [reweighting methodology](https://policyengine.github.io/policyengine-uk-data/) to match administrative totals. This salary sacrifice-enhanced dataset is available alongside PolicyEngine's standard UK datasets for researchers who wish to analyse salary sacrifice reforms.

### Limitations

The imputation approach assumes that salary sacrifice usage patterns among non-respondents are similar to those among respondents with similar characteristics. If employers systematically offer salary sacrifice to workers with unobservable characteristics that differ from our predictors, our estimates may be biased. The lower revenue estimates compared to government figures may reflect either data limitations or differences in behavioural assumptions.
