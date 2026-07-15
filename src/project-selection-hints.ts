/** Repo-name hint helpers for MCP project selection. */

export type ProjectSummary = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  hasBrandData: boolean;
  hasCanvasData: boolean;
};

/**
 * Derive searchable tokens from a consumer repo path or folder name.
 * e.g. `/path/reeldemo-ableton` → ["reeldemo", "ableton"]
 */
export function inferRepoNameHints(repoPath?: string): string[] {
  if (!repoPath?.trim()) return [];
  const normalized = repoPath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 2);
  return [...new Set(tokens)];
}

export function projectNameMatchesHints(
  projectName: string,
  hints: string[]
): boolean {
  if (hints.length === 0) return true;
  const normalized = projectName.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
}

export function findSuggestedProject(
  projects: ProjectSummary[],
  hints: string[]
): ProjectSummary | undefined {
  if (hints.length === 0) return undefined;
  return projects.find((project) =>
    projectNameMatchesHints(project.name, hints)
  );
}
