# Automating tax and benefit policy modeling with multi-agent AI

*How we built a system that transforms a policy request into a complete, tested pull request*

## The manual process

When we add a new state benefit program to PolicyEngine, someone has to translate dozens of pages of legal language into working code. The process follows a predictable pattern: research official sources, extract eligibility rules and benefit formulas, write YAML parameters with legal citations, implement the calculation logic, create integration tests, validate against source documents, and handle multiple rounds of review. Each step requires domain expertise and careful attention to regulatory details.

It typically takes 2-3 weeks. We built a system that does it in 90 minutes.

---

## The solution: encode-policy

The `encode-policy` command orchestrates specialized AI agents to automate the entire implementation process. Give it a policy name like "Oregon TANF" and the output is a pull request with parameters, variables, tests, and documentation.

**Agents and skills**: Agents are specialized AI assistants. Instead of one prompt handling research, coding, and testing, each agent focuses on a single task with tools tailored to that job. See the [Claude Code documentation](https://code.claude.com/docs/en/sub-agents) for more on agents.

Skills are reusable knowledge modules that multiple agents share. The [policyengine-variable-patterns-skill](https://github.com/PolicyEngine/policyengine-claude/tree/master/skills/technical-patterns/policyengine-variable-patterns-skill) contains rules about avoiding hard-coded values, entity levels, and aggregation patterns. Six agents load this skill, ensuring consistent code across the workflow.

---

## Architecture: the orchestrator pattern

The encode-policy command never writes code. It invokes specialized agents and checks quality gates between phases.

<iframe src="/assets/posts/encode-policy-multi-agent-ai/diagrams.html" width="100%" height="700" style="border: none; border-radius: 8px;"></iframe>

---

## Design principles

**Source authority**: Collect only primary sources. Anchor parameters to legal documents—statutes, regulations, state plans—and use forms and benefit calculators as supporting references.

**Isolation**: Certain agents operate in isolation to prevent confirmation bias. When agents cannot see each other's output, mismatches between implementation and tests reveal actual bugs rather than shared misconceptions.

**Skills as knowledge base**: Domain expertise lives in reusable modules shared by agents throughout the workflow.

**Orchestrator pattern**: The orchestrator coordinates without implementing. It invokes specialized agents, checks quality gates, and manages workflow state—but never writes code itself.

**Code standards**: Agents enforce repository-specific coding practices—naming conventions, file structure, parameter formatting, and test patterns—through skills that encode these standards.

---

## The evolution: from prompt to workflow

The current system didn't emerge fully formed. It evolved through several iterations, each solving problems revealed by the previous approach.

**Stage 1: Single prompt**: We started with a single prompt asking Claude to implement a TANF program end-to-end. The results fell short—error rates exceeded 70%, parameters lacked citations, tests passed despite incorrect formulas, and variables hard-coded values. Too many aspects for one context to handle well.

**Stage 2: Specialized agents**: Breaking down the development workflow to mirror knowledge gathering, implementation patterns, and review steps reduced error rates. A research agent, a parameter agent, a test agent, a variable agent—each focused on one concern. But without a skills feature, prompts were long and redundant. The same patterns—naming conventions, file structure, code style—appeared in every agent's instructions, often inconsistently.

**Stage 3: Parallelized agent execution**: A critical issue — **tests designed to pass, not to verify**. When a test agent sees implementation code and writes tests afterward, the tests validate what was built rather than what the regulation requires. A bug in the formula and a matching bug in the test cancel out—everything passes, nothing is correct.

The solution: run test-creator and rules-engineer in parallel. Both read the same documentation, neither sees the other's output. When tests fail, it reveals actual discrepancies. We added an edge-case-generator that creates boundary tests after implementation—covering zero income, maximum benefits, cliff edges—based on real-world scenarios rather than implementation details.

**Stage 4: Modular skills**: Results improved, but formatting and code style issues persisted. The likely cause: prompts had grown so long that agents "forgot" rules buried in pages of instructions. Important patterns got lost in the noise.

Then Claude Code released the skills feature. Skills let us extract domain knowledge into reusable modules that agents load on demand. Instead of one agent prompt containing everything about parameters, variables, testing, aggregation, vectorization, and code style, we created focused skills for each concern. Agents load only what they need. The rules-engineer loads `policyengine-variable-patterns-skill` and `policyengine-code-style-skill`. The test-creator loads `policyengine-testing-patterns-skill`. No redundancy, no forgetting.

We re-engineered every agent and workflow around skills. Error rates dropped from 40% to 15%.

---

## Beyond encode-policy

Colleagues using the workflow provided feedback that shaped new features. They wanted to review PRs created outside the workflow. They wanted to fix issues without re-running the entire pipeline. This led to `/review-pr` and `/fix-pr`—commands that reuse the same agents (validators, specialists, ci-fixer) to review any PR, not just those created by encode-policy. The components became building blocks, not just steps in a sequence.

Skills work the same way. The `policyengine-testing-patterns-skill` can be loaded by any agent or user session to get consistent test formatting rules. Skills are context you can inject into any conversation—not tied to specific commands or workflows.

---

## Results

What used to take 2-3 weeks now takes 90 minutes. Specialized agents handle the mechanical work—research, parameterization, testing, documentation—while humans review the final PR and make the merge decision.

The workflow has produced TANF implementations for 42 states, generating over 60,000 lines of code. We have also used it for childcare subsidies and healthcare programs, each following consistent patterns and quality standards.

---

## Try it yourself

The encode-policy command is part of the [policyengine-claude](https://github.com/PolicyEngine/policyengine-claude) repository. To implement a new benefit program:

<pre><code># Add the marketplace<br/>/plugin marketplace add PolicyEngine/policyengine-claude<br/><br/># Install the complete plugin (includes encode-policy command)<br/>/plugin install complete@policyengine-claude<br/><br/># Run the workflow<br/>/encode-policy "Iowa TANF"</code></pre>

The workflow guides you through each phase, checks quality gates, and fixes issues automatically.

---

## What's next

The encode-policy workflow handles individual programs. The next challenge is understanding how programs interact.

**Cross-program validation** is the next focus. Benefit programs form a connected system—SNAP benefits count as unearned income for TANF, Medicaid enrollment affects SSI calculations, and some programs are mutually exclusive. A cross-program validator would detect these interactions during implementation rather than in production.

**Historical implementations** present a different challenge. Parameters support multiple effective dates, but program reforms often involve structural changes—eliminating deductions, adding eligibility categories, or restructuring formulas. We are testing approaches to handle these reforms across time.

---

*PolicyEngine is a nonprofit building free, open-source tools for tax and benefit policy analysis. Learn more at [policyengine.org](https://policyengine.org).*
