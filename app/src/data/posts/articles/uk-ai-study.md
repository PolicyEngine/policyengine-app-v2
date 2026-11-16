If AI displaces part of the UK workforce, who bears the loss: displaced workers, lower-income households or the Exchequer? Much UK employment is in professional, financial, administrative and managerial jobs that score high on AI-exposure measures ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130); [Department for Education, 2023](https://www.gov.uk/government/publications/the-impact-of-ai-on-uk-jobs-and-training)).

The answer depends on how the shock is distributed as well as on its size, and evidence on who bears AI's labour-market effects remains unsettled. Three views compete:

- **Higher-paid cognitive work.** Exposure-based measures assign greater risk to higher-paid cognitive work ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130)), unlike earlier automation waves that hollowed out mid-skill routine jobs ([Autor, Levy and Murnane, 2003](https://academic.oup.com/qje/article/118/4/1279/1925105); [Goos and Manning, 2007](https://direct.mit.edu/rest/article/89/1/118/57634/Lousy-and-Lovely-Jobs-The-Rising-Polarization-of)).
- **Senior wage premia.** [Autor (2024)](https://www.nber.org/papers/w32140) argues AI compresses the returns to expertise: it lets less experienced workers do tasks previously reserved for specialists, threatening senior wage premia rather than junior jobs.
- **Junior jobs.** Early empirical evidence points the opposite way: larger estimated employment effects for junior than for all positions at more AI-exposed UK firms ([Klein Teeselink, 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5516798)); US junior employment falling after firms adopt AI while senior employment is largely unchanged ([Hosseini Maasoum and Lichtinger, 2026a](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5425555)); and, as a descriptive pattern, employment of 22–25-year-olds in the most exposed US occupations 19% below the path of less exposed peers ([Brynjolfsson, Chandar and Chen, 2026](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine)).

These views imply different household losses, benefit responses and tax effects.

In this [PolicyEngine study](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), we trace AI employment, wage and capital shocks through the UK tax-benefit system with PolicyEngine UK ([Ahmadi et al., 2026](https://doi.org/10.21105/joss.11115)) and Microcosm, PolicyEngine's calibrated microdataset built from the Family Resources Survey 2024–25. We simulate five incidence scenarios — exposure-proportional, junior-concentrated, expertise-compression, uniform and a top-loaded stress test. The central shock calibrations follow a comparable [Irish exercise](https://www.esri.ie/system/files/publications/JR16_0.pdf) (Doorley et al., 2026).

These results are scenario analysis, not prediction: they trace what would follow if labour-market shocks of a given size and incidence materialised, under the tax-benefit rules legislated or announced for 2027–28.

## Methodology

The pipeline has three stages:

- **Exposure.** Every employee in Microcosm is assigned an AI exposure score based on their occupation, using the index of [Felten et al. (2021)](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286) adjusted for how much AI complements rather than substitutes for each occupation ([Pizzinelli et al., 2023](https://www.imf.org/en/publications/wp/issues/2023/10/04/labor-market-exposure-to-ai-cross-country-differences-and-distributional-implications-539656)).
- **Shock.** A set share of employees lose their jobs for the 2027–28 tax year, workers who remain receive wage gains proportional to AI complementarity, and interest and dividend income rises by 39.8%.
- **Tax-benefit response.** PolicyEngine UK recomputes every household's taxes and benefit entitlements in the baseline and shocked worlds, so results net out the interaction of earnings, Universal Credit (UC), income tax and National Insurance.

Microcosm starts from the Family Resources Survey 2024–25, adds records from the HMRC Survey of Personal Incomes to represent top incomes, and calibrates household weights to administrative totals. It grosses to 29.0 million employees in 2027–28.

We measure the Exchequer cost as the fall in PolicyEngine's government balance, which includes income tax, employee and employer National Insurance and benefit spending; a negative cost is a net gain. Displacement is random within occupation groups, so headline results are, where noted, means over 50 randomised draws. Incomes follow the official Households Below Average Income (HBAI) concept, and we measure poverty against absolute thresholds before housing costs (BHC) and after housing costs (AHC).

Three limitations matter most: displaced workers are out of work for the full simulated year, occupations are observed only at the 1-digit level, and the labour-market shocks exclude the self-employed by design. The [full paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479) details the rest.

## Headline results

The central scenario assumes 7% of employees lose their jobs for the full 2027–28 tax year, workers who remain receive a 2.6% average wage rise, and returns to capital increase. The low scenario has 1% displacement and no wage uplift; the high scenario has 13% displacement with the 2.6% uplift. The capital shock applies in all three. Under the central calibration, averaged over 50 draws:

- the Exchequer cost is £7.3 billion for the 2027–28 tax year (standard deviation £1.9 billion);
- absolute poverty after housing costs rises by 2.57 percentage points, and before housing costs by 2.40 points;
- the Gini coefficient rises by 1.76 percentage points.

The central cost is the net of large offsetting flows. Run on its own, the displacement channel costs £42.5 billion, while the survivor-wage channel raises net receipts by £17.5 billion and the capital-income channel by £17.9 billion, because the extra wages, interest and dividends are taxed (means over 20 paired draws). Lost employer National Insurance alone is £8.9 billion (50-draw mean), more than the net cost; excluding it, the central scenario is a net gain of £1.5 billion.

The headline therefore depends on the assumed gains: the central cost reaches zero at a survivor-wage rise of about 3.7% (against 2.6%), a capital-income uplift of about 55% (against 39.8%) or out-of-work spells of about 9.5 months (against 12). These are linear interpolations; the wage figure is from a single draw.

<iframe src="https://uk-ai-study.vercel.app/embed-budget.html" width="100%" height="152" frameborder="0"></iframe>

Table 1 reports, for a single allocation draw (so its central row differs from the 50-draw means above), each scenario's Exchequer cost, after-housing-costs poverty change and change in the Gini coefficient, a standard measure of income inequality. In that draw, the revenue from the capital-income uplift in the low scenario exceeds the cost of 1% displacement, so the Exchequer gains £11.2 billion.

<iframe src="https://uk-ai-study.vercel.app/embed-scenarios.html" width="100%" height="441" frameborder="0"></iframe>

## The three market-income channels

Each scenario combines three channels — displacement, a wage uplift for workers who remain, and a capital-returns shock — with different distributional shapes.

As Figure 1 shows, exposure-proportional displacement rises across the income distribution, from 0.78% of people in the lowest income decile transitioning to unemployment to 5.57% in the highest. (Deciles are ten equal-sized groups of people, ranked by their household's income adjusted for household size.) Most of that gradient reflects where employees sit in the income distribution, since uniform incidence produces a similar one. The allocation is an assumption, not an empirical finding about who AI will displace; the incidence section below varies it.

<iframe src="https://uk-ai-study.vercel.app/chart-transition.html" width="100%" height="483" frameborder="0"></iframe>

The wage channel is close to distributionally flat: gains run from 2.56% in the bottom decile to 2.74% at the top. The capital channel applies the same percentage uplift to everyone's interest and dividend income, but as Figure 2 shows, the pound gains concentrate where capital income is held: the top decile holds 61.1% of all capital income in Microcosm, the bottom decile 2.5%.

<iframe src="https://uk-ai-study.vercel.app/chart-capital.html" width="100%" height="483" frameborder="0"></iframe>

## How the tax-benefit system cushions the shock

The tax-benefit system converts each market-income loss into a smaller disposable-income loss; Figure 3 decomposes this by decile. Benefit entitlements — Universal Credit in particular — rise as displaced earners qualify for means-tested support, and income tax and National Insurance liabilities fall as earnings disappear. In decile 8, which loses most in the draw shown, higher benefits and lower taxes offset about 20% of the market-income loss.

In the top decile the capital uplift offsets, on average, the earnings lost by displaced workers, so losses peak in the upper-middle deciles. Over 20 draws the largest mean loss, 2.91% of disposable income, falls in decile 8 under the HBAI ranking, though which of deciles 6–9 loses most depends on how households are ranked. We do not report a bottom-decile result, because it also depends on the ranking.

<iframe src="https://uk-ai-study.vercel.app/chart-decomposition.html" width="100%" height="523" frameborder="0"></iframe>

<iframe src="https://uk-ai-study.vercel.app/embed-caseloads.html" width="100%" height="181" frameborder="0"></iframe>

## Distributional impact

Figure 4 shows the net effect on household incomes by decile in 2027–28, combining the three channels with the tax-benefit response. Low, Central and High vary the size of the shock around the central 7% rate. Youth-tilted keeps the central shock size but raises displacement probabilities for younger workers within the same occupation quotas.

<iframe src="https://uk-ai-study.vercel.app/distributional-impact.html" width="100%" height="536" frameborder="0"></iframe>

## The shock-size grid

Beyond the presets, we simulate 66 scenarios crossing 11 displacement rates (0–10%) with six wage uplifts (0–5%); Figure 5 maps the results. With no wage growth, average disposable income still rises at 3% displacement and falls from 4%; at the central 7% displacement it falls with up to 4% wage growth and rises with 5%. Danish population-scale evidence finds minimal earnings effects in the first years of diffusion ([Humlum and Vestergaard, 2025](https://www.nber.org/papers/w33777)).

Measured inequality rises in all 66 cells, by between 0.70 and 2.36 percentage points. This result is conditional on the simulated displacement, survivor-wage and capital-income channels; it is not a claim about every possible AI adjustment.

<iframe src="https://uk-ai-study.vercel.app/chart-grid.html" width="100%" height="584" frameborder="0"></iframe>

## Who bears the shock: the incidence axis

The shock-size grid holds incidence fixed; Table 2 varies who bears the shock, with ± values showing the 50-draw standard deviations.

<iframe src="https://uk-ai-study.vercel.app/embed-incidence.html" width="100%" height="726" frameborder="0"></iframe>

Figure 6 shows where each allocation lands across the income distribution. Under every allocation the share transitioning to unemployment is larger in the upper half of the distribution, because employees concentrate in the higher deciles. The stress test anchored to Klein Teeselink (2025) is the most top-tilted, running from 0.19% of the bottom decile transitioning to unemployment to 8.40% of the top.

<iframe src="https://uk-ai-study.vercel.app/chart-incidence-families.html" width="100%" height="623" frameborder="0"></iframe>

Figure 7 puts the fiscal and poverty consequences of each allocation in one chart. The same central shock costs the Exchequer £1.9 billion under uniform incidence, £7.3 billion under exposure-proportional incidence and £27.7 billion under the top-loaded stress test. Mean before-housing-costs poverty rises by between 2.40 and 2.65 percentage points across the four stylised families.

<iframe src="https://uk-ai-study.vercel.app/chart-cost-poverty.html" width="100%" height="483" frameborder="0"></iframe>

## The adjustment margin: job losses versus wage cuts

Displacement is not the only way labour markets adjust. In the task-based framework of [Acemoglu and Restrepo (2022)](https://www.nber.org/papers/w28920), displacement can show up as relative wage declines rather than job loss. The wage-margin family moves the same aggregate earnings loss to wage cuts instead of displacement; Table 3 traces the transition between the two margins, showing one of the 20 draws.

Averaged over 20 paired draws, the same gross earnings loss costs the Exchequer £19.1 billion through wage cuts, against £7.2 billion through displacement. Cuts remove earnings taxed at marginal rates, while displacement removes whole earnings, including the part covered by tax allowances and National Insurance thresholds, so it forgoes less tax per pound of lost earnings.

Under wage cuts, the BHC poverty rise falls from 2.38 to 0.28 percentage points, and the Gini rise from 1.73 to 0.28 points. Without the wage and capital gains, job loss costs the Exchequer 42 pence per pound of earnings lost and wage cuts 55 pence, employer National Insurance included (both over the 20 draws).

<iframe src="https://uk-ai-study.vercel.app/embed-wagemargin.html" width="100%" height="630" frameborder="0"></iframe>

## Age and gender

Under exposure-proportional incidence, workers aged 16–24 account for 8.0% of the displaced, because young people in the UK are concentrated in low-exposure service occupations; the largest displaced group is aged 25–34. Figure 8 compares the Central scenario with the Youth-tilted variant, in which the 16–24 share rises to 12.7%. The early empirical evidence emphasises junior workers _within_ exposed occupations, chiefly through reduced hiring — a margin that stock-based simulations such as this one do not capture.

<iframe src="https://uk-ai-study.vercel.app/chart-age.html" width="100%" height="476" frameborder="0"></iframe>

Exposure also carries a gender gradient: employed women have a mean exposure score of 0.33 against 0.22 for employed men. Women hold 49.1% of employment but account for 53.4% of the displaced in the central scenario. In a single draw, household income falls by 1.53% for women and by 1.49% for men.

## Poverty impact

Table 4 reports the poverty-rate changes under each scenario on a single draw; the 50-draw central means are 2.40 points BHC and 2.57 AHC.

<iframe src="https://uk-ai-study.vercel.app/embed-poverty.html" width="100%" height="364" frameborder="0"></iframe>

The central poverty response assumes a full year of lost earnings. Under a 50% earnings-retention hybrid (approximating a six-month spell), the central scenario becomes a net gain to the Exchequer of £10.1 billion and the BHC poverty rise shrinks to 0.13 percentage points (20 draws; £7.2 billion cost at 12 months on the same draws). Only the displacement channel shrinks under this hybrid: the receipts from survivor wages and capital income do not depend on how long displacement lasts.

The central scenario keeps each benefit unit's baseline Universal Credit take-up decision and pays no new-style Jobseeker's Allowance (JSA) to newly displaced workers. If every benefit unit with a displaced worker claims UC, the central cost is £9.9 billion, against £7.2 billion on the same 20 draws, and the BHC poverty rise is 2.18 points rather than 2.38. Adding 26 weeks of new-style JSA for eligible displaced workers gives £12.6 billion and 1.99 points.

## Inequality impact

Measured inequality rises in every displacement scenario we examine. Under the wage-cut margin above, the Gini also rises, by 0.28 percentage points.

<iframe src="https://uk-ai-study.vercel.app/embed-inequality.html" width="100%" height="210" frameborder="0"></iframe>

## Policy responses

We simulate three stylised responses on top of the central shock, each in force for the 2027–28 tax year only:

- **R1: Wage insurance** — displaced workers receive 50% of their lost earnings, capped at £15,000 a year. We model it as a non-taxable transfer disregarded by means tests, the highest-cost end of possible designs.
- **R2: Universal Credit standard allowance +20%** — modelled inside PolicyEngine, capturing interactions with the taper (the rate at which UC is withdrawn as earnings rise) and the benefit cap.
- **R3: Benefit cap suspension plus a UC taper cut from 55% to 45%**.

Each estimate is what the reform adds, given that the shock has happened. Table 5 and Figure 9 compare the three. Averaged over 50 draws, R1 costs £14.3 billion per percentage point of BHC poverty reduced, R2 £8.6 billion and R3 £6.7 billion. This ratio measures poverty reduction only; wage insurance also serves consumption smoothing for displaced workers.

<iframe src="https://uk-ai-study.vercel.app/embed-policy.html" width="100%" height="638" frameborder="0"></iframe>

<iframe src="https://uk-ai-study.vercel.app/chart-policy.html" width="100%" height="463" frameborder="0"></iframe>

The fiscal arithmetic also depends on where the displaced wage bill — the total earnings previously paid to displaced workers — goes. The [OBR (2026)](https://obr.uk/frs/fiscal-risks-and-sustainability-july-2026/) notes in its fiscal risks report that a shift from labour income to profits lowers receipts, because wages carry a higher average effective tax rate (46%) than profits (27%).

In an accounting sensitivity that replaces the assumed capital uplift, a share of the net fall in labour income reappears as company profit, which pays corporation tax at 25%; companies pay out half of post-tax profit, and a share of the payout reaches UK households. On one draw of the central scenario, the result runs from a net gain of £0.9 billion, when all of the net fall becomes profit owned by UK households, to a cost of £14.4 billion, when half of it does and UK households own half.

## Conclusion

Three findings organise the analysis:

- **Inequality rises.** Measured inequality rises in every calibration we examine — all 66 grid cells (including those with no displacement) and all five incidence families.
- **Incidence changes the cost.** The same central shock costs the Exchequer £7.3 billion under exposure-proportional incidence, £1.9 billion under uniform incidence and £27.7 billion under an author-designed top-loaded stress test.
- **The adjustment margin changes how the loss is shared.** Moving the same earnings loss from job losses to wage cuts raises the fiscal cost and lowers the poverty and Gini changes.

The results point to three areas for further analysis: occupational reallocation, entry prospects for younger workers, and the resilience of a labour-income-heavy tax base. The full paper is available [on SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), with all code and aggregate artefacts in the [uk-ai-study repository](https://github.com/PolicyEngine/uk-ai-study).
