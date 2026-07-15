import { inferRepoNameHints } from "./project-selection-hints.js";

export const RELEVANT_PROJECTS_CAP = 5;
export const RELEVANT_PROJECTS_FLOOR = 3;

export type RankableProject = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  hasBrandData: boolean;
  hasCanvasData: boolean;
};

export type RankedProject = RankableProject & {
  relevanceScore: number;
};

export type ProjectRelevanceContext = {
  consumerRepoPath?: string;
  requestContext?: string;
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "majico",
  "project",
  "brand",
  "using",
  "into",
]);

/**
 * Tokenize free-text context (user request, repo folder, etc.) for relevance scoring.
 */
export function tokenizeRelevanceContext(text?: string): string[] {
  if (!text?.trim()) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return [];
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
  return [...new Set(tokens)];
}

function buildContextTokens(context: ProjectRelevanceContext): string[] {
  return [
    ...inferRepoNameHints(context.consumerRepoPath),
    ...tokenizeRelevanceContext(context.requestContext),
  ];
}

function scoreProject(project: RankableProject, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const haystacks = [
    project.name.toLowerCase(),
    project.slug?.toLowerCase() ?? "",
    project.description?.toLowerCase() ?? "",
  ];

  let score = 0;
  for (const token of tokens) {
    for (const [index, haystack] of haystacks.entries()) {
      if (!haystack.includes(token)) continue;
      if (index === 0) score += 10;
      else if (index === 1) score += 4;
      else score += 6;
    }
  }

  const phrase = tokens.slice(0, 4).join(" ");
  if (phrase.length > 4 && project.name.toLowerCase().includes(phrase)) {
    score += 12;
  }

  return score;
}

/** Rank projects by name/description match against repo path and request context. */
export function rankProjectsByRelevance(
  projects: RankableProject[],
  context: ProjectRelevanceContext
): RankedProject[] {
  const tokens = buildContextTokens(context);
  return projects
    .map((project) => ({
      ...project,
      relevanceScore: scoreProject(project, tokens),
    }))
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.name.localeCompare(b.name);
    });
}

/**
 * Pick the 3–5 most relevant projects for user selection (or fewer when the user has less).
 */
export function pickRelevantProjects(
  projects: RankableProject[],
  context: ProjectRelevanceContext
): RankedProject[] {
  const ranked = rankProjectsByRelevance(projects, context);
  if (ranked.length <= RELEVANT_PROJECTS_CAP) return ranked;

  const withSignal = ranked.filter((project) => project.relevanceScore > 0);
  if (withSignal.length >= RELEVANT_PROJECTS_FLOOR) {
    return withSignal.slice(0, RELEVANT_PROJECTS_CAP);
  }

  return ranked.slice(0, RELEVANT_PROJECTS_CAP);
}
