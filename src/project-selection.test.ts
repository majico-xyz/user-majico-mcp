import { describe, expect, it } from "vitest";
import {
  buildProjectSelectionFields,
  PROJECT_SELECTION_HINT,
} from "./project-selection.js";
import {
  inferRepoNameHints,
  projectNameMatchesHints,
} from "./project-selection-hints.js";

describe("inferRepoNameHints", () => {
  it("extracts tokens from hyphenated repo folder names", () => {
    expect(
      inferRepoNameHints("/Users/julian/coding-projects/reeldemo-ableton")
    ).toEqual(["reeldemo", "ableton"]);
  });

  it("returns empty for missing path", () => {
    expect(inferRepoNameHints("")).toEqual([]);
  });
});

describe("projectNameMatchesHints", () => {
  it("matches when project name contains a repo hint", () => {
    expect(projectNameMatchesHints("Reeldemo Ableton", ["reeldemo"])).toBe(
      true
    );
    expect(projectNameMatchesHints("Dev Canvas Test", ["reeldemo"])).toBe(
      false
    );
  });

  it("treats empty hints as non-blocking", () => {
    expect(projectNameMatchesHints("Dev Canvas Test", [])).toBe(true);
  });
});

describe("buildProjectSelectionFields", () => {
  const projects = [
    {
      id: "proj-dev",
      name: "Dev Canvas Test",
      description: "Internal canvas QA project",
      hasBrandData: true,
      hasCanvasData: true,
    },
    {
      id: "proj-reel",
      name: "Reeldemo Ableton",
      description: "Live performance visuals for Ableton",
      hasBrandData: false,
      hasCanvasData: false,
    },
  ];

  it("requires selection when only one project and no explicit projectId", () => {
    const fields = buildProjectSelectionFields({
      projects: [projects[0]!],
      activeProjectId: "proj-dev",
      activeProjectName: "Dev Canvas Test",
    });
    expect(fields).toMatchObject({
      projectSelectionRequired: true,
      hint: PROJECT_SELECTION_HINT,
      totalProjectCount: 1,
      relevantProjects: [
        expect.objectContaining({ id: "proj-dev", name: "Dev Canvas Test" }),
      ],
    });
  });

  it("requires selection when multiple projects and no explicit projectId", () => {
    const fields = buildProjectSelectionFields({
      projects,
      activeProjectId: "proj-dev",
      activeProjectName: "Dev Canvas Test",
      consumerRepoPath: "/path/reeldemo-ableton",
    });
    expect(fields).toMatchObject({
      projectSelectionRequired: true,
      hint: PROJECT_SELECTION_HINT,
      totalProjectCount: 2,
      repoHints: ["reeldemo", "ableton"],
      suggestedProjectId: "proj-reel",
      suggestedProjectName: "Reeldemo Ableton",
    });
    expect(fields?.relevantProjects[0]?.id).toBe("proj-reel");
    expect(fields?.relevantProjects).toHaveLength(2);
  });

  it("requires selection when explicit project mismatches consumer repo hints", () => {
    const fields = buildProjectSelectionFields({
      projects,
      activeProjectId: "proj-dev",
      activeProjectName: "Dev Canvas Test",
      explicitProjectId: "proj-dev",
      consumerRepoPath: "reeldemo-ableton",
    });
    expect(fields?.projectSelectionRequired).toBe(true);
    expect(fields?.suggestedProjectId).toBe("proj-reel");
  });

  it("returns null when explicit project matches repo hints", () => {
    const fields = buildProjectSelectionFields({
      projects,
      activeProjectId: "proj-reel",
      activeProjectName: "Reeldemo Ableton",
      explicitProjectId: "proj-reel",
      consumerRepoPath: "reeldemo-ableton",
    });
    expect(fields).toBeNull();
  });
});
