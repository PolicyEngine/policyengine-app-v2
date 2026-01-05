National tax and benefit policies have varying impacts across different areas of the UK. A change to Universal Credit might affect a substantial proportion of households in one local area but few in another. Despite this variation, most policy analysis remains limited to national-level estimates due to data constraints.

We're launching new capabilities in PolicyEngine to disaggregate policy analyses to parliamentary constituencies and local authorities, with an interactive app to explore estimates for your area.

[_See new estimates for your local area here_](https://uk-local-areas-dashboard-578039519715.us-central1.run.app/).

## A new approach to local area modelling

PolicyEngine has developed a methodology that adapts techniques from political polling to tax-benefit microsimulation. The approach reweights national survey data to match administrative statistics at the constituency level, similar to how multi-level regression and post-stratification (MRP) [transformed](https://www.electoralcalculus.co.uk/blogs/ec_mrpinfo_20240604.html) election polling.

The Family Resources Survey [(FRS)](https://www.gov.uk/government/collections/family-resources-survey--2), while robust for national and regional analysis with around 20,000 households, typically includes only 30-40 households per constituency, insufficient for reliable local estimates. As a result, MPs, local authorities, and researchers have lacked the tools to understand local policy impacts systematically.

We integrate data from [HMRC](https://www.gov.uk/government/collections/personal-income-by-tax-year) statistics on income distributions and taxpayer counts, [ONS](https://www.ons.gov.uk/peoplepopulationandcommunity) demographic data including age distributions, [Annual Survey of Hours and Earnings](https://www.ons.gov.uk/surveys/informationforbusinesses/businesssurveys/annualsurveyofhoursandearningsashe) workplace-based earnings data, and [House of Commons Library](https://commonslibrary.parliament.uk/data/2021-census-results/) population statistics. Through optimisation algorithms, we create household weights that enable the Family Resources Survey to represent each of the UK's 650 constituencies and 398 local authorities accurately while maintaining consistency with national totals.

### Methodology

We align administrative statistics to a consistent geographic framework, since HMRC reports data using 2010 parliamentary constituencies while our analysis uses 2024 definitions. We build a many-to-many mapping matrix from ONS boundary lookups to translate income, jobs, and population data to the updated geography. We draw on data from [NOMIS](https://www.nomisweb.co.uk/) for job counts and earnings, HMRC for income distributions, and the House of Commons Library for population by age.

We construct over 11,000 calibration targets covering income brackets, age bands, and employment patterns. We optimise household weights using gradient descent to align survey microdata with these administrative totals, balancing constituency-level and national-level accuracy. Throughout the process, we ensure that improving local precision does not distort national estimates.

## Interactive dashboard for local area analysis

The [interactive dashboard](https://uk-local-areas-dashboard-578039519715.us-central1.run.app/) provides economic indicators for all UK parliamentary constituencies and local authorities. Users can view average market income, net income, taxes paid, and benefits received for any area, with the ability to compare areas directly to understand relative differences.

![](/assets/posts/uk-local-areas-dashboard/dashboard.png)

_Figure 1: Local area economic analysis dashboard showing England summary. The dashboard estimates England's population at 58.1 million, compared to the [ONS mid-2024 estimate](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2024) of 58.6 million._

## Area comparison example

To demonstrate the capabilities of PolicyEngine's local modelling dashboard, we [compare](https://uk-local-areas-dashboard-578039519715.us-central1.run.app/) two constituencies: the Cities of London and Westminster and Cambridge. In this example, we highlight how national tax and benefit policies play out differently across local areas, influencing income distribution, consumption, and public finances. The figure below shows the comparison of main statistics of these two areas.

![](/assets/posts/uk-local-areas-dashboard/compare.png)

_Figure 2: Comparison of main statistics between Cities of London and Westminster and Cambridge._

### Income

As the figure below shows, households of the Cities of London and Westminster earn more than those in Cambridge, with an average market income of just under £107,000 compared to nearly £78,000. Their average net income is also higher, approximately £82,000 versus just under £64,000.

![](/assets/posts/uk-local-areas-dashboard/compare2.png)

_Figure 3: Income comparison by decile._

A decile-level comparison shows that this income advantage is concentrated at the top. Households in the top decile in the Cities of London and Westminster take home an average net income of approximately £365,000, more than double the roughly £181,000 earned by their counterparts in Cambridge. Households in the lower-income deciles earn similar amounts in both the Cities of London and Westminster and Cambridge.

### Consumption and wealth

As the figure below shows, households in Cambridge spend more on average, just over £30,500 compared to nearly £28,700 in the Cities of London and Westminster. They allocate more to most spending categories, including housing, food, and recreation.

![](/assets/posts/uk-local-areas-dashboard/compare3.png)

_Figure 4: Consumption and wealth comparison._

Additionally, Cambridge households hold more wealth on average, with assets totalling just over £550,000 compared to slightly more than £470,000 in the Cities of London and Westminster.

### Taxes and benefits

The chart below demonstrates that households in the Cities of London and Westminster pay higher average taxes, with nearly £34,600 compared to approximately £22,600 in Cambridge. This difference is driven mainly by larger income tax payments, just over £9,400 versus nearly £6,000, and higher employer National Insurance contributions.

![](/assets/posts/uk-local-areas-dashboard/compare4.png)

_Figure 5: Taxes and benefits comparison._

Households in the Cities of London and Westminster receive just under £9,620 in benefits on average, compared to slightly more than £8,670 in Cambridge. Higher-income households pay more through income tax, while households in both areas contribute similar amounts to indirect taxes such as VAT and council tax.

### Fiscal impact

The figure below illustrates that households in the Cities of London and Westminster generate £3.0 billion in tax revenue and receive £0.7 billion in public spending, producing a fiscal surplus of £2.3 billion. Households in Cambridge generate £1.3 billion in tax revenue and receive £0.4 billion in public spending, resulting in a £0.9 billion surplus.

![](/assets/posts/uk-local-areas-dashboard/compare5.png)

_Figure 6: Fiscal impact comparison._

## Open access and future development

### Applications

Users can use this dashboard to assess how proposed policies affect median earners and benefit recipients in specific constituencies. Local authorities use it to analyse income distributions and benefit receipt patterns to support service planning. Researchers investigate geographic variation in policy impacts, and policy organisations produce rapid, constituency-level analysis of Budget measures.

### Limitations

Like any model, ours has limitations. It tends to underestimate very high incomes above £1 million by 30-50% due to survey constraints. It produces larger relative errors for programmes affecting fewer than 1,000 people nationally. In constituencies with unusual demographic profiles, the model may generate higher-than-average errors. We publish a live [dashboard](https://microcalibrate.vercel.app/?repo=policyengine%2Fpolicyengine-uk-data&branch=main&commit=5f8994e4740d566ec289adc1c2e7d611856e6ed1&artifact=calibration_log.csv) where users can track how well the model matches each of the 11,000 statistical targets we calibrate.

### Data availability

**All our microdata outputs are freely available to users with access to the UK Data Service**. The interactive dashboard provides public access to local area statistics, while calibration weights can be used in other microsimulation models including UKMOD and TAXBEN. Users can also assess the local impact of any policy reform through the [PolicyEngine UK platform](https://policyengine.org/uk). This initial release focuses on current income distributions and tax-benefit systems.

The local area modelling system brings constituency-level precision to national policy debates. By making these tools freely available, we aim to support evidence-based policy discussion at all levels of government.

If you or your team is interested in disaggregating national policy proposals at all or specific geographies, please get in touch at [hello@policyengine.org](mailto:hello@policyengine.org).
