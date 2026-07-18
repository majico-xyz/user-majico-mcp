import { describe, expect, it, vi } from "vitest";

vi.mock("sharp", () => {
  const sharpMock = vi.fn(() => ({
    png: () => ({
      toBuffer: async () => Buffer.from("mock-png"),
    }),
  }));
  return { default: sharpMock };
});

import {
  buildPalettePreviewCardSvg,
  isReeldemoPaletteContext,
  pickPaletteOptionsForDisplay,
  presentLogoCandidates,
  presentPaletteOptions,
  scoreReeldemoPaletteMatch,
} from "./present-interactive.js";

const CTX = {
  projectId: "35b2ce9c-f456-4a82-9480-e2c134b073e9",
  publicBaseUrl: "https://majico.d3bu7.com",
};

const REELDEMO_CTX = {
  projectId: "252e664f-4a92-467d-b07e-6447ab96f3ba",
  publicBaseUrl: "https://majico.d3bu7.com",
  repoHints: ["reeldemo", "ableton"],
};

const SAMPLE_SVG =
  '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="none" stroke="currentColor"/></svg>';

const DARK_STUDIO_OPTION = {
  optionId: "suggested:0",
  label: "Dark studio",
  isSelected: false,
  swatches: {
    light: ["#f8fafc", "#FF6A1A"],
    dark: ["#0B0D10", "#FF6A1A", "#E8EAED", "#1A1D24"],
  },
  previewTokens: {
    light: { bg: "#f8fafc", accent: "#FF6A1A", text: "#111", bgMuted: "#eee" },
    dark: {
      bg: "#0B0D10",
      accent: "#FF6A1A",
      text: "#E8EAED",
      bgMuted: "#1A1D24",
    },
  },
};

const GENERIC_GREEN_OPTION = {
  optionId: "suggested:1",
  label: "Generic green",
  isSelected: false,
  swatches: {
    light: ["#f0fdf4", "#22c55e"],
    dark: ["#14532d", "#22c55e", "#ecfdf5", "#166534"],
  },
  previewTokens: {
    light: {
      bg: "#f0fdf4",
      accent: "#22c55e",
      text: "#111",
      bgMuted: "#dcfce7",
    },
    dark: {
      bg: "#14532d",
      accent: "#22c55e",
      text: "#ecfdf5",
      bgMuted: "#166534",
    },
  },
};

describe("presentLogoCandidates", () => {
  it("returns text plus PNG preview blocks per candidate", async () => {
    const content = await presentLogoCandidates(
      {
        selectedLogoTemplateId: null,
        logoSvg: null,
        logoFavorites: [],
        shortlistCount: 0,
        candidates: [
          { id: "abc-1", kind: "generated", previewSvg: SAMPLE_SVG },
          { id: "abc-2", kind: "generated", previewSvg: SAMPLE_SVG },
        ],
      },
      CTX
    );

    const previews = content.filter(
      (b) => b.type === "image" && b.mimeType === "image/png"
    );
    expect(previews).toHaveLength(2);
    expect(content[0]?.type).toBe("text");
    expect(content[0]?.text).toContain("Logo candidates");
    expect(content[0]?.text).toContain("requiresUserSelection");
    expect(content[0]?.text).toContain("Plan mode");
    expect(
      content.some((b) => b.type === "text" && b.text.includes("abc-1"))
    ).toBe(true);
  });
});

describe("buildPalettePreviewCardSvg", () => {
  it("renders a 320x200 card with swatches, fonts, and lorem", () => {
    const svg = buildPalettePreviewCardSvg({
      label: "Dark studio anchor",
      index: 1,
      tokens: {
        bg: "#0B0D10",
        bgMuted: "#1A1D24",
        text: "#E8EAED",
        accent: "#FF6A1A",
      },
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
    });

    expect(svg).toContain('width="320"');
    expect(svg).toContain('height="200"');
    expect(svg).toContain('fill="#0B0D10"');
    expect(svg).toContain('fill="#FF6A1A"');
    expect(svg).toContain("Space Grotesk");
    expect(svg).toContain("Lorem ipsum");
  });
});

describe("pickPaletteOptionsForDisplay", () => {
  it("caps at three options preferring darker backgrounds", () => {
    const options = [
      { ...GENERIC_GREEN_OPTION, optionId: "suggested:0" },
      { ...DARK_STUDIO_OPTION, optionId: "suggested:1" },
      {
        ...DARK_STUDIO_OPTION,
        optionId: "suggested:2",
        previewTokens: {
          light: DARK_STUDIO_OPTION.previewTokens.light,
          dark: { ...DARK_STUDIO_OPTION.previewTokens.dark, bg: "#050608" },
        },
      },
      {
        ...GENERIC_GREEN_OPTION,
        optionId: "suggested:3",
        previewTokens: {
          light: GENERIC_GREEN_OPTION.previewTokens.light,
          dark: { ...GENERIC_GREEN_OPTION.previewTokens.dark, bg: "#0a1a0f" },
        },
      },
    ];

    const picked = pickPaletteOptionsForDisplay(options, 3);
    expect(picked).toHaveLength(3);
    expect(picked[0]?.previewTokens?.dark.bg).toBe("#050608");
  });
});

describe("scoreReeldemoPaletteMatch", () => {
  it("scores dark studio palette lower than generic green", () => {
    const darkScore = scoreReeldemoPaletteMatch(DARK_STUDIO_OPTION);
    const greenScore = scoreReeldemoPaletteMatch(GENERIC_GREEN_OPTION);
    expect(darkScore).toBeLessThan(greenScore);
  });
});

describe("isReeldemoPaletteContext", () => {
  it("detects reeldemo by project id or repo hints", () => {
    expect(isReeldemoPaletteContext(REELDEMO_CTX)).toBe(true);
    expect(isReeldemoPaletteContext(CTX)).toBe(false);
    expect(isReeldemoPaletteContext({ ...CTX, repoHints: ["reeldemo"] })).toBe(
      true
    );
  });
});

describe("presentPaletteOptions", () => {
  it("does not throw when options omit swatches (sdk/payload drift)", async () => {
    const incomplete = {
      optionId: "suggested:bare",
      label: "Bare",
      isSelected: false,
      swatches: undefined as unknown as { light: string[]; dark: string[] },
    };
    const content = await presentPaletteOptions(
      {
        selectedOptionId: null,
        paletteTokens: null,
        options: [incomplete],
      },
      CTX
    );
    expect(content.length).toBeGreaterThan(0);
    expect(content[0]?.text).toContain("suggested:bare");
  });

  it("pickPaletteOptionsForDisplay tolerates missing swatches", () => {
    const bare = {
      optionId: "x",
      label: "X",
      isSelected: false,
      swatches: undefined as unknown as { light: string[]; dark: string[] },
    };
    expect(() => pickPaletteOptionsForDisplay([bare, DARK_STUDIO_OPTION])).not.toThrow();
  });

  it("renders preview card images with browser pick links", async () => {
    const content = await presentPaletteOptions(
      {
        selectedOptionId: "suggested:0",
        paletteTokens: null,
        headingFont: "Space Grotesk",
        bodyFont: "Inter",
        options: [DARK_STUDIO_OPTION],
        previewToken: "preview-token-abc",
      },
      CTX
    );

    const previews = content.filter(
      (b) => b.type === "image" && b.mimeType === "image/png"
    );
    expect(previews).toHaveLength(1);
    expect(content[0]?.text).toContain("suggested:0");
    expect(content[0]?.text).toContain('"requiresUserSelection": true');
    expect(content[0]?.text).toContain('"previewPickerUrl"');
    expect(content[0]?.text).toContain("[Open palette picker](");
    expect(
      content.some(
        (b) => b.type === "text" && b.text.includes("Pick option 1 in browser")
      )
    ).toBe(true);
    expect(
      content.some(
        (b) =>
          b.type === "text" &&
          b.text.includes("/mcp/preview/palette-picker?project=")
      )
    ).toBe(true);
    expect(
      content.some(
        (b) =>
          b.type === "text" &&
          b.text.includes("/mcp/preview/palette?project=") &&
          b.text.includes("t=preview-token-abc")
      )
    ).toBe(true);
  });

  it("includes requiresUserSelection and advisory reeldemo hint when context matches", async () => {
    const content = await presentPaletteOptions(
      {
        selectedOptionId: null,
        paletteTokens: null,
        options: [DARK_STUDIO_OPTION, GENERIC_GREEN_OPTION],
      },
      REELDEMO_CTX
    );

    expect(content[0]?.text).toContain("requiresUserSelection");
    expect(content[0]?.text).toContain("autoPickForbidden");
    expect(content[0]?.text).toContain("autoPickAllowedWhen");
    expect(content[0]?.text).toContain("Default — wait for user");
    expect(content[0]?.text).toContain("Reeldemo fit (advisory only)");
    expect(content[0]?.text).toContain("Ember Orange");
    expect(content[0]?.text).not.toContain("Prefer it over generic green");
    expect(
      content.some(
        (b) =>
          b.type === "text" &&
          b.text.includes(
            "advisory Reeldemo fit — pick only after user confirms or delegates"
          )
      )
    ).toBe(true);
  });

  it("shows at most three preview cards", async () => {
    const options = Array.from({ length: 5 }, (_, i) => ({
      ...GENERIC_GREEN_OPTION,
      optionId: `suggested:${i}`,
      label: `Option ${i + 1}`,
    }));

    const content = await presentPaletteOptions(
      {
        selectedOptionId: null,
        paletteTokens: null,
        options,
      },
      CTX
    );

    const previews = content.filter(
      (b) => b.type === "image" && b.mimeType === "image/png"
    );
    expect(previews).toHaveLength(3);
    expect(content[0]?.text).toContain("3 of 5 shown");
  });
});
