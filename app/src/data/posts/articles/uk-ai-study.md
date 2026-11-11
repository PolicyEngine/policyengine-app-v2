If artificial intelligence displaces a share of UK employment, who bears the resulting loss: displaced workers, lower-income households, or the Exchequer — the government's finances? The UK has one of the most AI-exposed workforces among advanced economies, with employment concentrated in professional, financial, administrative and managerial occupations that score high on common AI-exposure measures ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130); [DSIT, 2023](https://www.gov.uk/government/publications/the-impact-of-ai-on-uk-jobs-and-training)).

The answer depends not only on the size of the shock but on how it is distributed, and evidence on who bears AI's labour-market effects remains unsettled. Three views compete. Exposure-based measures assign greater risk to higher-paid cognitive work ([Felten et al., 2021](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286); [Eloundou et al., 2023](https://arxiv.org/abs/2303.10130)), suggesting AI breaks with earlier automation waves that hollowed out mid-skill routine jobs ([Autor, Levy and Murnane, 2003](https://academic.oup.com/qje/article/118/4/1279/1925105); [Goos and Manning, 2007](https://direct.mit.edu/rest/article/89/1/118/57634/Lousy-and-Lovely-Jobs-The-Rising-Polarization-of)). A second account, associated with [Autor (2024)](https://www.nber.org/papers/w32140), argues AI's distinctive effect is to compress the returns to expertise: by supplying knowledge on demand, it lets less experienced workers do tasks previously reserved for specialists, threatening senior wage premia rather than junior jobs. A third strand of early empirical evidence points the opposite way — UK firm-level job cuts concentrated almost entirely in junior roles ([Klein Teeselink, 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5516798)), US junior employment falling about 9% within six quarters of firm AI adoption while senior employment is unaffected ([Hosseini and Lichtinger, 2026a](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5425555)), and a 16% relative employment decline among 22–25-year-olds in the most exposed US occupations ([Brynjolfsson, Chandar and Chen, 2025](https://digitaleconomy.stanford.edu/wp-content/uploads/2025/08/Canaries_BrynjolfssonChandarChen.pdf)). These are distinct hypotheses about incidence — who ultimately bears the loss — rather than refinements of a single estimate, and they imply different household losses, benefit responses and tax effects.

In this [PolicyEngine study](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), we trace AI employment, wage and capital shocks through the full UK tax-benefit system with PolicyEngine UK and Family Resources Survey 2024–25 microdata. Rather than picking one incidence view, we simulate all of them as explicit scenarios — exposure-proportional, junior-concentrated, expertise-compression, uniform and a top-loaded stress test — and extend the analysis to the adjustment margin (job losses versus wage cuts), age and gender incidence, benefit caseloads, regional impacts, and policy responses. The central shock calibrations follow the conventions of a comparable [Irish exercise](https://www.esri.ie/system/files/publications/JR16_0.pdf) (Doorley et al., 2026), which allows a direct cross-country benchmark.

These results are scenario analysis, not prediction: they trace what would follow if labour-market shocks of a given size and incidence materialised, under tax-benefit rules as legislated.

## Methodology

The pipeline has three stages. First, every working adult in the Family Resources Survey 2024–25 is assigned an AI exposure score based on their occupation, using the AI Occupational Exposure index of [Felten et al. (2021)](https://onlinelibrary.wiley.com/doi/10.1002/smj.3286) adjusted for how much AI complements rather than substitutes for each occupation ([Pizzinelli et al., 2023](https://www.imf.org/en/publications/wp/issues/2023/10/04/labor-market-exposure-to-ai-cross-country-differences-and-distributional-implications-539656)). Second, the shock: a set share of employees lose their jobs for the simulated year, 2026 (drawn across occupations in proportion to exposure, or reallocated under the alternative incidence families), workers who remain receive wage gains proportional to AI complementarity, and interest and dividend income rises. Third, PolicyEngine UK recomputes every household's taxes and benefit entitlements in both the baseline and shocked worlds, so all results net out the full interaction of earnings, Universal Credit (UC), income tax and National Insurance contributions (NICs).

Displacement is random within occupation groups, so headline results are, where noted, reported as means over 50 randomised draws (each run from a fixed random seed, so runs are reproducible and comparable); the ± values quoted throughout are standard deviations across those draws, measuring allocation noise (which workers within an occupation are hit) rather than population sampling uncertainty. Because all incidence families share the same seeds, differences between them can be compared draw by draw. Incomes follow the official Households Below Average Income (HBAI) disposable-income concept; poverty is measured against absolute thresholds both before housing costs (BHC) and after housing costs (AHC), so poverty changes are measured against fixed real thresholds. Three limitations matter most: displaced workers are out of work for the full simulated year (a six-month approximation cuts the fiscal cost by more than three-quarters), occupations are observed only at the 1-digit level, and the self-employed are excluded. The [full paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479) details the rest.

## Headline results

The central scenario assumes 7% of employees lose their jobs for the full 2026 tax year, workers who remain receive a 2.6% average wage rise, and returns to capital increase — a calibration built from the task-exposure and productivity estimates of [Briggs and Kodnani (Goldman Sachs, 2023)](https://www.gspublishing.com/content/research/en/reports/2023/03/27/d64e052b-0f6e-45d7-967b-d7be35fabd16.pdf). The low and high scenarios bracket it with smaller and larger displacement rates from the wider literature. Under the central calibration, the simulated Exchequer cost is £18.2 billion for the 2026 tax year, absolute poverty measured after housing costs rises by 1.85 percentage points, and the Gini coefficient rises by 1.04 percentage points.

<iframe src="https://uk-ai-study.vercel.app/embed-budget.html" width="100%" height="152" frameborder="0"></iframe>

Table 1 reports each scenario's Exchequer cost, poverty-rate change measured after housing costs (AHC, in percentage points, pp) and the change in the Gini coefficient (a standard measure of income inequality, where higher values mean more inequality). All figures are annual effects for the 2026 tax year.

<iframe src="https://uk-ai-study.vercel.app/embed-scenarios.html" width="100%" height="441" frameborder="0"></iframe>

## The three market-income channels

Each scenario combines three channels through which AI changes market incomes: a displacement shock (workers who lose their jobs, drawn in proportion to how exposed their occupation is to AI), a wage uplift for workers who remain (proportional to how much AI complements their work), and a capital-returns shock (part of the productivity gain flowing to owners of capital).

The channels have different distributional shapes. As Figure 1 shows, displacement allocated in proportion to exposure rises across the income distribution — from 0.5% of people in the lowest income decile (deciles are ten equal-sized groups of people, ranked by their household's income adjusted for household size) transitioning to unemployment to 4.9% in the highest — because the professional and administrative occupations that score highest on exposure sit in the upper half of the income distribution. This gradient reflects the exposure-proportional allocation assumption, not an empirical finding about who AI will in fact displace; we vary that assumption explicitly in the incidence section below.

<iframe src="https://uk-ai-study.vercel.app/chart-transition.html" width="100%" height="483" frameborder="0"></iframe>

The wage channel, by contrast, is almost distributionally flat: gains run from 2.50% in the bottom decile to 2.72% at the top, a spread of just 0.2 percentage points. The capital channel applies the same percentage uplift to everyone's interest and dividend income, but as Figure 2 shows, the pound gains concentrate where capital income is held: the top decile holds 35.2% of all capital income in our data, the bottom decile 2.8%.

<iframe src="https://uk-ai-study.vercel.app/chart-capital.html" width="100%" height="483" frameborder="0"></iframe>

## How the tax-benefit system cushions the shock

The tax-benefit system converts each market-income loss into a smaller disposable-income loss, through two distinct mechanisms that Figure 3 decomposes by decile. Across the middle deciles, benefit entitlements — Universal Credit in particular — rise automatically as displaced earners qualify for means-tested support (benefits whose amount depends on income and savings). At the top, the cushioning operates through the tax system instead: income tax and National Insurance liabilities fall as high-marginal-rate earnings disappear. In the top decile, a market-income loss of 6.7% of baseline disposable income becomes a disposable-income loss of 4.3% — roughly a third of the market shock absorbed. This mirrors the European evidence on earlier automation waves, where tax-benefit systems absorbed much of the shock before it reached household inequality ([Doorley et al., 2023](https://www.iza.org/publications/dp/16499/automation-and-income-inequality-in-europe)).

<iframe src="https://uk-ai-study.vercel.app/chart-decomposition.html" width="100%" height="523" frameborder="0"></iframe>

That household cushioning appears in the public finances as the Exchequer cost reported in the headline results: lost income tax and National Insurance on displaced higher earners, together with higher benefit spending.

<iframe src="https://uk-ai-study.vercel.app/embed-caseloads.html" width="100%" height="181" frameborder="0"></iframe>

## Distributional impact

Combining the three channels with the tax-benefit response gives the net effect on household incomes by decile in 2026, shown in Figure 4. The four scenarios are Low, Central and High, which vary the size of the displacement shock around the central 7% rate, plus Youth-tilted, which keeps the central shock size but raises displacement probabilities for younger workers within the same occupation quotas.

<iframe src="https://uk-ai-study.vercel.app/distributional-impact.html" width="100%" height="536" frameborder="0"></iframe>

Under the central calibration, net losses in pounds are largest towards the top of the distribution, where displacement is concentrated; the incidence section below shows how this profile changes under other allocation assumptions.

## The shock-size grid

How much do these conclusions depend on the exact shock size? Beyond the presets, we simulate 66 scenarios crossing 11 displacement rates (0–10%) with six wage uplifts (0–5%); Figure 5 maps the results. Within this grid, whether AI raises or lowers average living standards is sensitive to the balance between the two forces: at these calibrations, roughly one percentage point of wage growth offsets one percentage point of displacement in aggregate disposable-income terms. The empirical literature remains uncertain about that balance, with population-scale Danish evidence finding minimal earnings effects in the first years of diffusion ([Humlum and Vestergaard, 2025](https://www.nber.org/papers/w33777)) while other estimates imply much larger reallocation. One result holds in all 66 cells: measured inequality rises. No combination of parameters within the grid reduces the Gini coefficient, though this is a conditional result of the simulated displacement, survivor-wage and capital-income channels rather than a claim about every possible AI adjustment.

<iframe src="https://uk-ai-study.vercel.app/chart-grid.html" width="100%" height="584" frameborder="0"></iframe>

## Who bears the shock: the incidence axis

The shock-size grid holds incidence fixed; the next axis varies who bears it. Table 2 reports the results for the 2026 tax year, with ± values showing the 50-draw allocation-noise standard deviations described in the methodology.

<iframe src="https://uk-ai-study.vercel.app/embed-incidence.html" width="100%" height="726" frameborder="0"></iframe>

Figure 6 shows where each allocation lands across the income distribution. The exposure-proportional, junior-concentrated and expertise-compression families all slope upward; uniform incidence is flatter by construction; and the stress test anchored to Klein Teeselink (2025) is the most top-tilted, running from 0.01% of the bottom decile transitioning to unemployment to 7.25% of the top.

<iframe src="https://uk-ai-study.vercel.app/chart-incidence-families.html" width="100%" height="623" frameborder="0"></iframe>

Figure 7 puts the fiscal and poverty consequences of each allocation in one chart, with error bars showing the Table 2 uncertainty. The families separate mainly on cost — the same shock carries a fiscal cost roughly £19 billion a year larger under the top-loaded stress test than under uniform incidence — while their poverty effects cluster more tightly, with expertise compression and the stress test sitting highest on both axes.

<iframe src="https://uk-ai-study.vercel.app/chart-cost-poverty.html" width="100%" height="483" frameborder="0"></iframe>

## The adjustment margin: job losses versus wage cuts

Displacement is not the only way labour markets adjust. In US evidence from [Acemoglu and Restrepo (2022)](https://www.nber.org/papers/w28920), task displacement operated chiefly through relative wage declines rather than job loss. The wage-margin family moves the same aggregate earnings loss to wage cuts instead of displacement, using occupation-level gradients including the expertise measure of [Hosseini and Lichtinger (2026b)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6059674); Table 3 traces the transition between the two margins.

The comparison is stark. Delivering the same gross earnings loss through wage cuts costs the Exchequer more (£26.6 billion against £18.2 billion), because cuts shave earnings taxed at high marginal rates while displacement removes whole earnings taxed at lower average rates — but the poverty rise almost disappears (+0.10 against +1.81 percentage points) and the change in the Gini coefficient flips sign, from +1.04 to −0.44 percentage points. Whether AI's labour-market adjustment arrives as job losses or as pay compression matters as much for who bears it as how large the shock is.

<iframe src="https://uk-ai-study.vercel.app/embed-wagemargin.html" width="100%" height="630" frameborder="0"></iframe>

## Age and gender

Under exposure-proportional incidence, workers aged 16–24 account for only 5.3% of the displaced, because young people in the UK are concentrated in low-exposure service occupations; as Figure 8 shows, the burden falls on prime-age workers. Figure 8 compares the Central scenario with the Youth-tilted variant, which raises displacement probabilities for younger workers within the same occupation quotas. Even tilting displacement probabilities towards junior workers changes the age composition only slightly within fixed occupation quotas. The strongest early empirical evidence locates AI's employment effects among junior workers _within_ exposed occupations, operating chiefly through reduced hiring — a margin that stock-based simulation frameworks such as this one do not capture by construction, so the framework likely understates youth incidence.

<iframe src="https://uk-ai-study.vercel.app/chart-age.html" width="100%" height="476" frameborder="0"></iframe>

Exposure also carries a gender gradient: employed women in the Family Resources Survey have a mean exposure score of 0.33 against 0.18 for employed men, reflecting women's concentration in administrative, professional and associate-professional work. Women hold 51.8% of employment but account for 55.4% of the displaced in the central scenario — echoing the international evidence that female employment is substantially more exposed to generative AI ([ILO, 2025](https://www.ilo.org/sites/default/files/2025-05/WP140_web.pdf)) — though household-level income changes are similar by sex. Income pooling within couples may mute the individual asymmetry at the household level; we offer this as a hypothesis rather than a finding.

## Poverty impact

Table 4 reports the poverty-rate changes under each scenario.

<iframe src="https://uk-ai-study.vercel.app/embed-poverty.html" width="100%" height="364" frameborder="0"></iframe>

The central poverty response is large by the standard of recent UK downturns, and follows from the framework's stark assumptions: a full year of lost earnings against low Universal Credit replacement rates. It attenuates when those assumptions are relaxed — under a 50% earnings-retention hybrid (approximating a six-month spell), the fiscal cost falls by more than three-quarters and the poverty rise falls to near zero.

## Inequality impact

Across the displacement scenarios, inequality moves in one direction even where poverty effects attenuate. The exception is the wage-cut margin above, where measured inequality falls — the one adjustment path in the study that reduces the Gini coefficient.

<iframe src="https://uk-ai-study.vercel.app/embed-inequality.html" width="100%" height="210" frameborder="0"></iframe>

## Regional impact

The impact varies across regions with each area's occupational mix, as Table 5 shows.

<iframe src="https://uk-ai-study.vercel.app/embed-regions.html" width="100%" height="602" frameborder="0"></iframe>

Displacement per worker is highest in the regions with the most AI-exposed occupational mixes, while the poverty impact is largest where baseline incomes leave households closer to the poverty line. These regional estimates aggregate synthetic constituency-level projections based on imputed occupations and calibrated survey weights from a single displacement draw, and carry wider uncertainty than the national aggregates.

## Policy responses

If the shock is structural rather than cyclical, the question facing the state is not whether the existing tax-benefit system cushions the shock — it does, absorbing roughly a third of the market-income loss in the decile facing the largest loss — but whether it cushions the shock well, and at what fiscal cost the residual poverty increase could be reduced. We simulate three stylised responses on top of the central shock, each in force for 2026 only:

- **R1: Wage insurance** — in the spirit of trade-adjustment proposals, displaced workers receive 50% of their lost earnings, capped at £15,000 a year. It is modelled as a non-taxable transfer disregarded by means tests, representing the upper end of plausible implementations.
- **R2: Universal Credit standard allowance +20%** — a demand-side boost within the existing architecture, implemented as a parameter reform inside PolicyEngine so all interactions with the taper (the rate at which UC is withdrawn as earnings rise), the benefit cap and linked (passported) entitlements are captured.
- **R3: Benefit cap suspension plus a UC taper cut from 55% to 45%** — targeting the households for whom the benefit cap and taper bind most strongly.

Each estimate is the difference between the shocked-plus-reform and shocked worlds: what the reform adds, given that the shock has happened. Table 6 and Figure 9 compare the three.

<iframe src="https://uk-ai-study.vercel.app/embed-policy.html" width="100%" height="638" frameborder="0"></iframe>

<iframe src="https://uk-ai-study.vercel.app/chart-policy.html" width="100%" height="463" frameborder="0"></iframe>

Targeted retraining is a further relevant lever outside this comparison: US evidence finds rising returns to publicly funded retraining for workers from the most AI-exposed occupations, largely through moves into less-exposed work ([Hyman et al., 2025](https://www.nber.org/papers/w34174)).

Another channel matters for the fiscal arithmetic: where does the displaced wage bill — the total earnings previously paid to displaced workers — go? Task-based models imply automation shifts income from labour to capital ([Acemoglu and Restrepo, 2018](https://www.aeaweb.org/articles?id=10.1257/aer.20160696)), and the [OBR (2026)](https://obr.uk/efo/economic-and-fiscal-outlook-march-2026/) notes that such a shift depresses receipts because labour income carries a higher effective tax rate. In an accounting sensitivity shown in Figure 10, if the full displaced wage bill reappeared as corporate profits taxed at the 25% main rate, the labour-to-capital shift would be nearly self-financing for the Treasury on a cash-tax basis — because the effective income-tax-plus-NICs rate on displaced workers' earnings (25.6%) almost equals the corporation tax rate. Revenue neutrality would not mean distributional neutrality, however: in a simulated case where half the recouped profits are distributed to existing dividend holders, measured inequality rises further while poverty is essentially unchanged. This is static accounting layered on the microsimulation — the share of the wage bill that becomes taxable profit is a free parameter the framework cannot pin down, so we present a grid rather than a point estimate.

<iframe src="https://uk-ai-study.vercel.app/chart-phi.html" width="100%" height="524" frameborder="0"></iframe>

## Conclusion

These results are scenario analysis, not prediction: they trace what would follow if labour-market shocks of a given size and incidence materialised, under tax-benefit rules as legislated. Three findings organise the analysis. First, measured inequality rises in every displacement calibration we examine — all 66 grid cells and all five incidence families — because zero earnings for selected workers, partial tax-benefit replacement, wage gains for workers who remain in employment and the capital uplift jointly widen post-shock income gaps. Second, who bears the shock materially changes its simulated cost: the same central shock costs the Exchequer roughly a third more under exposure-proportional incidence than under uniform incidence (£18.2 billion against £13.9 billion), and substantially more under an author-designed top-loaded stress test (£32.8 billion). Third, the adjustment margin matters as much as the shock itself — moving the same earnings loss from job losses to wage cuts nearly eliminates the poverty effect and flips the sign of the inequality change.

The tax-benefit system absorbs roughly a third of the market-income loss in the decile with the largest loss, but that cushioning appears as a net fiscal cost of £18.2 billion a year in the central case — pointing to three areas for further analysis: occupational reallocation, entry prospects for younger workers, and the resilience of a labour-income-heavy tax base. The full paper — including the shock-size grid, Monte Carlo uncertainty, duration and take-up sensitivities, benchmarking against the Irish results, and limitations — is available [on SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7174479), with all code and aggregate artefacts in the [uk-ai-study repository](https://github.com/PolicyEngine/uk-ai-study).
