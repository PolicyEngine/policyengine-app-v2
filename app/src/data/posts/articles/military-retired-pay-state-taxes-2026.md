Most states exempt military retired pay from income tax in 2026, and [[TODO: count after the state checks: how many exempt part of it]]. For example, when one spouse in a married couple is 45, earns $60,000 in a civilian job and draws $30,000 of military retired pay, the pay raises the couple's state income tax in nine states and the District of Columbia, by amounts from $55 in Maine to $2,310 in Oregon. When both spouses have retired, at 67 and 65, and live on $45,000 of military retired pay and $30,000 of Social Security, the pay raises their state income tax in seven states and DC, by up to $463 in DC.

## A retiree with a second career

The retiree in the first couple served from 2001 to 2020 and now earns $60,000 a year in a civilian job, and the spouse has no income.

```chart
{
  "type": "stateMap",
  "title": "State income tax on $30,000 of military retired pay",
  "subtitle": "Extra state income tax a married couple owes when one spouse, age 45, receives $30,000 of military retired pay on top of $60,000 of wages, 2026",
  "stateKey": "state",
  "valueKey": "tax",
  "data": [
    {"state": "AL", "tax": -180},
    {"state": "AK", "tax": 0},
    {"state": "AZ", "tax": 0},
    {"state": "AR", "tax": 0},
    {"state": "CA", "tax": 292},
    {"state": "CO", "tax": 660},
    {"state": "CT", "tax": 0},
    {"state": "DE", "tax": 1087},
    {"state": "DC", "tax": 1897},
    {"state": "FL", "tax": 0},
    {"state": "GA", "tax": 0},
    {"state": "HI", "tax": 0},
    {"state": "ID", "tax": 0},
    {"state": "IL", "tax": 0},
    {"state": "IN", "tax": 0},
    {"state": "IA", "tax": 0},
    {"state": "KS", "tax": 0},
    {"state": "KY", "tax": 0},
    {"state": "LA", "tax": 0},
    {"state": "ME", "tax": 55},
    {"state": "MD", "tax": 831},
    {"state": "MA", "tax": 0},
    {"state": "MI", "tax": 0},
    {"state": "MN", "tax": 0},
    {"state": "MS", "tax": 0},
    {"state": "MO", "tax": -25},
    {"state": "MT", "tax": 705},
    {"state": "NE", "tax": 0},
    {"state": "NV", "tax": 0},
    {"state": "NH", "tax": 0},
    {"state": "NJ", "tax": 0},
    {"state": "NM", "tax": 0},
    {"state": "NY", "tax": 0},
    {"state": "NC", "tax": 0},
    {"state": "ND", "tax": 0},
    {"state": "OH", "tax": 0},
    {"state": "OK", "tax": 0},
    {"state": "OR", "tax": 2310},
    {"state": "PA", "tax": 0},
    {"state": "RI", "tax": 0},
    {"state": "SC", "tax": 142},
    {"state": "SD", "tax": 0},
    {"state": "TN", "tax": 0},
    {"state": "TX", "tax": 0},
    {"state": "UT", "tax": 390},
    {"state": "VT", "tax": 0},
    {"state": "VA", "tax": 0},
    {"state": "WA", "tax": 0},
    {"state": "WV", "tax": 0},
    {"state": "WI", "tax": 0},
    {"state": "WY", "tax": 0}
  ],
  "bins": [
    {"below": 1, "label": "None"},
    {"below": 500, "label": "$1 to $499"},
    {"below": 1000, "label": "$500 to $999"},
    {"below": 2000, "label": "$1,000 to $1,999"},
    {"label": "$2,000 and up"}
  ],
  "note": "Alabama and Missouri let filers deduct federal income tax, which the pay raises, so the pay lowers their state income tax.",
  "format": {"decimals": 0, "prefix": "$", "separator": true},
  "source": "Source: PolicyEngine-US checkout bfeef52eb9 household calculations for 2026; github.com/PolicyEngine/veterans-day-2026."
}
```

[[TODO: Oregon and DC tax all of the pay; Oregon's federal pension subtraction reaches only service before October 1, 1991. Cite ORS 316.680 and the DC Code.]]

[[TODO: Delaware, Maryland, Colorado and California exempt a fixed amount for a retiree this age: amounts, age and income limits, citations.]]

Montana exempts half of the pay, up to the couple's earnings in Montana, for five consecutive years ([MCA 15-30-2120](https://archive.legmt.gov/bills/mca/title_0150/chapter_0300/part_0210/section_0200/0150-0300-0210-0200.html), subsections (3)(n), (8) and (9)). That comes to $15,000 for this couple.

[[TODO: Utah's credit and its taxpayer tax credit phase-out ($390); South Carolina ($142); Maine's credit ($55). Names, mechanisms and citations from the state checks.]]

In Alabama and Missouri the couple owes less state income tax with the pay than without it. Both states exempt the pay and let filers deduct federal income tax, which the pay raises by $3,600, so the couple owes $180 less in Alabama and $25 less in Missouri [[TODO: cite Ala. Code 40-18-15 and RSMo 143.171]].

## A retired couple

The retiree in the second couple served from 1977 to 1996.

```chart
{
  "type": "bar",
  "title": "Where $45,000 of military retired pay raises state income tax",
  "subtitle": "Extra state income tax a married couple, ages 67 and 65, owes on $45,000 of military retired pay, with $30,000 of Social Security, 2026",
  "xKey": "state",
  "series": [
    {"key": "tax", "name": "State income tax on the pay", "color": "primary"}
  ],
  "data": [
    {"state": "DC", "tax": 463},
    {"state": "HI", "tax": 440},
    {"state": "DE", "tax": 353},
    {"state": "MT", "tax": 272},
    {"state": "ME", "tax": 215},
    {"state": "IN", "tax": 140},
    {"state": "AZ", "tax": 50},
    {"state": "ID", "tax": 10}
  ],
  "format": {"decimals": 0, "prefix": "$", "separator": true},
  "source": "Source: PolicyEngine-US checkout bfeef52eb9 household calculations for 2026; github.com/PolicyEngine/veterans-day-2026."
}
```

[[TODO: DC and Delaware tax part of the pay: DC's treatment and Delaware's $12,500 exclusion for filers 60 and older, with citations.]] Montana exempts pay only up to a couple's earnings in Montana, and this couple has none.

[[TODO: Hawaii, Maine, Indiana, Arizona and Idaho exempt the pay but count it toward the income limits of credits for lower-income households: name each credit, its income limit and the amount the couple loses, with citations.]]

## Other rules for veterans

PolicyEngine also models rules in benefit programs and other state taxes that turn on military service or veteran status. For example:

| Program | Rule | Law |
| --- | --- | --- |
| SNAP | Congress exempted veterans from SNAP's time limit for adults without dependents in 2023, then ended the exemption in July 2025. | [P.L. 118-5, sec. 311](https://www.govinfo.gov/content/pkg/PLAW-118publ5/html/PLAW-118publ5.htm); [P.L. 119-21, sec. 10102](https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf#page=10) |
| Medicaid | States must start work requirements by January 1, 2027, or by the end of 2028 with a federal exemption, and must exempt veterans with a disability rated as total. | [P.L. 119-21, sec. 71119](https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf#page=235) |
| Kansas income tax | Each veteran the VA pays disability compensation at the 100% rate, for a permanent service-connected disability, gets an extra $2,320 exemption. | [K.S.A. 79-32,121b(b)(2)](https://www.kslegislature.gov/li/b2025_26/statute/079_000_0000_chapter/079_032_0000_article/079_032_0121b_section/079_032_0121b_k/) |
| Michigan income tax | Each veteran with a service-connected disability, at any rating, gets an extra $500 exemption. | [MCL 206.30](https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-206-30), subsections (3)(b) and (7); [2025 MI-1040 instructions, p. 10](https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/IIT/TY2025/MI-1040-Book.pdf#page=10) |
| North Carolina income tax | [[TODO: the military retirement deduction's 20-year and medical retirement conditions, with citation.]] | |

## How we calculated these

We calculated each couple's 2026 state income tax in every state twice with [PolicyEngine-US](https://github.com/PolicyEngine/policyengine-us) [[TODO: release version]], once with the military retired pay and once without it. Both couples file jointly, claim no dependents and live in the state all year, and the retiree served 20 years and has no service-connected disability. State income tax here counts state credits, including refundable ones, and leaves out local income taxes. [[TODO: cite KRS and ORS]] Kentucky and Oregon exempt the part of a federal pension earned before 1998 and before October 1991; the 67-year-old's service all predates 1998, and 177 of its 240 months predate October 1991.

Our survey data don't record veteran status or military retired pay, so we can't estimate how many retirees each state's rules reach. The code and full results, including a wider grid of ages, pensions and wages, are at [github.com/PolicyEngine/veterans-day-2026](https://github.com/PolicyEngine/veterans-day-2026). [[TODO: link the household calculator once the web app runs the same PolicyEngine-US release.]]
