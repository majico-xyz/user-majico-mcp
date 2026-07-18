import { describe, expect, it } from "vitest";
import {
  prepareSvgForChatPreview,
  svgPreviewBlock,
} from "./svg-preview-block.js";

const SAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#FF6A1A"/></svg>';

const BOOK_OPEN_SVG =
  '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M8 8 L8 40 L24 36 L24 12 Z M24 12 L24 36 L40 40 L40 8 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

describe("prepareSvgForChatPreview", () => {
  it("replaces currentColor and pads on a light background", () => {
    const prepared = prepareSvgForChatPreview(BOOK_OPEN_SVG);
    expect(prepared).toContain("#f8fafc");
    expect(prepared).toContain("#0f172a");
    expect(prepared).not.toMatch(/currentColor/i);
  });
});

describe("svgPreviewBlock", () => {
  it("returns a PNG MCP image block", async () => {
    const block = await svgPreviewBlock(SAMPLE_SVG);
    expect(block.type).toBe("image");
    expect(block.mimeType).toBe("image/png");
    if (block.type !== "image") return;
    expect(block.data.length).toBeGreaterThan(100);
    expect(
      Buffer.from(block.data, "base64").subarray(0, 4).toString("hex")
    ).toBe("89504e47");
  });

  it("rasterizes book-open currentColor marks to a non-empty PNG", async () => {
    const block = await svgPreviewBlock(BOOK_OPEN_SVG);
    expect(block.type).toBe("image");
    if (block.type !== "image") return;
    const bytes = Buffer.from(block.data, "base64");
    // Light-bg + dark stroke should be larger than near-empty black square (~300B).
    expect(bytes.length).toBeGreaterThan(400);
  });
});
