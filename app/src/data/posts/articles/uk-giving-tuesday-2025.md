We're launching [GiveCalc](https://givecalc.org) for UK taxpayers, a free calculator that shows how Gift Aid affects your taxes. Enter your income and donation amount, and GiveCalc computes your tax relief — helping you understand the true cost of giving.

## How Gift Aid works

Gift Aid is the UK's primary tax relief for charitable giving. When you donate to a registered charity, the tax system provides relief at two levels:

1. **Charity reclaim**: The charity claims back the basic rate tax (20%) on your donation. For every £1 you give, the charity claims 25p from HMRC, so it receives £1.25 in all.

2. **Donor relief**: If you pay tax above the basic rate (40% higher rate or 45% additional rate), you can claim back the difference on your Self Assessment.

### Example calculation

A higher rate taxpayer donating £1,000:

| Component                             | Amount   |
| ------------------------------------- | -------- |
| Your donation                         | £1,000   |
| Charity receives (grossed up)         | £1,250   |
| Your tax relief (40% - 20% on £1,250) | £250     |
| **Net cost to you**                   | **£750** |

The charity gets 25% more than you gave, and you save 25% on your donation — everyone benefits except HMRC.

## What GiveCalc shows

GiveCalc computes your Gift Aid tax relief based on your specific circumstances:

- **Employment and self-employment income**
- **Region** (including Scottish income tax rates)
- **Family situation** (marriage, children)

The calculator shows:

1. **Tax savings**: Your total reduction in income tax liability
2. **Marginal savings rate**: Tax saved per additional pound donated
3. **Net cost**: Your actual out-of-pocket cost after tax relief

![GiveCalc UK showing a higher rate taxpayer donating £1,000](/assets/posts/uk-giving-tuesday-2025/screenshot.webp)

## Scottish taxpayers

Scotland sets its own income tax rates, which differ from the rest of the UK:

| Band (2025-26)     | Scotland         | Rest of UK      |
| ------------------ | ---------------- | --------------- |
| Starter (19%)      | £12,571–£15,397  | —               |
| Basic (20%)        | £15,398–£27,491  | £12,571–£50,270 |
| Intermediate (21%) | £27,492–£43,662  | —               |
| Higher (42%)       | £43,663–£75,000  | —               |
| Advanced (45%)     | £75,001–£125,140 | —               |
| Top (48%)          | Over £125,140    | —               |

GiveCalc automatically applies the correct rates based on your selected region.

## Personal Allowance interactions

For high earners (income over £100,000), Gift Aid donations can restore some of your Personal Allowance. The Personal Allowance reduces by £1 for every £2 of income above £100,000 until it reaches zero at £125,140.

Gift Aid donations reduce your "adjusted net income" for this calculation, potentially restoring your Personal Allowance. Counting the basic rate tax the charity reclaims, total relief can then reach 60% of the grossed-up donation (67.5% in Scotland).

## Try it yourself

Visit [givecalc.org](https://givecalc.org) and select "United Kingdom" to calculate your Gift Aid tax relief. The calculator uses PolicyEngine's validated UK tax model to compute accurate results for your specific situation.

The [source code](https://github.com/PolicyEngine/givecalc) is open source, and we welcome [contributions and feedback](https://github.com/PolicyEngine/givecalc/issues).

## Correction

On November 17, 2026, we made these changes to this post:

- We corrected how much the charity claims. It first said the charity receives £1.25 from HMRC for every £1 you give; the charity claims 25p from HMRC, so it receives £1.25 in all.
- We updated the Scottish starter, basic and intermediate bands to their 2025-26 thresholds.
- We corrected the Scottish relief rate in the Personal Allowance taper from 63% to 67.5%. We also now state what it and the 60% for the rest of the UK count: the charity's claim plus your own relief, as a share of the grossed-up donation.
- The screenshot above shows £400 of tax savings and a £600 net cost for someone in England earning £60,000 and giving £1,000 in 2025-26. When we published, GiveCalc applied the donor's full marginal rate to the whole gift, a bug we fixed in October 2026 ([PolicyEngine/givecalc#85](https://github.com/PolicyEngine/givecalc/pull/85)). GiveCalc now computes £250 of savings and a £750 net cost for that household, as in the example above.
