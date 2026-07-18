import sharp from "sharp";
import type { McpContentBlock } from "./present-types.js";

const PREVIEW_PAD = 16;
const PREVIEW_MARK_SIZE = 64;
const PREVIEW_BG = "#f8fafc";
const PREVIEW_FG = "#0f172a";

/**
 * Prepare SVG for chat PNG rasterization:
 * - replace currentColor (renders black → invisible on dark Cursor chrome)
 * - pad on a light background so outline marks (e.g. book-open) stay visible
 */
export function prepareSvgForChatPreview(svg: string): string {
  const inked = svg
    .replace(/\bcurrentColor\b/gi, PREVIEW_FG)
    .replace(/\bcurrentcolour\b/gi, PREVIEW_FG);

  const size = PREVIEW_MARK_SIZE + PREVIEW_PAD * 2;
  // Nest original SVG; force a concrete box so sharp/librsvg does not crop to empty.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PREVIEW_BG}"/>
  <g transform="translate(${PREVIEW_PAD} ${PREVIEW_PAD})">
    ${inked.replace(
      /<svg\b([^>]*)>/i,
      (_m, attrs: string) => {
        const cleaned = String(attrs)
          .replace(/\s*xmlns(?::\w+)?="[^"]*"/gi, "")
          .replace(/\s*width="[^"]*"/gi, "")
          .replace(/\s*height="[^"]*"/gi, "");
        return `<svg width="${PREVIEW_MARK_SIZE}" height="${PREVIEW_MARK_SIZE}"${cleaned}>`;
      }
    )}
  </g>
</svg>`;
}

/**
 * Rasterize inline SVG to a PNG MCP image block (Cursor renders PNG, not SVG).
 * Soft-fails to a text note when sharp cannot rasterize.
 */
export async function svgPreviewBlock(svg: string): Promise<McpContentBlock> {
  try {
    const prepared = prepareSvgForChatPreview(svg);
    const png = await sharp(Buffer.from(prepared, "utf8")).png().toBuffer();
    return {
      type: "image",
      data: png.toString("base64"),
      mimeType: "image/png",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      type: "text",
      text: `_(PNG preview unavailable: ${message})_`,
    };
  }
}
