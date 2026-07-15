/** Project ambiguity hints for MCP ping / branding workflows. */

import {
  pickRelevantProjects,
  type ProjectRelevanceContext,
  type RankableProject,
  type RankedProject,
} from "./project-relevance.js";

export const PROJECT_SELECTION_HINT =
  "Ask the user before branding tools: use an existing Majico project (pick from relevantProjects) or create a new one (create_project). Present each option with name and description; pass projectId on tool calls once confirmed.";

export type ProjectSummary = RankableProject;

export type ProjectSelectionFields = {
  projectSelectionRequired: boolean;
  relevantProjects: RankedProject[];
  totalProjectCount: number;
  hint?: string;
  suggestedProjectId?: string;
  suggestedProjectName?: string;
  repoHints?: string[];
};

export {
  inferRepoNameHints,
  projectNameMatchesHints,
  findSuggestedProject,
} from "./project-selection-hints.js";

import {
  inferRepoNameHints,
  projectNameMatchesHints,
  findSuggestedProject,
} from "./project-selection-hints.js";

/**
 * Surface ranked project options on ping when scope is not confirmed for this request.
 */
export function buildProjectSelectionFields(params: {
  projects: ProjectSummary[];
  activeProjectId: string;
  activeProjectName: string;
  explicitProjectId?: string;
  consumerRepoPath?: string;
  requestContext?: string;
}): ProjectSelectionFields | null {
  const {
    projects,
    activeProjectId,
    activeProjectName,
    explicitProjectId,
    consumerRepoPath,
    requestContext,
  } = params;

  const hasExplicitProjectId = Boolean(explicitProjectId?.trim());
  const relevanceContext: ProjectRelevanceContext = {
    consumerRepoPath,
    requestContext,
  };
  const repoHints = inferRepoNameHints(consumerRepoPath);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const scopedProject = hasExplicitProjectId
    ? projects.find((p) => p.id === explicitProjectId?.trim())
    : activeProject;
  const scopedName = scopedProject?.name ?? activeProjectName;
  const scopedMatchesRepo = projectNameMatchesHints(scopedName, repoHints);
  const suggested = findSuggestedProject(projects, repoHints);

  const projectSelectionRequired =
    !hasExplicitProjectId || (repoHints.length > 0 && !scopedMatchesRepo);

  if (!projectSelectionRequired) return null;

  const relevantProjects = pickRelevantProjects(projects, relevanceContext);

  const fields: ProjectSelectionFields = {
    projectSelectionRequired,
    relevantProjects,
    totalProjectCount: projects.length,
    hint: PROJECT_SELECTION_HINT,
  };

  if (repoHints.length > 0) {
    fields.repoHints = repoHints;
  }

  if (suggested && suggested.id !== activeProjectId) {
    fields.suggestedProjectId = suggested.id;
    fields.suggestedProjectName = suggested.name;
  }

  return fields;
}
