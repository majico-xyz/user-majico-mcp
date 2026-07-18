import sharp from "sharp";
import type { McpContentBlock } from "./present-types.js";

const PREVIEW_PAD = 24;
const PREVIEW_MARK_SIZE = 96;
const PREVIEW_BG = "#f4f4f5";
const PREVIEW_FG = "#111111";

const IMAGE_ANNOTATIONS = {
  audience: ["user", "assistant"] as ("user" | "assistant")[],
  priority: 0.9,
};

/**
 * Strip the outer <svg>…</svg> wrapper so we can embed mark geometry in a
 * padded preview canvas. Nested <svg> is unreliable under librsvg/sharp on
 * Linux (staging) and often yields empty / solid tiles.
 */
export function extractSvgInnerMarkup(svg: string): string {
  const trimmed = svg.trim();
  const open = trimmed.match(/<svg\b[^>]*>/i);
  if (!open || open.index == null) return trimmed;
  const start = open.index + open[0].length;
  const close = trimmed.toLowerCase().lastIndexOf("</svg>");
  if (close <= start) return trimmed;
  return trimmed.slice(start, close).trim();
}

/**
 * Prepare SVG for chat PNG rasterization:
 * - replace currentColor (invisible on dark Cursor chrome / transparent PNG)
 * - unwrap nested svg (librsvg-safe)
 * - pad on a light background so outline marks stay visible
 */
export function prepareSvgForChatPreview(svg: string): string {
  const inked = svg
    .replace(/\bcurrentColor\b/gi, PREVIEW_FG)
    .replace(/\bcurrentcolour\b/gi, PREVIEW_FG);

  const inner = extractSvgInnerMarkup(inked);
  const size = PREVIEW_MARK_SIZE + PREVIEW_PAD * 2;
  const scale = PREVIEW_MARK_SIZE / 48;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" fill="${PREVIEW_BG}"/>`,
    `<g transform="translate(${PREVIEW_PAD} ${PREVIEW_PAD}) scale(${scale})">`,
    inner,
    `</g>`,
    `</svg>`,
  ].join("");
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
      annotations: IMAGE_ANNOTATIONS,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      type: "text",
      text: `_(PNG preview unavailable: ${message})_`,
    };
  }
}
