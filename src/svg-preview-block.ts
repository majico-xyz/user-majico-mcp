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

/** Runtime `>` so Turbopack/SWC cannot strip `">` from folded template literals. */
function gt(): string {
  return String.fromCharCode(0x3e);
}

/**
 * Ink currentColor and ensure sharp has a root xmlns + explicit size.
 * Avoids wrapping in a second SVG (librsvg + Turbopack `">` corruption).
 */
export function prepareSvgMarkupForRaster(svg: string): string {
  let markup = svg
    .trim()
    .replace(/\bcurrentColor\b/gi, PREVIEW_FG)
    .replace(/\bcurrentcolour\b/gi, PREVIEW_FG);

  // Repair truncated viewBox smashed into the next tag (Turbopack artifact).
  markup = markup.replace(
    /(viewBox\s*=\s*["'][^"']*?)\s*(<[a-zA-Z/])/g,
    (_, vb: string, next: string) => `${vb}"${gt()}${next}`
  );

  if (!/\sxmlns=/i.test(markup)) {
    markup = markup.replace(
      /<svg\b/i,
      `<svg xmlns="http://www.w3.org/2000/svg"`
    );
  }
  if (!/\swidth=/i.test(markup)) {
    const close = gt();
    markup = markup.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) =>
      [
        `<svg${attrs} width="${PREVIEW_MARK_SIZE}" height="${PREVIEW_MARK_SIZE}"`,
        close,
      ].join("")
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
