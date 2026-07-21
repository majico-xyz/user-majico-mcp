/**
 * Researched external Cursor UI/UX skills — optional installs for consumer repos.
 * Majico DB skills stay flexible; these are recommendations with install hints.
 * Source: docs/internal/cursor-ui-ux-skills-research.md
 */

export type ExternalSkillKind = "ui" | "ux" | "workflow";

export type RecommendedExternalSkill = {
  id: string;
  name: string;
  kind: ExternalSkillKind;
  author: string;
  why: string;
  whenToUse: string;
  installCommand: string;
  /** Cursor plugin slug if available without npx */
  pluginRef?: string;
  tier: 1 | 2;
  stackHints?: string[];
};

/** Tier 1 — highest impact UI craft skills */
export const KILLER_UI_SKILLS: readonly RecommendedExternalSkill[] = [
  {
    id: "ui-skills-root",
    name: "UI Skills Root",
    kind: "ui",
    author: "ibelick",
    why: "Routes to the smallest useful skill set by topic and stack.",
    whenToUse:
      "Start of any UI task — avoids loading the full 134-skill catalog.",
    installCommand: "npx ui-skills add ui-skills-root",
    tier: 1,
  },
  {
    id: "baseline-ui",
    name: "Baseline UI",
    kind: "ui",
    author: "ibelick",
    why: "Fast deslop: spacing, hierarchy, typography, motion caps, a11y baseline.",
    whenToUse: "After first UI draft; polish pass before ship.",
    installCommand: "npx ui-skills add baseline-ui",
    tier: 1,
    stackHints: ["tailwind", "react"],
  },
  {
    id: "make-interfaces-feel-better",
    name: "Make Interfaces Feel Better",
    kind: "ui",
    author: "jakubkrehel",
    why: "Micro-interactions, radii, hit areas, stagger — high craft ROI.",
    whenToUse: "Buttons, cards, navigation, forms, modals.",
    installCommand: "npx ui-skills add make-interfaces-feel-better",
    tier: 1,
  },
  {
    id: "fixing-accessibility",
    name: "Fixing Accessibility",
    kind: "ui",
    author: "ibelick",
    why: "Prioritized WCAG fixes: names, keyboard, focus, forms.",
    whenToUse: "Interactive controls, dialogs, forms, audits.",
    installCommand: "npx ui-skills add fixing-accessibility",
    tier: 1,
  },
  {
    id: "fixing-motion-performance",
    name: "Fixing Motion Performance",
    kind: "ui",
    author: "ibelick",
    why: "Compositor-safe motion; kills jank and layout-thrashing animations.",
    whenToUse: "CSS/JS transitions, scroll-linked motion.",
    installCommand: "npx ui-skills add fixing-motion-performance",
    tier: 1,
  },
  {
    id: "frontend-design",
    name: "Frontend Design",
    kind: "ui",
    author: "anthropics",
    why: "Distinctive marketing-grade UI that avoids generic AI aesthetics.",
    whenToUse: "Landing/marketing when brand docs allow creative direction.",
    installCommand: "npx ui-skills add frontend-design",
    tier: 1,
  },
  {
    id: "web-design-guidelines",
    name: "Web Design Guidelines",
    kind: "ui",
    author: "vercel-labs",
    why: "Audit UI against interface guidelines (a11y + UX patterns).",
    whenToUse: "Pre-ship review of pages and components.",
    installCommand:
      "npx skills add vercel-labs/agent-skills --skill web-design-guidelines",
    tier: 1,
    stackHints: ["react", "next"],
  },
  {
    id: "12-principles-of-animation",
    name: "12 Principles of Animation",
    kind: "ui",
    author: "raphaelsalaja",
    why: "Disney animation principles applied to web — natural motion language.",
    whenToUse: "Hero entrances, lists, modals, icon morphs.",
    installCommand: "npx ui-skills add 12-principles-of-animation",
    tier: 1,
  },
  {
    id: "oklch-skill",
    name: "OKLCH Color",
    kind: "ui",
    author: "jakubkrehel",
    why: "Build accessible, tunable color systems in OKLCH.",
    whenToUse: "Extending DESIGN.md tokens into full ramps.",
    installCommand: "npx ui-skills add oklch-skill",
    tier: 1,
  },
  {
    id: "ui-design-brain",
    name: "UI Design Brain",
    kind: "ui",
    author: "carmahhawwari",
    why: "60+ component best practices, layouts, anti-patterns from component.gallery.",
    whenToUse: "Greenfield components (tables, modals, nav, etc.).",
    installCommand: "npx skills add carmahhawwari/ui-design-brain",
    tier: 1,
  },
  {
    id: "interface-design",
    name: "Interface Design",
    kind: "ui",
    author: "Dammyjay93",
    why: "Dashboard/admin/SaaS app patterns with craft focus.",
    whenToUse: "App shell, settings, data-dense UI — not marketing landings.",
    installCommand: "npx ui-skills add interface-design",
    tier: 1,
    stackHints: ["react"],
  },
  {
    id: "ui-motion-expressive",
    name: "UI Motion Expressive",
    kind: "ui",
    author: "majico",
    why: "Per-brand motion from DESIGN.md §7 — intensity tiers, Motion One guidance, reduced-motion checklist.",
    whenToUse:
      "Consumer repo handoff when user wants expressive motion; pair with sync_cursor_skills.",
    installCommand:
      "Majico MCP: sync_cursor_skills (ships ui-motion-expressive from project DB)",
    tier: 1,
    stackHints: ["react", "next", "css"],
  },
  {
    id: "shadcn",
    name: "shadcn/ui",
    kind: "ui",
    author: "shadcn-ui",
    why: "Project-aware shadcn compose, add, and fix patterns.",
    whenToUse: "Repos already using shadcn/ui.",
    installCommand: "npx ui-skills add shadcn",
    tier: 1,
    stackHints: ["react", "tailwind", "shadcn"],
  },
] as const;

/** Tier 1 — highest impact UX skills */
export const KILLER_UX_SKILLS: readonly RecommendedExternalSkill[] = [
  {
    id: "shape",
    name: "Shape (UX brief)",
    kind: "ux",
    author: "pbakaus",
    why: "Structured design interview → actionable brief before coding.",
    whenToUse: "New feature or screen with unclear UX requirements.",
    installCommand: "npx ui-skills add shape",
    tier: 1,
  },
  {
    id: "clarify",
    name: "Clarify",
    kind: "ux",
    author: "pbakaus",
    why: "Improves labels, microcopy, and action clarity.",
    whenToUse: "Forms, onboarding, CTAs, empty states.",
    installCommand: "npx ui-skills add clarify",
    tier: 1,
  },
  {
    id: "critique",
    name: "Critique",
    kind: "ux",
    author: "pbakaus",
    why: "Structured UX scoring with persona checks and fixes.",
    whenToUse: "Review existing UI for UX quality.",
    installCommand: "npx ui-skills add critique",
    tier: 1,
  },
  {
    id: "harden",
    name: "Harden",
    kind: "ux",
    author: "pbakaus",
    why: "Production UX: empty/error/edge cases, onboarding, i18n resilience.",
    whenToUse: "Pre-launch hardening pass.",
    installCommand: "npx ui-skills add harden",
    tier: 1,
  },
  {
    id: "distill",
    name: "Distill",
    kind: "ux",
    author: "pbakaus",
    why: "Simplify overloaded interfaces; restore focus.",
    whenToUse: "Busy dashboards, settings, feature-creep screens.",
    installCommand: "npx ui-skills add distill",
    tier: 1,
  },
  {
    id: "polish",
    name: "Polish",
    kind: "ux",
    author: "pbakaus",
    why: "Final alignment/spacing/consistency pass for launch readiness.",
    whenToUse: "Last mile before ship (pairs with ui-craft-polish).",
    installCommand: "npx ui-skills add polish",
    tier: 1,
  },
  {
    id: "interaction-design",
    name: "Interaction Design",
    kind: "ux",
    author: "wshobson",
    why: "Microinteractions, feedback, transitions for delightful flows.",
    whenToUse: "Wizards, multi-step flows, async states.",
    installCommand: "npx ui-skills add interaction-design",
    tier: 1,
  },
  {
    id: "uxauditor",
    name: "UXAuditor",
    kind: "ux",
    author: "aihxp",
    why: "End-to-end UX audit with scored uxaudit.md report.",
    whenToUse: "Full product UX review; handoff to fix agents.",
    installCommand: "npx skills add aihxp/uxauditor",
    tier: 1,
  },
  {
    id: "ux-expert",
    name: "UX Expert",
    kind: "ux",
    author: "felixgeelhaar",
    why: "Heuristics, IA, WCAG, dark patterns, agentic UI patterns.",
    whenToUse: "Strategic UX questions and heuristic evaluation.",
    installCommand: "npx skills add felixgeelhaar/skills --skill ux-expert",
    tier: 1,
  },
  {
    id: "wcag-audit-patterns",
    name: "WCAG Audit Patterns",
    kind: "ux",
    author: "wshobson",
    why: "WCAG 2.2 audit playbook with remediation strategies.",
    whenToUse: "Compliance sprint or a11y lawsuit prep.",
    installCommand: "npx ui-skills add wcag-audit-patterns",
    tier: 1,
  },
] as const;

export const WORKFLOW_SKILLS: readonly RecommendedExternalSkill[] = [
  {
    id: "brainstorming",
    name: "Brainstorming",
    kind: "workflow",
    author: "obra/superpowers",
    why: "Explore options before committing to layout or architecture.",
    whenToUse: "Greenfield screens; user hasn't picked direction.",
    installCommand: "npx skills add obra/superpowers --skill brainstorming",
    pluginRef: "brainstorming",
    tier: 2,
  },
  {
    id: "verification-before-completion",
    name: "Verification Before Completion",
    kind: "workflow",
    author: "obra/superpowers",
    why: "Evidence before claiming UI work is done.",
    whenToUse: "Before PR, commit, or ack_cursor_handoff.",
    installCommand:
      "npx skills add obra/superpowers --skill verification-before-completion",
    pluginRef: "verification-before-completion",
    tier: 2,
  },
] as const;

export type RecommendedSkillsBundle = {
  id: string;
  label: string;
  skills: string[];
  note: string;
};

export const RECOMMENDED_SKILL_BUNDLES: readonly RecommendedSkillsBundle[] = [
  {
    id: "marketing-landing",
    label: "Marketing / landing",
    skills: [
      "ui-skills-root",
      "baseline-ui",
      "make-interfaces-feel-better",
      "ui-motion-expressive",
      "landing-page-oneshot",
      "fixing-accessibility",
      "clarify",
      "polish",
    ],
    note: "Pair with Majico sync_cursor_skills + BRAND.md + DESIGN.md. Load landing-page-oneshot for section order and hero budget.",
  },
  {
    id: "saas-app",
    label: "SaaS app UI",
    skills: [
      "ui-skills-root",
      "interface-design",
      "harden",
      "fixing-accessibility",
      "web-design-guidelines",
    ],
    note: "Add react-best-practices for Next/React repos.",
  },
  {
    id: "design-system",
    label: "Design-system repo",
    skills: [
      "shadcn",
      "oklch-skill",
      "fixing-accessibility",
      "wcag-audit-patterns",
    ],
    note: "Add team-authored component-usage + token-reference skills.",
  },
] as const;

export function buildRecommendedExternalSkillsPayload(): {
  killerUi: RecommendedExternalSkill[];
  killerUx: RecommendedExternalSkill[];
  workflow: RecommendedExternalSkill[];
  bundles: RecommendedSkillsBundle[];
  catalogUrl: string;
  researchDoc: string;
} {
  return {
    killerUi: [...KILLER_UI_SKILLS],
    killerUx: [...KILLER_UX_SKILLS],
    workflow: [...WORKFLOW_SKILLS],
    bundles: [...RECOMMENDED_SKILL_BUNDLES],
    catalogUrl: "https://www.ui-skills.com/skills/",
    researchDoc: "docs/internal/cursor-ui-ux-skills-research.md",
  };
}
