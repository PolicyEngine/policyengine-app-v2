export interface AiWorkEntry {
  strand: "economy" | "methods";
  title: string;
  hook: string;
  href: string;
  date: string; // YYYY-MM, newest first within strand
  image: string; // under /assets/posts/
  external?: boolean;
}

// One home for PolicyEngine's AI work. Add entries here — the page renders
// this file, so it cannot drift from what actually exists.
export const aiWork: AiWorkEntry[] = [
  {
    strand: "economy",
    title: "AI beliefs: what frontier models expect about the economy",
    hook: "Elicited beliefs about economic elasticities across 17 models, browsable by parameter.",
    href: "/ai-beliefs",
    image: "/assets/posts/ai-beliefs-dashboard.png",
    date: "2026-07",
  },
  {
    strand: "methods",
    title: "Agent skills for policy analysis",
    hook: "23 CI-tested skills serving Claude Code and Codex, from household calculations to population reform scoring.",
    href: "/us/ai-agents",
    image: "/assets/posts/ai-agent-skills.png",
    date: "2026-07",
  },
  {
    strand: "methods",
    title: "Introducing PolicyBench",
    hook: "How accurately can AI compute taxes and benefits? A benchmark over real statutes.",
    href: "/us/research/introducing-policybench",
    image: "/assets/posts/introducing-policybench.webp",
    date: "2026-06",
  },
  {
    strand: "methods",
    title: "Encoding policy with multi-agent AI",
    hook: "An interactive walkthrough of the pipeline that turns statute text into tested model code.",
    href: "/us/encode-policy-multi-agent-ai",
    image: "/assets/posts/encode-policy-multi-agent.png",
    date: "2026-05",
  },
  {
    strand: "methods",
    title: "Testing multi-agent AI workflows for policy research",
    hook: "What held up and what did not when agent teams ran research end to end.",
    href: "/us/research/multi-agent-workflows-policy-research",
    image: "/assets/posts/multi-agent-workflows-policy-research.webp",
    date: "2025-10",
  },
];
