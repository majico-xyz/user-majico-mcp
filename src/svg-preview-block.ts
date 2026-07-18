import sharp from "sharp";
import type { McpContentBlock } from "./present-types.js";

const PREVIEW_PAD = 24;
const PREVIEW_MARK_SIZE = 96;
const PREVIEW_BG = { r: 0xf4, g: 0xf4, b: 0xf5, alpha: 1 };
const PREVIEW_FG = "#111111";

const IMAGE_ANNOTATIONS = {
  audience: ["user", "assistant"] as ("user" | "assistant")[],
  priority: 0.9,
};

/**
 * Ink currentColor and ensure sharp has a root xmlns + explicit size.
 * Does not wrap in a second SVG — Turbopack/SWC has corrupted HTML-looking
 * `">` sequences in constant-folded template strings in Next production chunks
 * (e.g. `viewBox="0 0 144 144<rect`), which breaks librsvg.
 */
export function prepareSvgMarkupForRaster(svg: string): string {
  let markup = svg
    .trim()
    .replace(/\bcurrentColor\b/gi, PREVIEW_FG)
    .replace(/\bcurrentcolour\b/gi, PREVIEW_FG);

  if (!/\sxmlns=/i.test(markup)) {
    markup = markup.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }
  if (!/\swidth=/i.test(markup)) {
    markup = markup.replace(
      /<svg\b([^>]*)>/i,
      `<svg$1 width="${PREVIEW_MARK_SIZE}" height="${PREVIEW_MARK_SIZE}">`
    );
  }
  return markup;
}

/** @deprecated Use prepareSvgMarkupForRaster — kept for call-site compatibility. */
export function prepareSvgForChatPreview(svg: string): string {
  return prepareSvgMarkupForRaster(svg);
}

/**
 * Rasterize inline SVG to a PNG MCP image block (Cursor renders PNG, not SVG).
 * Pads on a light canvas via sharp.composite (no wrapper SVG string).
 * Soft-fails to a text note when sharp cannot rasterize.
 */
export async function svgPreviewBlock(svg: string): Promise<McpContentBlock> {
  try {
    const markup = prepareSvgMarkupForRaster(svg);
    const markPng = await sharp(Buffer.from(markup, "utf8"))
      .resize(PREVIEW_MARK_SIZE, PREVIEW_MARK_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const size = PREVIEW_MARK_SIZE + PREVIEW_PAD * 2;
    const png = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: PREVIEW_BG,
      },
    })
      .composite([{ input: markPng, left: PREVIEW_PAD, top: PREVIEW_PAD }])
      .png()
      .toBuffer();

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
