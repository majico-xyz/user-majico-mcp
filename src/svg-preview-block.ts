import sharp from "sharp";
import type { McpContentBlock } from "./present-types.js";

const PREVIEW_PAD = 24;
const PREVIEW_MARK_SIZE = 96;
const PREVIEW_BG = { r: 0xf4, g: 0xf4, b: 0xf5, alpha: 1 };
const PREVIEW_FG = "#111111";
/** Cap soft-fail SVG so tool results stay small when sharp fails. */
const SOFT_FAIL_SVG_MAX = 1800;

const IMAGE_ANNOTATIONS = {
  audience: ["user", "assistant"] as ("user" | "assistant")[],
  priority: 0.9,
};

/**
 * Markdown data-URI is user-only: avoids doubling base64 into the model context
 * while still giving chat UIs that render markdown images a fallback. Cursor's
 * reliable path is still MCP ImageContent (PNG) below — not link favicons,
 * resource_link icons, or auth-gated SVG preview URLs.
 */
const MARKDOWN_FALLBACK_ANNOTATIONS = {
  audience: ["user"] as ("user")[],
  priority: 0.85,
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

function softFailText(err: unknown, svg: string): McpContentBlock {
  const message = err instanceof Error ? err.message : String(err);
  const clipped =
    svg.length > SOFT_FAIL_SVG_MAX
      ? `${svg.slice(0, SOFT_FAIL_SVG_MAX)}\n<!-- truncated -->`
      : svg;
  return {
    type: "text",
    text: [
      `_(PNG preview unavailable: ${message})_`,
      "Open the browser picker link above if present.",
      "",
      "```svg",
      clipped.trim(),
      "```",
    ].join("\n"),
  };
}

/**
 * Rasterize inline SVG to a PNG MCP image block (Cursor renders PNG, not SVG).
 * Pads on a light canvas via sharp.composite (no wrapper SVG string).
 * Soft-fails to a text note + capped SVG fence when sharp cannot rasterize.
 *
 * Chat “favicons” next to pasted URLs / search hits are Cursor link chrome —
 * not an MCP API. Inline previews need ImageContent (`type: "image"`).
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
    return softFailText(err, svg);
  }
}

/**
 * Dual-emit: user-only markdown data-URI (fallback) + MCP ImageContent PNG.
 * Prefer this for logo/palette cards so Agent mode keeps ImageContent while
 * markdown-capable UIs still get a preview when ImageContent is skipped.
 */
export async function svgPreviewContent(
  svg: string
): Promise<McpContentBlock[]> {
  const block = await svgPreviewBlock(svg);
  if (block.type !== "image") return [block];
  return [
    {
      type: "text",
      text: `![preview](data:${block.mimeType};base64,${block.data})`,
      annotations: MARKDOWN_FALLBACK_ANNOTATIONS,
    },
    block,
  ];
}
