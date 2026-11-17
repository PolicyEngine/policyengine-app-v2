This Giving Tuesday, we're launching [**GiveCalc**](https://givecalc.org) as a standalone web application at [givecalc.org](https://givecalc.org). The free calculator computes how charitable donations affect your federal and state taxes, helping you understand the true cost of giving—to any charity, including a gift to [PolicyEngine](https://policyengine.org/us/donate) through our fiscal sponsor, the PSL Foundation.

## What's new

Since [launching GiveCalc last year](/us/research/givecalc), we've rebuilt it from the ground up:

- **New domain**: Access GiveCalc directly at [givecalc.org](https://givecalc.org)
- **UK Gift Aid support**: Calculate tax relief on charitable donations in the UK, including [Scottish income tax rates](/uk/research/uk-giving-tuesday-2025)
- **React frontend**: Faster, more responsive interface
- **2025 tax year support**: Calculate impacts for 2024, 2025, or 2026, including HR1's charitable contribution changes and downstream state tax effects
- **Expanded income types**: Add self-employment, capital gains, dividends, and interest income
- **Mobile-friendly design**: Use GiveCalc on any device
- **Validated accuracy**: Tax calculations from PolicyEngine's model, which we validate against TAXSIM through our [partnership with the National Bureau of Economic Research](/us/research/policyengine-nber-mou-taxsim)

## How it works

GiveCalc uses PolicyEngine's microsimulation model to compute your taxes with and without donations. Enter your income, filing status, state, and deductions, and GiveCalc shows:

1. **Net tax impact**: How much your donation reduces your tax liability
2. **Marginal giving discount**: The tax savings per additional dollar donated
3. **Target donation finder**: The donation required to achieve a specific net income reduction

For example, a single California filer earning $200,000 with $20,000 in mortgage interest saves $6,660 in 2025 taxes on a $20,000 donation, or 33% of the gift, so the donation costs them $13,340.

![GiveCalc screenshot showing tax savings calculation](/assets/posts/us-giving-tuesday-2025/screenshot.webp)

## Supporting PolicyEngine

PolicyEngine builds open-source infrastructure for evidence-based policy analysis. Everything we do is micro-founded: societal impacts are built up person by person, household by household—making policy personal.

![Organizations citing PolicyEngine](/assets/posts/us-giving-tuesday-2025/logo-cycle.gif)

### Policy understanding

[PolicyEngine's calculator](https://app.policyengine.org/us/reports) lets anyone see how taxes and benefits affect their specific situation—and how proposed reforms would change it.

![PolicyEngine calculator showing Nebraska EITC analysis](/assets/posts/us-giving-tuesday-2025/policyengine-calculator.webp)

### High-profile policy analysis

When major legislation moves through Congress, we build custom tools to help the public understand impacts. Our [OBBBA household calculator](https://www.policyengine.org/us/obbba-households) lets anyone see how reconciliation bill provisions affect their family.

![OBBBA household-by-household calculator](/assets/posts/us-giving-tuesday-2025/obbba.webp)

### Benefit access

Tools like [MyFriendBen](https://myfriendben.org), [Amplifi Benefit Navigator](https://www.amplifi.org/benefit-navigator), [Starlight](https://www.get-starlight.com), and [Mirza](https://heymirza.com) use PolicyEngine's API to screen families for 40+ federal and state programs they may qualify for. As of November 2026, MyFriendBen reports that it has served more than 175,000 households and secured more than $92 million in benefits and tax credits for families. Amplifi reports more than 23,000 clients of its Benefit Navigator and more than $230 million in new benefits and tax credits identified.

![Benefit screening tools powered by PolicyEngine](/assets/posts/us-giving-tuesday-2025/benefit-tools-collage.webp)

### What donations support

Donations to PolicyEngine are tax-deductible in the US and support:

- **More programs**: Expanding benefit coverage so screening tools can help more families
- **Better data**: Improving accuracy for poverty and distributional analysis
- **Open infrastructure**: Sustaining free access for researchers, governments, and the public

[Donate to PolicyEngine](https://policyengine.org/us/donate) and use [GiveCalc](https://givecalc.org) to calculate your tax savings.

## Try GiveCalc

Visit [givecalc.org](https://givecalc.org) to calculate how your charitable giving affects your taxes. The [source code](https://github.com/PolicyEngine/givecalc) is open source, and we welcome [contributions and feedback](https://github.com/PolicyEngine/givecalc/issues).

## Correction

On November 17, 2026, we made these changes to this post:

- We corrected the GiveCalc example. It first said this filer saves $5,857 and pays a net $14,143, with a 33% marginal savings rate. When we published, GiveCalc left mortgage interest out of its calculations, a bug we fixed in October 2026 ([PolicyEngine/givecalc#85](https://github.com/PolicyEngine/givecalc/pull/85)). We reran the example in GiveCalc on November 17, 2026, for the 2025 tax year. The screenshot above still shows the earlier figures.
- We replaced the figures for MyFriendBen and Amplifi with the ones each publishes on its own website. We removed a combined figure of over $1 billion for the four tools, which none of their websites reports.
- We corrected the NBER line: PolicyEngine's model computes GiveCalc's taxes, and we validate that model against NBER's TAXSIM.
- We added that gifts to PolicyEngine go through our fiscal sponsor, the PSL Foundation.
- We removed a sentence that pointed to our Open Collective page for how we spend donations.
- We repaired three broken links.
