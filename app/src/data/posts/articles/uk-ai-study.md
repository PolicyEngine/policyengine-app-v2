If artificial intelligence displaces a share of UK employment, who bears the resulting loss: displaced workers, lower-income households, or the Exchequer — the government's finances? A large share of UK employment sits in professional, financial, administrative and managerial occupations that score high on common AI-exposure measures ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130); [DSIT, 2023](https://www.gov.uk/government/publications/the-impact-of-ai-on-uk-jobs-and-training)).

The answer depends not only on the size of the shock but on how it is distributed, and evidence on who bears AI's labour-market effects remains unsettled. Three views compete. Exposure-based measures assign greater risk to higher-paid cognitive work ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130)), suggesting AI breaks with earlier automation waves that hollowed out mid-skill routine jobs ([Autor, Levy and Murnane, 2003](https://academic.oup.com/qje/article/118/4/1279/1925105); [Goos and Manning, 2007](https://direct.mit.edu/rest/article/89/1/118/57634/Lousy-and-Lovely-Jobs-The-Rising-Polarization-of)). A second account, associated with [Autor (2024)](https://www.nber.org/papers/w32140), argues AI's distinctive effect is to compress the returns to expertise: by supplying knowledge on demand, it lets less experienced workers do tasks previously reserved for specialists, threatening senior wage premia rather than junior jobs. A third strand of early empirical evidence points the opposite way — larger estimated employment effects for junior than for all positions at more AI-exposed UK firms ([Klein Teeselink, 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5516798)), US junior employment falling about 9% within six quarters of firm AI adoption while senior employment is unaffected ([Hosseini and Lichtinger, 2026a](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5425555)), and employment of 22–25-year-olds in the most exposed US occupations standing 19% below the path of less exposed peers ([Brynjolfsson, Chandar and Chen, 2026](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine), August 2026 version). These are distinct hypotheses about incidence — who ultimately bears the loss — rather than refinements of a single estimate, and they imply different household losses, benefit responses and tax effects.

In this [PolicyEngine study](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), we trace AI employment, wage and capital shocks through the full UK tax-benefit system with PolicyEngine UK ([Ahmadi et al., 2026](https://doi.org/10.21105/joss.11115)) and Microcosm, PolicyEngine's calibrated microdataset built from the Family Resources Survey 2024–25. Rather than picking one incidence view, we simulate all of them as explicit scenarios — exposure-proportional, junior-concentrated, expertise-compression, uniform and a top-loaded stress test — and extend the analysis to the adjustment margin (job losses versus wage cuts), age and gender incidence, benefit caseloads and policy responses. The central shock calibrations follow the conventions of a comparable [Irish exercise](https://www.esri.ie/system/files/publications/JR16_0.pdf) (Doorley et al., 2026), which allows a direct cross-country benchmark.

These results are scenario analysis, not prediction: they trace what would follow if labour-market shocks of a given size and incidence materialised, under the tax-benefit rules legislated or announced for 2027–28.

## Methodology

The pipeline has three stages. First, every employee in Microcosm is assigned an AI exposure score based on their occupation, using the AI Occupational Exposure index of [Felten et al. (2021)](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286) adjusted for how much AI complements rather than substitutes for each occupation ([Pizzinelli et al., 2023](https://www.imf.org/en/publications/wp/issues/2023/10/04/labor-market-exposure-to-ai-cross-country-differences-and-distributional-implications-539656)). Second, the shock: a set share of employees lose their jobs for the simulated year, the 2027–28 tax year (drawn across occupations in proportion to exposure, or reallocated under the alternative incidence families), workers who remain receive wage gains proportional to AI complementarity, and interest and dividend income rises by 39.8%. Third, PolicyEngine UK recomputes every household's taxes and benefit entitlements in both the baseline and shocked worlds, so all results net out the full interaction of earnings, Universal Credit (UC), income tax and National Insurance contributions (NICs). The model applies the rules legislated or announced for 2027–28: the main income tax and National Insurance thresholds stay frozen, the basic and higher dividend rates are 2 points higher from April 2026, and savings income, and property income outside Scotland, are taxed at rates 4 points above the standard rates from April 2027, of which 2 points are announced but not yet legislated.

Microcosm starts from the Family Resources Survey 2024–25, adds records from the HMRC Survey of Personal Incomes (SPI) to represent top incomes, and calibrates household weights to administrative totals, including SPI income by band up to £1 million. It grosses to 29.0 million employees in 2027–28.

We measure the Exchequer cost as the fall in PolicyEngine's government balance, which includes income tax, employee and employer National Insurance and benefit spending; a negative cost is a net gain. Household consumption is held at its baseline level, so indirect taxes do not respond. Displacement is random within occupation groups, so headline results are, where noted, means over 50 randomised draws (each from a fixed random seed, so runs are reproducible and comparable); the ± values are standard deviations across those draws, measuring allocation noise (which workers within an occupation are hit) rather than population sampling uncertainty. Because all incidence families share the same seeds, differences between them can be compared draw by draw. Incomes follow the official Households Below Average Income (HBAI) disposable-income concept; poverty is measured against absolute thresholds both before housing costs (BHC) and after housing costs (AHC). Three limitations matter most: displaced workers are out of work for the full simulated year (under a 50% earnings-retention approximation of a six-month spell, the central cost of £7.2 billion on the same 20 draws turns into a net gain of £10.1 billion), occupations are observed only at the 1-digit level, and the self-employed are excluded from the labour-market shocks by design. The [full paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479) details the rest.

## Headline results

The central scenario assumes 7% of employees lose their jobs for the full 2027–28 tax year, workers who remain receive a 2.6% average wage rise, and returns to capital increase — the conventions of the Irish exercise, which converts quantities discussed by [Briggs and Kodnani (2023)](https://www.gspublishing.com/content/research/en/reports/2023/03/27/d64e052b-0f6e-45d7-967b-d7be35fabd16.pdf) into scenario inputs. The low and high scenarios bracket it with 1% and 13% displacement. Under the central calibration, averaged over 50 draws:

- the Exchequer cost is £7.3 billion for the 2027–28 tax year (standard deviation £1.9 billion);
- absolute poverty after housing costs rises by 2.57 percentage points, and before housing costs by 2.40 points;
- the Gini coefficient rises by 1.76 percentage points.

The central cost is the net of large offsetting flows. Run on its own, the displacement channel costs £42.5 billion, while the survivor-wage channel raises net receipts by £17.5 billion and the capital-income channel by £17.9 billion, because the extra wages, interest and dividends are taxed (means over 20 paired draws). Employer National Insurance accounts for £8.9 billion of the central cost. The headline therefore depends on the assumed survivor-wage and capital-income gains and on how much dividend income the data hold at the top: the central cost reaches zero at a survivor-wage rise of 3.7% (against 2.6%), a capital-income uplift of about 55% (against 39.8%) or out-of-work spells of about 9.5 months (against 12).

<iframe src="https://uk-ai-study.vercel.app/embed-budget.html" width="100%" height="152" frameborder="0"></iframe>

Table 1 reports each scenario's Exchequer cost, poverty-rate change after housing costs (AHC, in percentage points, pp) and the change in the Gini coefficient (a standard measure of income inequality, where higher values mean more inequality). All figures are annual effects for the 2027–28 tax year. In the low scenario the revenue from the capital-income uplift exceeds the cost of 1% displacement, so the Exchequer gains £11.2 billion.

<iframe src="https://uk-ai-study.vercel.app/embed-scenarios.html" width="100%" height="441" frameborder="0"></iframe>

## The three market-income channels

Each scenario combines three channels through which AI changes market incomes: a displacement shock (workers who lose their jobs, drawn in proportion to how exposed their occupation is to AI), a wage uplift for workers who remain (proportional to how much AI complements their work), and a capital-returns shock (part of the productivity gain flowing to owners of capital).

The channels have different distributional shapes. As Figure 1 shows, displacement allocated in proportion to exposure rises across the income distribution — from 0.78% of people in the lowest income decile (deciles are ten equal-sized groups of people, ranked by their household's income adjusted for household size) transitioning to unemployment to 5.57% in the highest. Most of that gradient reflects where employees sit in the income distribution, since uniform incidence produces a similar one; the exposure-proportional allocation steepens it, because the professional and administrative occupations that score highest on exposure sit in the upper half of the income distribution. The allocation is an assumption, not an empirical finding about who AI will in fact displace; we vary that assumption explicitly in the incidence section below.

<iframe src="https://uk-ai-study.vercel.app/chart-transition.html" width="100%" height="483" frameborder="0"></iframe>

The wage channel is close to distributionally flat: gains run from 2.56% in the bottom decile to 2.74% at the top. The capital channel applies the same percentage uplift to everyone's interest and dividend income, but as Figure 2 shows, the pound gains concentrate where capital income is held: the top decile holds 61.1% of all capital income in Microcosm, the bottom decile 2.5%.

<iframe src="https://uk-ai-study.vercel.app/chart-capital.html" width="100%" height="483" frameborder="0"></iframe>

## How the tax-benefit system cushions the shock

The tax-benefit system converts each market-income loss into a smaller disposable-income loss; Figure 3 decomposes this by decile. Benefit entitlements — Universal Credit in particular — rise as displaced earners qualify for means-tested support, and income tax and National Insurance liabilities fall as earnings disappear. In decile 8, which loses most in the draw shown, higher benefits and lower taxes offset about 20% of the market-income loss. In the top decile the capital uplift offsets, on average, the earnings lost by displaced workers. Losses therefore peak in the upper-middle deciles: over 20 draws the largest mean loss, 2.91% of disposable income, falls in decile 8 under the HBAI ranking, though which of deciles 6–9 loses most depends on how households are ranked. The bottom decile's result also depends on the ranking, because a few heavily weighted households with large personal pension contributions sit in it under the HBAI ranking, so we do not report a bottom-decile result.

<iframe src="https://uk-ai-study.vercel.app/chart-decomposition.html" width="100%" height="523" frameborder="0"></iframe>

<iframe src="https://uk-ai-study.vercel.app/embed-caseloads.html" width="100%" height="181" frameborder="0"></iframe>

## Distributional impact

Combining the three channels with the tax-benefit response gives the net effect on household incomes by decile in 2027–28, shown in Figure 4. The four scenarios are Low, Central and High, which vary the size of the displacement shock around the central 7% rate, plus Youth-tilted, which keeps the central shock size but raises displacement probabilities for younger workers within the same occupation quotas.

<iframe src="https://uk-ai-study.vercel.app/distributional-impact.html" width="100%" height="536" frameborder="0"></iframe>

## The shock-size grid

Beyond the presets, we simulate 66 scenarios crossing 11 displacement rates (0–10%) with six wage uplifts (0–5%); Figure 5 maps the results. With no wage growth, average disposable income still rises at 3% displacement and falls from 4%; at the central 7% displacement it falls with up to 4% wage growth and rises with 5%. The empirical literature remains uncertain about that balance, with population-scale Danish evidence finding minimal earnings effects in the first years of diffusion ([Humlum and Vestergaard, 2025](https://www.nber.org/papers/w33777)) while other estimates imply much larger reallocation. Measured inequality rises in all 66 cells, by between 0.70 and 2.36 percentage points. This is a conditional result of the simulated displacement, survivor-wage and capital-income channels rather than a claim about every possible AI adjustment.

<iframe src="https://uk-ai-study.vercel.app/chart-grid.html" width="100%" height="584" frameborder="0"></iframe>

## Who bears the shock: the incidence axis

The shock-size grid holds incidence fixed; the next axis varies who bears it. Table 2 reports the results for the 2027–28 tax year, with ± values showing the 50-draw standard deviations described in the methodology.

<iframe src="https://uk-ai-study.vercel.app/embed-incidence.html" width="100%" height="726" frameborder="0"></iframe>

Figure 6 shows where each allocation lands across the income distribution. Under every allocation the share transitioning to unemployment is larger in the upper half of the distribution than in the lower half, because employees concentrate in the higher deciles. Uniform incidence moves a larger share of the lower and middle deciles to unemployment than exposure-proportional incidence, and the stress test anchored to Klein Teeselink (2025) is the most top-tilted, running from 0.19% of the bottom decile transitioning to unemployment to 8.40% of the top.

<iframe src="https://uk-ai-study.vercel.app/chart-incidence-families.html" width="100%" height="623" frameborder="0"></iframe>

Figure 7 puts the fiscal and poverty consequences of each allocation in one chart, with error bars showing the Table 2 uncertainty. The same central shock costs the Exchequer £1.9 billion under uniform incidence, £7.3 billion under exposure-proportional incidence and £27.7 billion under the top-loaded stress test. Mean before-housing-costs poverty rises by between 2.40 and 2.65 percentage points across the four stylised families.

<iframe src="https://uk-ai-study.vercel.app/chart-cost-poverty.html" width="100%" height="483" frameborder="0"></iframe>

## The adjustment margin: job losses versus wage cuts

Displacement is not the only way labour markets adjust. In US evidence from [Acemoglu and Restrepo (2022)](https://www.nber.org/papers/w28920), task displacement operated chiefly through relative wage declines rather than job loss. The wage-margin family moves the same aggregate earnings loss to wage cuts instead of displacement, using occupation-level gradients including the expertise measure of [Hosseini and Lichtinger (2026b)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6059674); Table 3 traces the transition between the two margins.

Averaged over 20 paired draws, delivering the same gross earnings loss through wage cuts costs the Exchequer £19.1 billion, against £7.2 billion through displacement, because cuts remove earnings taxed at marginal rates, while displacement removes whole earnings, including the part covered by tax allowances and National Insurance thresholds, so it forgoes less tax per pound of lost earnings; that difference outweighs the extra means-tested benefits that displacement triggers. The BHC poverty rise falls from 2.38 to 0.28 percentage points, and the Gini rise from 1.73 to 0.28 points. Without the wage and capital gains, job loss costs the Exchequer 42 pence per pound of earnings lost and wage cuts 55 pence, employer National Insurance included (both over the 20 draws). If every displaced worker's benefit unit claims Universal Credit and eligible displaced workers receive new-style Jobseeker's Allowance, the job-loss figure on one draw rises from 43 to 48 pence, still below the wage-cut figure. Table 3 shows one of the 20 draws.

<iframe src="https://uk-ai-study.vercel.app/embed-wagemargin.html" width="100%" height="630" frameborder="0"></iframe>

## Age and gender

Under exposure-proportional incidence, workers aged 16–24 account for 8.0% of the displaced, because young people in the UK are concentrated in low-exposure service occupations; the largest displaced group is aged 25–34. Figure 8 compares the Central scenario with the Youth-tilted variant, which raises displacement probabilities for younger workers within the same occupation quotas: the 16–24 share rises to 12.7%. The strongest early empirical evidence locates AI's employment effects among junior workers _within_ exposed occupations, operating chiefly through reduced hiring — a margin that stock-based simulation frameworks such as this one do not capture by construction.

<iframe src="https://uk-ai-study.vercel.app/chart-age.html" width="100%" height="476" frameborder="0"></iframe>

Exposure also carries a gender gradient: employed women have a mean exposure score of 0.33 against 0.22 for employed men, reflecting women's concentration in administrative, professional and associate-professional work. Women hold 49.1% of employment but account for 53.4% of the displaced in the central scenario, echoing the international evidence that female employment is more exposed to generative AI ([ILO, 2025](https://www.ilo.org/sites/default/files/2025-05/WP140_web.pdf)). In a single draw, household income falls by 1.53% for women and by 1.49% for men. Income pooling within couples may mute the individual asymmetry at the household level; we offer this as a hypothesis rather than a finding.

## Poverty impact

Table 4 reports the poverty-rate changes under each scenario.

<iframe src="https://uk-ai-study.vercel.app/embed-poverty.html" width="100%" height="364" frameborder="0"></iframe>

The central poverty response follows from the framework's assumptions: a full year of lost earnings against Universal Credit replacement rates and a fixed poverty line. Under a 50% earnings-retention hybrid (approximating a six-month spell), the central scenario becomes a net gain to the Exchequer of £10.1 billion and the BHC poverty rise shrinks to 0.13 percentage points. Only the displacement channel shrinks under this hybrid: workers who keep half a year's earnings still pay tax and draw less means-tested support, while the receipts from survivor wages and capital income do not depend on how long displacement lasts.

The central scenario keeps the Universal Credit take-up decision drawn for each benefit unit in the baseline data and pays no new-style Jobseeker's Allowance (JSA) to newly displaced workers, who would usually qualify for it. If every benefit unit with a displaced worker claims UC, the central cost is £9.9 billion, against £7.2 billion on the same 20 draws, and the BHC poverty rise is 2.18 points rather than 2.38. Adding 26 weeks of new-style JSA for eligible displaced workers gives £12.6 billion and 1.99 points.

## Inequality impact

Measured inequality rises in every displacement scenario we examine. Under the wage-cut margin above, the Gini also rises, by 0.28 percentage points.

<iframe src="https://uk-ai-study.vercel.app/embed-inequality.html" width="100%" height="210" frameborder="0"></iframe>

## Policy responses

If the shock is structural rather than cyclical, the existing tax-benefit system already cushions part of it — about 20% of the market-income loss in the decile facing the largest loss — and the remaining question is what further reductions in hardship would cost. We simulate three stylised responses on top of the central shock, each in force for the 2027–28 tax year only:

- **R1: Wage insurance** — in the spirit of trade-adjustment proposals, displaced workers receive 50% of their lost earnings, capped at £15,000 a year. It is modelled as a non-taxable transfer disregarded by means tests, representing the upper end of plausible implementations.
- **R2: Universal Credit standard allowance +20%** — a demand-side boost within the existing architecture, implemented as a parameter reform inside PolicyEngine so all interactions with the taper (the rate at which UC is withdrawn as earnings rise), the benefit cap and linked (passported) entitlements are captured.
- **R3: Benefit cap suspension plus a UC taper cut from 55% to 45%** — targeting the households for whom the benefit cap and taper bind most strongly.

Each estimate is the difference between the shocked-plus-reform and shocked worlds: what the reform adds, given that the shock has happened. Table 6 and Figure 9 compare the three. Averaged over 50 draws, R1 costs £14.3 billion per percentage point of BHC poverty reduced, R2 £8.6 billion and R3 £6.7 billion. This ratio measures poverty reduction only; wage insurance also serves consumption smoothing for displaced workers.

<iframe src="https://uk-ai-study.vercel.app/embed-policy.html" width="100%" height="638" frameborder="0"></iframe>

<iframe src="https://uk-ai-study.vercel.app/chart-policy.html" width="100%" height="463" frameborder="0"></iframe>

Targeted retraining is a further relevant lever outside this comparison: US evidence finds rising returns to publicly funded retraining for workers from the most AI-exposed occupations, largely through moves into less-exposed work ([Hyman et al., 2025](https://www.nber.org/papers/w34174)).

Another channel matters for the fiscal arithmetic: where does the displaced wage bill — the total earnings previously paid to displaced workers — go? Task-based models imply automation shifts income from labour to capital ([Acemoglu and Restrepo, 2018](https://www.aeaweb.org/articles?id=10.1257/aer.20160696)), and the [OBR (2026)](https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/) notes that such a shift depresses receipts because labour income carries a higher effective tax rate. In an accounting sensitivity, a share of the net fall in labour income reappears as company profit, which pays corporation tax at 25%; companies pay out half of post-tax profit, and a share of the payout reaches UK households. On one draw of the central scenario, the result runs from a net gain of £0.9 billion, when all of the net fall in labour income becomes profit owned by UK households, to a cost of £14.4 billion, when half of it does and UK households own half. This is static accounting layered on the microsimulation: the share of the wage bill that becomes taxable profit is a parameter the framework cannot pin down, so we present a range rather than a point estimate.

## Conclusion

These results are scenario analysis, not prediction: they trace what would follow if labour-market shocks of a given size and incidence materialised, under the tax-benefit rules legislated or announced for 2027–28. Three findings organise the analysis. First, measured inequality rises in every displacement calibration we examine — all 66 grid cells and all five incidence families — because zero earnings for selected workers, partial tax-benefit replacement, wage gains for workers who remain in employment and the capital uplift jointly widen post-shock income gaps. Second, who bears the shock changes its simulated cost: the same central shock costs the Exchequer £7.3 billion under exposure-proportional incidence, £1.9 billion under uniform incidence and £27.7 billion under an author-designed top-loaded stress test. Third, the adjustment margin changes how the loss is shared: moving the same earnings loss from job losses to wage cuts raises the fiscal cost and lowers the poverty and Gini changes.

The central cost of £7.3 billion a year nets a displacement cost against receipts from survivor wages and capital income, and employer National Insurance contributes £8.9 billion of it. The results point to three areas for further analysis: occupational reallocation, entry prospects for younger workers, and the resilience of a labour-income-heavy tax base. The full paper — including the shock-size grid, Monte Carlo uncertainty, duration, take-up and dividend-coverage sensitivities, benchmarking against the Irish results, and limitations — is available [on SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), with all code and aggregate artefacts in the [uk-ai-study repository](https://github.com/PolicyEngine/uk-ai-study).
