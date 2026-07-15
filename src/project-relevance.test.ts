import { describe, expect, it } from "vitest";
import {
  pickRelevantProjects,
  rankProjectsByRelevance,
  tokenizeRelevanceContext,
} from "./project-relevance.js";

const projects = [
  {
    id: "proj-dev",
    name: "Dev Canvas Test",
    slug: "dev-canvas-test",
    description: "Internal canvas QA project",
    hasBrandData: true,
    hasCanvasData: true,
  },
  {
    id: "proj-reel",
    name: "Reeldemo Ableton",
    slug: "reeldemo-ableton",
    description: "Live performance visuals for Ableton producers",
    hasBrandData: false,
    hasCanvasData: false,
  },
  {
    id: "proj-acme",
    name: "Acme Analytics",
    slug: "acme-analytics",
    description: "B2B analytics dashboard brand",
    hasBrandData: true,
    hasCanvasData: false,
  },
  {
    id: "proj-notes",
    name: "Notes App",
    slug: "notes-app",
    description: "Minimal note-taking SaaS",
    hasBrandData: false,
    hasCanvasData: false,
  },
];

describe("tokenizeRelevanceContext", () => {
  it("extracts meaningful tokens from a user request", () => {
    expect(
      tokenizeRelevanceContext(
        "Apply Majico branding to my Ableton live set app"
      )
    ).toContain("ableton");
  });
});

describe("rankProjectsByRelevance", () => {
  it("ranks repo-matching projects first", () => {
    const ranked = rankProjectsByRelevance(projects, {
      consumerRepoPath: "/Users/julian/coding-projects/reeldemo-ableton",
    });
    expect(ranked[0]?.id).toBe("proj-reel");
    expect(ranked[0]?.relevanceScore).toBeGreaterThan(0);
  });

  it("uses requestContext when repo hints are absent", () => {
    const ranked = rankProjectsByRelevance(projects, {
      requestContext: "sync analytics dashboard branding",
    });
    expect(ranked[0]?.id).toBe("proj-acme");
  });
});

describe("pickRelevantProjects", () => {
  it("returns at most five projects", () => {
    const many = Array.from({ length: 8 }, (_, index) => ({
      id: `proj-${index}`,
      name: `Project ${index}`,
      description: `Description ${index}`,
      hasBrandData: false,
      hasCanvasData: false,
    }));
    expect(
      pickRelevantProjects(many, { requestContext: "anything" })
    ).toHaveLength(5);
  });

  it("returns fewer than three when the user has fewer projects", () => {
    expect(
      pickRelevantProjects(projects.slice(0, 2), {
        requestContext: "ableton",
      })
    ).toHaveLength(2);
  });
});
