import { describe, expect, it } from "vitest";
import { svgPreviewBlock } from "./svg-preview-block.js";

const SAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#FF6A1A"/></svg>';

describe("svgPreviewBlock", () => {
  it("returns a PNG MCP image block", async () => {
    const block = await svgPreviewBlock(SAMPLE_SVG);
    expect(block.type).toBe("image");
    expect(block.mimeType).toBe("image/png");
    expect(block.data.length).toBeGreaterThan(100);
    expect(
      Buffer.from(block.data, "base64").subarray(0, 4).toString("hex")
    ).toBe("89504e47");
  });
});
