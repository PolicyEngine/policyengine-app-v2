[PolicyEngine UK Chat](https://policyengine.org/uk) is an AI-powered chat interface to PolicyEngine UK. It answers UK tax-and-benefit questions in a conversation and runs our microsimulation engine for every calculation. When a question needs a number, the chat calls a tool that computes the result, rather than producing the number from the language model's memory. We built it for policymaking, where the figure is often the point, and where a number a model produces from memory can read like an answer without having been computed. This follows our earlier work on [multi-agent AI workflows for policy research](https://policyengine.org/uk/research/multi-agent-workflows-policy-research), and it sits on the same engine we use elsewhere, for example in [how PolicyEngine estimates the effects of UK carbon taxes](https://policyengine.org/uk/research/how-policyengine-estimates-the-effects-of-uk-carbon-taxes) and our [carbon tax and dividend analysis](https://policyengine.org/uk/research/uk-carbon-tax-dividend).

## Why the calculation is separate from the model

A language model generates text by predicting continuations, not by applying tax and benefit rules. Ask one what Universal Credit a lone parent receives and it returns a number without running the taper, the work allowance, or the benefit rates. The wording reads the same whether the number is right or wrong.

Prompting does not change this. Instructing a model to state only real figures does not give it the rules; it changes the wording around the same guess. For policy work the number is often the point, so a wrong figure presented as an answer is worse than no figure.

This matters when results feed decisions. A researcher, a charity adviser, or a journalist comparing two reforms needs figures that come from a stated model, not from a model's recollection of figures it has seen. The same applies to a household trying to work out how a threshold change affects its own income: the figure has to come from the rules, with the assumptions written down, so it can be reproduced.

## The model plans, the tools calculate

A [Claude model](https://claude.com/claude) reads the question, works out what is being asked, and selects a tool. The system prompt requires every number to come from a tool result, and the tools, not the model, perform the calculation. Most numbers come from typed calculation tools that call the [PolicyEngine UK microsimulation engine](https://github.com/PolicyEngine/policyengine-uk); some come from reproducible PolicyEngine Python when a question falls outside those tools. Either way the number comes from a computation, not from the model's memory.

The model does the part it is suited to: turning an ambiguous question into a calculation, choosing a tool, and reporting the result it gets back. The engine applies the rules. The engine is open source, so anyone can check how a number is produced, and the same rules sit behind our web app and Python package, which keeps the chat's answers consistent with the rest of PolicyEngine. If a household-level answer in the chat looks off, the same scenario can be run in the web app or the package and the two should agree.

## What it can answer

The chat has six tools. `calculate_household` builds a synthetic illustrative household, such as a lone parent on a given wage, and returns outcomes like Universal Credit, Child Benefit, and net income. We label these households as synthetic illustrations rather than real people.

`run_economy_simulation` runs a reform across the population and returns the budgetary impact, the change by income decile, how many households gain or lose, and the effect on poverty. `analyse_microdata` answers population questions at an aggregate level. `generate_chart` turns any of these into a chart. `run_python` runs reproducible PolicyEngine Python for questions the typed tools do not cover, and `validate_reform` checks a reform definition before it is used. In each case the figures come from the computation, not from recall.

## Constraints

Three rules shape the behaviour. The first is neutrality. The chat states what a policy does and who is affected, and it does not call a reform good, bad, fair, unfair, regressive, progressive, generous, or punitive. It reports the change by decile and leaves the judgement to the reader.

The second is privacy. The chat does not read row-level Family Resources Survey records and does not sample the Enhanced FRS at the individual level, and it does not display row-level microdata. Household examples are synthetic illustrations built for the question, so no individual's records are exposed.

The third is reproducibility. We run the model at temperature zero, which reduces variation between runs, and the computation itself is deterministic because it comes from the engine. The model's wording and its choice of tool can still vary between attempts. A version-stamped reference tells the model what the current engine version covers, so its descriptions of scope stay aligned with what the engine computes.

## Where it falls short

The chat is a modelling tool, not advice. It reports what the model calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

`run_economy_simulation` handles parametric reforms, meaning changes to existing rates, thresholds, and parameters. Reforms that introduce new mechanisms fall back to `run_python`, which we review, or sit outside the standard tools. Only the major UK tax and benefit programmes are modelled, so questions about minor or unmodelled provisions may not be answerable.

Results depend on the dataset, the year, and the modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. The aim is that every path either produces a number you can check or says plainly that it cannot.

## Next steps

We want to widen the range of reforms the typed tools cover, so fewer questions fall back to reviewed Python, and to make that fallback quicker to run and inspect. PolicyEngine UK Chat works alongside our wider use of Claude and our plugin ecosystem, which bring the same engine to researchers building their own analyses. Try it with a reform you care about, and check the figures against the open-source engine that produced them.
