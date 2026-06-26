Most AI chatbots answer a tax-or-benefit question by guessing the number from memory. [PolicyEngine UK Chat](https://policyengine.org/uk) instead computes every number from the actual rules, by running our microsimulation engine. When a question needs a figure, the chat calls a tool that runs the calculation rather than letting the model supply it.

Language models are increasingly used to ask how a tax or benefit change would work, because a model can read a loosely worded question and answer it in plain language. The difficulty is that a language model [produces its numbers from memory](https://www.gov.uk/government/publications/ai-playbook-for-the-uk-government/artificial-intelligence-playbook-for-the-uk-government-html#:~:text=large%20language%20models%20%28LLMs%29,may%20actually%20be%20factually%20incorrect), and in policy work the figure is usually what matters. PolicyEngine UK Chat is an AI chat interface to PolicyEngine UK that answers UK tax-and-benefit questions in a conversation and runs the engine for every calculation.

## Why calculation is separate

A language model generates text by [predicting continuations](https://en.wikipedia.org/wiki/Large_language_model#:~:text=Autoregressive%20models,how%20a%20sequence%20continues), not by applying tax and benefit rules. Ask one what Universal Credit a lone parent receives and it returns a number without running the taper, the work allowance, or the benefit rates.

Prompting does not change this. Instructing a model to state only real figures does not give it the rules; it changes the wording around the same guess. A model can recite the correct taper rate and still get the arithmetic wrong, and the output reads identically whether the figure is right or wrong, so you cannot tell from the answer which it is. A figure that is wrong but reads as an answer can be [harder to catch than no figure at all](https://post.parliament.uk/research-briefings/post-pn-0708/).

[This matters when results feed decisions](https://www.nao.org.uk/reports/use-of-artificial-intelligence-in-government/). A researcher, a charity adviser, or a journalist comparing two reforms needs figures that come from a stated model, not from a model's recollection of figures it has seen. The same applies to a household trying to work out how a threshold change affects its own income: the figure has to come from the rules, with the assumptions written down, so it can be reproduced.

## The model plans, the tools calculate

AI tools like [Claude](https://claude.com/claude) or ChatGPT read the question, work out what is being asked, and select a tool. The system prompt requires every number to come from a tool result, and the tools, not the model, perform the calculation. Most numbers come from typed calculation tools that call the [PolicyEngine UK microsimulation engine](https://github.com/PolicyEngine/policyengine-uk); some come from sandboxed Python over the same engine when a question falls outside those tools.

This split is the central design principle: anything that affects a number or an artefact is handled by code, so it can be audited rather than trusted, while the open-ended work — reading the question, planning, choosing a tool, and writing the answer — is left to the model.

The engine applies the rules, and it is open source, so anyone can check how a number is produced. The same rules sit behind our web app and Python package, which keeps the chat's answers consistent with the rest of PolicyEngine.

## What it can answer

The chat exposes six tools: three that run calculations on the engine, and three that support them. Every figure they return comes from a computation, not from the model.

<svg viewBox="0 0 760 330" role="img" aria-label="The six tools: calculate_household, run_economy_simulation and analyse_microdata run calculations; generate_chart, run_python and validate_reform support them" style="width:100%;max-width:680px;height:auto;display:block;margin:24px auto;font-family:system-ui,-apple-system,sans-serif">
  <rect x="16" y="14" width="226" height="128" rx="10" fill="#17354F" stroke="#17354F"/>
  <text x="32" y="46" fill="#EAF1F8" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">calculate_household</text>
  <text x="32" y="72" fill="#9FB6D0" font-size="11">One synthetic household →</text>
  <text x="32" y="90" fill="#9FB6D0" font-size="11">UC, Child Benefit, net income</text>
  <rect x="267" y="14" width="226" height="128" rx="10" fill="#17354F" stroke="#17354F"/>
  <text x="283" y="46" fill="#EAF1F8" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">run_economy_simulation</text>
  <text x="283" y="72" fill="#9FB6D0" font-size="11">A reform across everyone →</text>
  <text x="283" y="90" fill="#9FB6D0" font-size="11">budget, deciles, gains and</text>
  <text x="283" y="108" fill="#9FB6D0" font-size="11">losses, poverty</text>
  <rect x="518" y="14" width="226" height="128" rx="10" fill="#17354F" stroke="#17354F"/>
  <text x="534" y="46" fill="#EAF1F8" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">analyse_microdata</text>
  <text x="534" y="72" fill="#9FB6D0" font-size="11">Aggregate population</text>
  <text x="534" y="90" fill="#9FB6D0" font-size="11">questions</text>
  <rect x="16" y="174" width="226" height="128" rx="10" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="32" y="206" fill="#13233A" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">generate_chart</text>
  <text x="32" y="232" fill="#62707E" font-size="11">Turns any result</text>
  <text x="32" y="250" fill="#62707E" font-size="11">into a chart</text>
  <rect x="267" y="174" width="226" height="128" rx="10" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="283" y="206" fill="#13233A" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">run_python</text>
  <text x="283" y="232" fill="#62707E" font-size="11">Sandboxed Python for</text>
  <text x="283" y="250" fill="#62707E" font-size="11">questions the tools don't cover</text>
  <rect x="518" y="174" width="226" height="128" rx="10" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="534" y="206" fill="#13233A" font-size="12.5" font-weight="700" font-family="ui-monospace,Menlo,monospace">validate_reform</text>
  <text x="534" y="232" fill="#62707E" font-size="11">Checks a reform definition</text>
  <text x="534" y="250" fill="#62707E" font-size="11">before it is used</text>
</svg>

Household examples are built for the question and labelled as synthetic illustrations, not real people.

## How it works

### The architecture

The runtime is a FastAPI server-sent-events handler that calls the Anthropic SDK directly. There is no agent framework in the request path: the chat owns its tool loop, because the rules that matter are enforced inside that loop rather than around it. A request then runs in a fixed order:

1. Validate the request and check the account's balance.
2. Assemble the system blocks — the system prompt and an engine reference generated from the installed engine — both marked for prompt caching.
3. Open a streaming call to a Claude model, defaulting to Claude Haiku and escalating to Claude Sonnet when the estimated input-token count of the assembled request (messages, system prompt, and engine reference) passes a fixed threshold.
4. Read the model's output as it streams; whenever it asks for a tool, run that tool through a deterministic executor and feed the result back, repeating until the model stops.
5. Stream events to the client throughout.

The diagram below traces one request through that loop — the model requesting tools, the code running them and feeding results back, each iteration reaching the client as a server-sent event.

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
  <text x="288" y="145" fill="#0F766E" font-size="11">result → back into model</text>
  <rect x="295" y="392" width="200" height="54" rx="8" fill="#EAF1F8" stroke="#2C6496" stroke-width="1.5"/>
  <text x="395" y="416" text-anchor="middle" fill="#13233A" font-size="13">SSE events → client</text>
  <text x="395" y="434" text-anchor="middle" fill="#62707E" font-size="11">chunk · tool_* · done</text>
  <path d="M530,284 C530,360 495,360 460,392" stroke="#2C6496" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
</svg>

### The tool-use loop

Inside that loop, the streaming API returns content as a sequence of blocks, which the chat processes as they arrive:

1. Watch for tool-use blocks, each naming a tool and carrying a JSON input.
2. Resolve the name against a dispatch table and run the handler; independent tools requested in the same turn run concurrently.
3. Append each result to the conversation as a tool-result turn before streaming the next.

Two controls keep the loop bounded. An iteration cap limits how many tool rounds a single request can take, and a repeated-call check stops the loop with an error when three identical calls arrive in a row, which means the model is stuck. When a single tool raises, the error is caught and returned to the model as that tool's result so it can adjust rather than the request failing outright; if the cap is reached first, the chat returns a message naming the tools it attempted and the last error, then a clean terminal event, so the client always receives a proper ending.

The tools are defined in one place, with shared schema fragments — the year, reform-property, dataset, filter, and chart schemas — reused across them, so a definition such as a reform property lives in a single location.

### What the model and code decide

The boundary between the model and the code is written down and treated as a contract. The model handles the parts that are open-ended: interpreting the question, planning, selecting tools, writing prose, and suggesting follow-ups. The code handles everything that affects a number or a displayed result: request validation, tool dispatch, the typed tools themselves — including Python execution and chart construction — result truncation and summarisation, billing, and database writes.

Some of these could be left to the model and deliberately are not. If the model chose which rows of a large table to show, that choice would be a sampling decision, and a sampling decision the reader cannot see is one the reader cannot check. A deterministic helper makes it instead, so the choice can be inspected rather than taken on trust.

Plan mode follows the same logic. It lets the model talk through an approach before running anything. Telling the model "do not call tools" in the prompt is a request it can ignore, so the chat does not rely on that: in plan mode the list of tools is left out of the request entirely, and a model cannot call a tool it was never offered.

### The engine reference

The model also needs to know what the engine can actually compute, and that surface changes every time `policyengine-uk-compiled` is updated. At deploy time, a build step snapshots the installed engine into a reference document: its reported capabilities, the public API signatures and docstrings, and the full parameter schema. That document is loaded into the system prompt and reflects the engine installed at deploy time. Because it is generated from the engine rather than written by hand, the model's account of what the engine covers cannot drift from what the engine actually does.

## Where it falls short

The chat is a modelling tool, not advice. It reports what the model calculates under stated assumptions, and it is not a substitute for professional guidance on an individual's circumstances.

`run_economy_simulation` handles parametric reforms, meaning changes to existing rates, thresholds, and parameters. Reforms that introduce new mechanisms fall back to `run_python`, which we review, or sit outside the standard tools. Only the major UK tax and benefit programmes are modelled, so questions about minor or unmodelled provisions may not be answerable.

Results depend on the dataset, the year, and the modelling assumptions, and the chat states these dependencies rather than presenting figures as universal. The aim is that every path either produces a number you can check or says plainly that it cannot. It is free to try, and its answers can be cited and reproduced: because the figures come from the same open engine that powers the rest of PolicyEngine, they can be checked against independent estimates, such as those from the IFS, the Resolution Foundation, or the OBR.

## Next steps

We want to widen the range of reforms the typed tools cover, so fewer questions fall back to reviewed Python, and to make that fallback quicker to run and inspect. PolicyEngine UK Chat works alongside our wider use of Claude and our plugin ecosystem, which bring the same engine to researchers building their own analyses. Try it with a reform you care about, and check the figures against the open-source engine that produced them.
