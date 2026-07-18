import { describe, expect, it } from "vitest";
import {
  prepareSvgForChatPreview,
  prepareSvgMarkupForRaster,
  svgPreviewBlock,
} from "./svg-preview-block.js";

const SAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#FF6A1A"/></svg>';

const BOOK_OPEN_SVG =
  '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M8 8 L8 40 L24 36 L24 12 Z M24 12 L24 36 L40 40 L40 8 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

const YIELDSCOPE_SVG =
  '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><path d="M24 8l-12 16h24z"/></g></svg>';

describe("prepareSvgMarkupForRaster", () => {
  it("replaces currentColor and does not wrap in a second svg", () => {
    const prepared = prepareSvgMarkupForRaster(BOOK_OPEN_SVG);
    expect(prepared).toContain("#111111");
    expect(prepared).not.toMatch(/currentColor/i);
    expect(prepared.match(/<svg\b/gi)?.length ?? 0).toBe(1);
    // Must not emit the Turbopack-corrupted wrapper pattern.
    expect(prepared).not.toContain("144<rect");
  });

  it("prepareSvgForChatPreview aliases raster prep", () => {
    expect(prepareSvgForChatPreview(BOOK_OPEN_SVG)).toBe(
      prepareSvgMarkupForRaster(BOOK_OPEN_SVG)
    );
  });
});

describe("svgPreviewBlock", () => {
  it("returns a PNG MCP image block", async () => {
    const block = await svgPreviewBlock(SAMPLE_SVG);
    expect(block.type).toBe("image");
    expect(block.mimeType).toBe("image/png");
    if (block.type !== "image") return;
    expect(block.data.length).toBeGreaterThan(100);
    expect(block.annotations?.audience).toEqual(["user", "assistant"]);
    expect(
      Buffer.from(block.data, "base64").subarray(0, 4).toString("hex")
    ).toBe("89504e47");
  });

  it("rasterizes book-open currentColor marks to a non-empty PNG", async () => {
    const block = await svgPreviewBlock(BOOK_OPEN_SVG);
    expect(block.type).toBe("image");
    if (block.type !== "image") return;
    const bytes = Buffer.from(block.data, "base64");
    expect(bytes.length).toBeGreaterThan(400);
  });

  it("rasterizes YieldScope circle+triangle mark", async () => {
    const block = await svgPreviewBlock(YIELDSCOPE_SVG);
    expect(block.type).toBe("image");
    if (block.type !== "image") return;
    expect(Buffer.from(block.data, "base64").length).toBeGreaterThan(400);
  });
});
