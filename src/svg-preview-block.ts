import sharp from "sharp";
import type { McpContentBlock } from "./present-types.js";

/**
 * Rasterize inline SVG to a PNG MCP image block (Cursor renders PNG, not SVG).
 */
export async function svgPreviewBlock(svg: string): Promise<McpContentBlock> {
  const png = await sharp(Buffer.from(svg, "utf8")).png().toBuffer();
  return {
    type: "image",
    data: png.toString("base64"),
    mimeType: "image/png",
  };
}
