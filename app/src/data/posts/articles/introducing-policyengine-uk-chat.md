PolicyEngine is excited to announce **PolicyEngine UK Chat**, a new beta conversational interface for UK tax and benefit questions that connects AI to the PolicyEngine microsimulation model.

The product starts from a simple problem. People increasingly ask AI systems questions about tax and benefit reforms. Large language models can understand these questions and explain answers clearly, but tax and benefit questions often need a degree of accuracy that models do not yet offer on their own: the figure has to come from a model whose assumptions can be inspected and verified.

PolicyEngine UK Chat is designed around that split. The AI reads the question and works out what kind of policy task is being asked, while the figures come from verifiable, deterministic calculations, parameter lookups, and output formatting in [PolicyEngine UK](https://github.com/PolicyEngine/policyengine-uk). In this way, PolicyEngine UK Chat pairs the language strengths of large language models with the accuracy and testability PolicyEngine UK offers.

Try the beta at [policyengine-uk-chat.vercel.app](https://policyengine-uk-chat.vercel.app/).

<svg viewBox="0 0 760 170" role="img" aria-label="How PolicyEngine UK Chat answers a question: your question, the AI interprets and plans, PolicyEngine computes the figures, and the answer is returned with stated assumptions." xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:680px;height:auto;display:block;margin:24px auto;font-family:system-ui,-apple-system,sans-serif">
  <defs>
    <marker id="bArrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#2C6496"/></marker>
  </defs>
  <rect x="8" y="36" width="160" height="74" rx="10" fill="#F7FAFC" stroke="#D5DCE4" stroke-width="1.5"/>
  <text x="88" y="78" text-anchor="middle" fill="#13233A" font-size="13" font-weight="600">Your question</text>
  <rect x="200" y="36" width="160" height="74" rx="10" fill="#E6F4F1" stroke="#319795" stroke-width="1.5"/>
  <text x="280" y="72" text-anchor="middle" fill="#13233A" font-size="13" font-weight="600">AI interprets</text>
  <text x="280" y="90" text-anchor="middle" fill="#13233A" font-size="13" font-weight="600">&amp; plans</text>
  <rect x="392" y="36" width="160" height="74" rx="10" fill="#17354F" stroke="#17354F"/>
  <text x="472" y="68" text-anchor="middle" fill="#EAF1F8" font-size="13" font-weight="700">PolicyEngine</text>
  <text x="472" y="86" text-anchor="middle" fill="#EAF1F8" font-size="13" font-weight="700">computes</text>
  <text x="472" y="103" text-anchor="middle" fill="#9FB6D0" font-size="10">calculations · lookups</text>
  <rect x="584" y="36" width="168" height="74" rx="10" fill="#F7FAFC" stroke="#D5DCE4" stroke-width="1.5"/>
  <text x="668" y="72" text-anchor="middle" fill="#13233A" font-size="13" font-weight="600">Answer with</text>
  <text x="668" y="90" text-anchor="middle" fill="#13233A" font-size="13" font-weight="600">stated assumptions</text>
  <line x1="168" y1="73" x2="196" y2="73" stroke="#2C6496" stroke-width="1.6" marker-end="url(#bArrow)"/>
  <line x1="360" y1="73" x2="388" y2="73" stroke="#2C6496" stroke-width="1.6" marker-end="url(#bArrow)"/>
  <line x1="552" y1="73" x2="580" y2="73" stroke="#2C6496" stroke-width="1.6" marker-end="url(#bArrow)"/>
  <text x="280" y="132" text-anchor="middle" fill="#319795" font-size="10" font-weight="700" letter-spacing="1">PREDICTIVE AI</text>
  <text x="472" y="132" text-anchor="middle" fill="#2C6496" font-size="10" font-weight="700" letter-spacing="1">DETERMINISTIC ENGINE</text>
</svg>

## What it does

PolicyEngine UK Chat lets users ask UK tax and benefit questions in plain English, underpinned by the accuracy and verifiability of PolicyEngine UK. Users can:

- **Look up current policy settings**, including allowances, rates, thresholds, benefit amounts, limits, and tapers
- **Calculate illustrative households** to see modelled taxes, benefits, and net income under stated assumptions
- **Explore parametric reforms** across the UK population, including budgetary impact, programme changes, poverty measures, decile impacts, winners and losers, and caseloads
- **Turn computed outputs into charts** when a visual comparison is clearer than prose or a table
- **Ask follow-up questions** in the same thread, moving from a rule lookup to a household example or reform analysis without switching tools

## Why this needs more than a language model

PolicyEngine has been measuring this problem directly. In [PolicyBench](https://policyengine.org/us/research/introducing-policybench), we evaluated how accurately AI models compute taxes and benefits from household prompts without tools or lookups, scoring their answers against deterministic PolicyEngine outputs.

The result is clear: unaided predictive AI is not yet accurate enough to calculate taxes and benefits without a deterministic model behind it. In the launch results, the top model — OpenAI's GPT-5.5 — matched PolicyEngine exactly on only 80.3% of its scored outputs. Computed amounts were the hardest cases: federal and state income tax before credits scored far lower than eligibility flags, because they require sequencing income concepts, thresholds, exclusions, and credits correctly.

PolicyEngine UK Chat addresses this finding by placing the deterministic PolicyEngine UK model at its heart. The AI interprets the user's question, but the tax and benefit figures come from PolicyEngine calculations, model parameters, and clearly stated assumptions.

## How the product is designed

The central design principle is the boundary between predictive AI and deterministic software.

The **predictive** parts are where language models are useful: interpreting the user's wording, deciding which type of analysis is being requested, drafting explanations, and suggesting follow-up questions. Those tasks are open-ended and language-heavy.

The **deterministic** parts are where users need verifiable outputs: validating the request, looking up parameters, constructing household inputs, running simulations, producing chart data, and returning structured results. These tasks should not depend on model memory, and the runtime enforces that boundary rather than relying on instructions in a prompt.

When a question is ready for computation, the model is given calculation tools and a reference generated from the installed engine — its capabilities and parameter schema — so the model's view of what it can compute is tied to the deployed version of PolicyEngine rather than to a hand-written prompt that can drift.

That scoped tool surface is the boundary between the predictive AI layer and PolicyEngine's deterministic calculations. The current surface includes tools for parameter lookup, illustrative household calculation, economy-wide simulation, reform validation, and chart generation, though the exact list will change as the beta evolves.

## Limitations

PolicyEngine UK Chat is in **beta**. It is a modelling tool, not professional advice: it reports what the model calculates under stated assumptions, and results depend on the dataset, the year, and those assumptions. Only the major UK tax and benefit programmes are modelled, so questions about minor or unmodelled provisions may not be answerable. As with any beta, verify important results before relying on them.

## Try it out

PolicyEngine UK Chat is available now in beta. Try it with a tax or benefit question, a household scenario, or a reform you want to understand.

When an answer looks wrong, incomplete, or confusing, use the **Report issue** button in the chat. It opens a prefilled GitHub issue with the shared thread and your note, so we can inspect the question, the tools used, the calculated outputs, and the final explanation.
