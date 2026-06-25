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

## The architecture

The runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no agent framework in the request path: the chat owns its tool loop, because the rules that matter are enforced inside that loop rather than around it.

A request runs in a fixed order. The server validates it and checks the account's balance. It assembles the system blocks — the system prompt and a version-stamped engine reference, both marked for prompt caching. It opens a streaming call to a Claude model, using Claude Haiku for light turns and Claude Sonnet for heavier ones, chosen by the estimated size of the request. It reads the model's output as it streams. When the model asks for a tool, the server runs the tool through a deterministic executor and feeds the result back. This repeats until the model stops, and the client receives events throughout.

<svg viewBox="0 0 760 470" role="img" aria-label="Architecture diagram of the tool-use loop" style="width:100%;max-width:680px;height:auto;display:block;margin:24px auto;font-family:system-ui,-apple-system,sans-serif">
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#2C6496"/></marker>
    <marker id="arrowL" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#0F766E"/></marker>
  </defs>
  <rect x="20" y="20" width="150" height="46" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="95" y="48" text-anchor="middle" fill="#13233A" font-size="13">Request</text>
  <rect x="200" y="14" width="200" height="58" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="300" y="38" text-anchor="middle" fill="#13233A" font-size="13">System blocks assembled</text>
  <text x="300" y="56" text-anchor="middle" fill="#62707E" font-size="11">+ prompt cache (ephemeral)</text>
  <rect x="430" y="14" width="200" height="58" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="530" y="38" text-anchor="middle" fill="#13233A" font-size="13">Anthropic streaming</text>
  <text x="530" y="56" text-anchor="middle" fill="#62707E" font-size="11">Haiku · Sonnet (by size)</text>
  <line x1="170" y1="43" x2="196" y2="43" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
  <line x1="400" y1="43" x2="426" y2="43" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
  <rect x="60" y="118" width="640" height="232" rx="12" fill="none" stroke="#2C6496" stroke-width="1.2" stroke-dasharray="3 4"/>
  <text x="76" y="138" fill="#2C6496" font-size="11" font-weight="700">↺ tool loop — up to 30 iterations</text>
  <line x1="530" y1="72" x2="530" y2="150" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
  <rect x="430" y="152" width="200" height="50" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="530" y="182" text-anchor="middle" fill="#13233A" font-size="13">detect tool_use block</text>
  <rect x="430" y="234" width="200" height="50" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="530" y="264" text-anchor="middle" fill="#13233A" font-size="13">execute_tool() dispatch</text>
  <line x1="530" y1="202" x2="530" y2="230" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
  <rect x="90" y="226" width="270" height="106" rx="10" fill="#17354F" stroke="#17354F"/>
  <text x="225" y="248" text-anchor="middle" fill="#EAF1F8" font-size="13" font-weight="700">deterministic typed tools</text>
  <text x="225" y="270" text-anchor="middle" fill="#EAF1F8" font-size="12">household · economy sim</text>
  <text x="225" y="290" text-anchor="middle" fill="#EAF1F8" font-size="12">microdata · python · chart</text>
  <text x="225" y="314" text-anchor="middle" fill="#9FB6D0" font-size="11">policyengine-uk-compiled · real data</text>
  <line x1="430" y1="259" x2="364" y2="259" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
  <path d="M225,226 C225,150 360,150 426,170" stroke="#0F766E" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#arrowL)"/>
  <text x="250" y="160" fill="#0F766E" font-size="11">result → back into model</text>
  <rect x="295" y="392" width="200" height="54" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="395" y="416" text-anchor="middle" fill="#13233A" font-size="13">SSE events → client</text>
  <text x="395" y="434" text-anchor="middle" fill="#62707E" font-size="11">chunk · tool_* · done</text>
  <path d="M530,284 C530,360 495,360 460,392" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
</svg>

*The model proposes and the deterministic layer disposes. Every iteration of the loop reaches the client as a server-sent event.*

## The tool-use loop

The streaming API returns content as a sequence of blocks. The chat watches for tool-use blocks as they arrive, each naming a tool and carrying a JSON input. It resolves the name against a dispatch table, runs the handler, and appends the result to the conversation as a tool-result turn before streaming the next one. Independent tools requested in the same turn run concurrently.

Two controls keep the loop bounded. An iteration cap, `MAX_ITERATIONS = 30`, limits how many tool rounds a single request can take. A repeated-call check tracks the most recent tool calls; three identical calls in a row means the model is stuck, and the loop stops with an error rather than continue. If the cap is reached before the model finishes, the chat returns a message naming the tools it attempted and the last error, then a terminal event stamped `stop_reason="iteration_cap"`, so the client always receives a clean ending.

```python
for i in range(MAX_ITERATIONS):
    blocks = await stream_assistant_turn(conversation)
    tool_uses = [b for b in blocks if b.type == "tool_use"]
    if not tool_uses:
        break  # model is done — final prose turn

    sig = signature(tool_uses)
    recent.append(sig)
    if recent[-3:].count(sig) == 3:
        yield error("identical tool call repeated 3x"); break

    results = await run_tools(tool_uses)   # independent tools run concurrently
    conversation.append(tool_result_turn(results))
else:
    # cap reached without convergence — summarise and stop cleanly
    yield message(summarise(attempted_tools, last_error))
    yield done(stop_reason="iteration_cap")
```

## What the model decides and what the code decides

The boundary between the model and the code is written down and treated as a contract. The model handles the parts that are open-ended: interpreting the question, planning, selecting tools, writing prose, and suggesting follow-ups. The code handles everything that affects a number or a displayed result: request validation, tool dispatch, the typed tools themselves — including Python execution and chart construction — result truncation and summarisation, billing, and database writes.

Some of these could be left to the model and deliberately are not. If the model chose which rows of a large table to show, that choice would be a sampling decision, and a sampling decision the reader cannot see is one the reader cannot check. A deterministic helper makes it instead. The principle is uniform: anything that affects a number or an artifact is code, so it can be audited rather than trusted.

Plan mode follows the same logic. It lets the model talk through an approach before running anything. Telling the model "do not call tools" in the prompt is a request it can ignore, so the chat does not rely on that: in plan mode the list of tools is left out of the request entirely, and a model cannot call a tool it was never offered.

## The six typed tools

The tools are defined in one place, with shared schema fragments — the year, reform-property, dataset, filter, and chart schemas — reused across them, so a definition such as a reform property lives in a single location.

| Tool | What it does (deterministically) |
| --- | --- |
| `validate_reform` | Type-checks a proposed reform against the parameter tree |
| `calculate_household` | Runs a single household through the model |
| `run_economy_simulation` | Population-level reform impact, including aggregate FRS |
| `analyse_microdata` | Aggregate microdata queries, with access guards |
| `run_python` | Sandboxed Python over engine outputs |
| `generate_chart` | Builds chart JSON deterministically |

## A reference generated from the engine

The model also needs to know what the engine can actually compute, and that surface changes every time `policyengine-uk-compiled` is updated. At deploy time, a build step snapshots the installed engine into a reference document: its reported capabilities, the public API signatures and docstrings, and the full parameter schema. That document is loaded into the system prompt and stamped with the engine version. Because it is generated from the engine rather than written by hand, the model's account of what the engine covers cannot drift from what the engine actually does.

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
