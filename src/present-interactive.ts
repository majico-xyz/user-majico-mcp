import { svgPreviewBlock } from "./svg-preview-block.js";
import type { McpContentBlock, PresentContext } from "./present-types.js";

export type { McpContentBlock, PresentContext } from "./present-types.js";

type PaletteOptionRow = {
  optionId: string;
  label: string;
  isSelected: boolean;
  swatches: { light: string[]; dark: string[] };
  previewTokens?: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

type PaletteCandidatesPayload = {
  options?: PaletteOptionRow[];
  selectedOptionId: string | null;
  paletteTokens: {
    light: Record<string, string>;
    dark: Record<string, string>;
  } | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  agentInstructions?: string;
  projectId?: string | null;
  projectName?: string | null;
  previewToken?: string | null;
  previewPickerUrl?: string | null;
};

type LogoCandidateRow = {
  id: string;
  kind: string;
  previewSvg: string;
  templateId?: string | null;
  userRating?: string | null;
};

type LogoCandidatesPayload = {
  selectedLogoTemplateId: string | null;
  logoSvg: string | null;
  logoFavorites: unknown[];
  shortlistCount: number;
  candidates: LogoCandidateRow[];
  emptyReason?: string | null;
  guidance?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  previewToken?: string | null;
  previewPickerUrl?: string | null;
};

type CursorHandoffPayload = {
  event: string;
  browserUrl: string;
  chatPrompt: string;
};

type CursorHandoffPayloadResponse = {
  pending: boolean;
  handoff: CursorHandoffPayload | null;
};

type TweetDraftsPayload = {
  drafts?: Array<{ draftId: string; text: string }>;
  agentInstructions?: string;
};

const REELDEMO_PROJECT_ID = "252e664f-4a92-467d-b07e-6447ab96f3ba";
const REELDEMO_BRAND = {
  bg: "#0B0D10",
  accent: "#FF6A1A",
  signal: "#7C8F43",
};
const PALETTE_PREVIEW_LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const DEFAULT_HEADING_FONT = "Space Grotesk";
const DEFAULT_BODY_FONT = "Inter";
const PALETTE_CARD_WIDTH = 320;
const PALETTE_CARD_HEIGHT = 200;
const MAX_PALETTE_OPTIONS = 3;

import {
  AUTO_PICK_ALLOWED_WHEN,
  AUTO_PICK_DEFAULT_POLICY,
  USER_SELECTION_JSON_META,
} from "./user-pick-policy.js";

const PALETTE_USER_SELECTION_WARNING = [
  "**Default — wait for user:** Present options and ask before calling `select_palette`.",
  AUTO_PICK_DEFAULT_POLICY,
  `**Exception:** If the user prompt explicitly delegates the choice (${AUTO_PICK_ALLOWED_WHEN}), call \`select_palette\` with \`userDelegatedPick: true\` (same turn is OK).`,
].join(" ");

const LOGO_USER_SELECTION_WARNING = [
  "**Default — wait for user:** Present numbered logos and ask before calling `select_logo`.",
  AUTO_PICK_DEFAULT_POLICY,
  `**Exception:** If the user prompt explicitly delegates the choice (${AUTO_PICK_ALLOWED_WHEN}), call \`select_logo\` with \`userDelegatedPick: true\` (same turn is OK).`,
].join(" ");

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}

function sanitizeHex(hex: string | undefined, fallback: string): string {
  if (!hex?.trim()) return fallback;
  const safe = hex.trim().replace(/[<>"']/g, "");
  return /^#[0-9a-fA-F]{3,8}$/.test(safe) ? safe : fallback;
}

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.5872 * g + 0.114 * b;
}

function colorDistance(hex1: string, hex2: string): number {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    if (h.length < 6) return [0, 0, 0];
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

function tokensFromOption(option: PaletteOptionRow): {
  bg: string;
  bgMuted: string;
  text: string;
  accent: string;
} {
  const dark = option.previewTokens?.dark;
  if (dark) {
    return {
      bg: sanitizeHex(dark.bg, "#0B0D10"),
      bgMuted: sanitizeHex(dark.bgMuted, "#1A1D24"),
      text: sanitizeHex(dark.text, "#E8EAED"),
      accent: sanitizeHex(dark.accent, "#FF6A1A"),
    };
  }
  const sw = option.swatches?.dark ?? option.swatches?.light ?? [];
  return {
    bg: sanitizeHex(sw[0], "#0B0D10"),
    bgMuted: sanitizeHex(sw[3] ?? sw[0], "#1A1D24"),
    text: sanitizeHex(sw[2], "#E8EAED"),
    accent: sanitizeHex(sw[1], "#FF6A1A"),
  };
}

export function pickPaletteOptionsForDisplay<T extends PaletteOptionRow>(
  options: T[],
  max = MAX_PALETTE_OPTIONS
): T[] {
  if (options.length <= max) return options;
  return [...options]
    .sort((a, b) => {
      const lumA = hexLuminance(tokensFromOption(a).bg);
      const lumB = hexLuminance(tokensFromOption(b).bg);
      return lumA - lumB;
    })
    .slice(0, max);
}

export function scoreReeldemoPaletteMatch(option: PaletteOptionRow): number {
  const tokens = tokensFromOption(option);
  return (
    colorDistance(tokens.bg, REELDEMO_BRAND.bg) +
    colorDistance(tokens.accent, REELDEMO_BRAND.accent) * 0.6 +
    colorDistance(tokens.bgMuted, REELDEMO_BRAND.signal) * 0.3
  );
}

export function isReeldemoPaletteContext(ctx: PresentContext): boolean {
  if (ctx.projectId === REELDEMO_PROJECT_ID) return true;
  return (ctx.repoHints ?? []).some((h) => h.includes("reeldemo"));
}

export function buildPalettePreviewCardSvg(args: {
  label: string;
  index: number;
  tokens: { bg: string; bgMuted: string; text: string; accent: string };
  headingFont: string;
  bodyFont: string;
  width?: number;
  height?: number;
}): string {
  const width = args.width ?? PALETTE_CARD_WIDTH;
  const height = args.height ?? PALETTE_CARD_HEIGHT;
  const { bg, bgMuted, text, accent } = args.tokens;
  const headingFont = escapeXml(args.headingFont);
  const bodyFont = escapeXml(args.bodyFont);
  const label = escapeXml(args.label.slice(0, 40));
  const swatchW = 68;
  const swatchH = 28;
  const swatches = [
    { color: bg, name: "bg" },
    { color: bgMuted, name: "surface" },
    { color: text, name: "text" },
    { color: accent, name: "accent" },
  ]
    .map(
      (s, i) =>
        `<rect x="${12 + i * (swatchW + 6)}" y="12" width="${swatchW}" height="${swatchH}" rx="4" fill="${s.color}"/>
  <text x="${12 + i * (swatchW + 6) + swatchW / 2}" y="${12 + swatchH + 10}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="8" fill="${text}" opacity="0.7">${s.name}</text>`
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="8" fill="${bg}"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="7" fill="none" stroke="${bgMuted}" stroke-width="1"/>
  ${swatches}
  <text x="16" y="78" font-family="${headingFont},system-ui,sans-serif" font-size="18" font-weight="600" fill="${accent}">Palette ${args.index}</text>
  <text x="16" y="96" font-family="${bodyFont},system-ui,sans-serif" font-size="10" fill="${text}" opacity="0.85">${label}</text>
  <text x="16" y="124" font-family="${bodyFont},system-ui,sans-serif" font-size="11" fill="${text}" opacity="0.9">${PALETTE_PREVIEW_LOREM}</text>
  <text x="16" y="178" font-family="Inter,system-ui,sans-serif" font-size="9" fill="${text}" opacity="0.55">${headingFont} / ${bodyFont}</text>
</svg>`;
}

function normalizeBase(url: string): string {
  return url.replace(/\/$/, "");
}

/** Bind-all / non-browser hosts must never appear in chat preview links. */
function isNonBrowserHost(hostname: string): boolean {
  return (
    hostname === "0.0.0.0" ||
    hostname === "::" ||
    hostname === "[::]"
  );
}

function isBrowserReachableOrigin(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  try {
    return !isNonBrowserHost(new URL(url.trim()).hostname);
  } catch {
    return false;
  }
}

/**
 * Prefer API-provided picker URL when it is browser-reachable; otherwise rebuild
 * from the session public base (staging k8s often mints http://0.0.0.0:3000/…).
 */
function resolvePickerUrl(
  fromApi: string | null | undefined,
  rebuilt: string
): string {
  const api = fromApi?.trim();
  if (api && isBrowserReachableOrigin(api)) return api;
  return rebuilt;
}

/**
 * Rewrite absolute URLs whose host is bind-all onto the session public base,
 * preserving path + query.
 */
export function rewritePreviewUrlOntoPublicBase(
  url: string,
  publicBaseUrl: string
): string {
  if (!url?.trim() || !isBrowserReachableOrigin(publicBaseUrl)) return url;
  try {
    const parsed = new URL(url);
    if (!isNonBrowserHost(parsed.hostname)) return url;
    const base = new URL(normalizeBase(publicBaseUrl));
    return `${base.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

const PLAN_MODE_PREVIEW_NOTE = [
  "**Cursor Plan mode:** inline previews often do not render — open the browser picker link below.",
  "**Agent mode:** PNG preview cards should appear below each option when supported.",
].join(" ");

function logoPickerUrl(
  base: string,
  projectId: string,
  previewToken?: string | null,
  candidateId?: string
) {
  const origin = normalizeBase(base);
  const params = new URLSearchParams({ project: projectId, cursor: "1" });
  const token = previewToken?.trim();
  if (token) params.set("t", token);
  if (candidateId) params.set("candidate", candidateId);
  return `${origin}/mcp/preview/logo-picker?${params.toString()}`;
}

function studioLogoUrl(
  base: string,
  projectId: string,
  previewToken?: string | null,
  candidateId?: string
) {
  return logoPickerUrl(base, projectId, previewToken, candidateId);
}

function palettePickerUrl(
  base: string,
  projectId: string,
  previewToken?: string | null,
  optionId?: string
) {
  const origin = normalizeBase(base);
  const params = new URLSearchParams({ project: projectId, cursor: "1" });
  const token = previewToken?.trim();
  if (token) params.set("t", token);
  if (optionId) {
    params.set("option", optionId);
    return `${origin}/mcp/preview/palette?${params.toString()}`;
  }
  return `${origin}/mcp/preview/palette-picker?${params.toString()}`;
}

function previewUrl(
  base: string,
  projectId: string,
  candidateId: string
): string {
  return `${normalizeBase(base)}/api/mcp/projects/${encodeURIComponent(projectId)}/logos/${encodeURIComponent(candidateId)}/preview`;
}

function swatchRowSvg(
  colors: string[],
  label: string,
  width = 200,
  height = 56
): string {
  const cellW = Math.floor((width - 8) / Math.max(colors.length, 1));
  const rects = colors
    .map((hex, i) => {
      const safe = String(hex).replace(/[<>"']/g, "");
      return `<rect x="${4 + i * cellW}" y="20" width="${cellW - 2}" height="32" rx="4" fill="${safe}"/>`;
    })
    .join("");
  const safeLabel = label.replace(/[<>&]/g, "").slice(0, 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="4" y="14" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#475569">${safeLabel}</text>
  ${rects}
</svg>`;
}

function lockedPaletteSvg(
  tokens: { light?: Record<string, string>; dark?: Record<string, string> },
  mode: "light" | "dark"
): string | null {
  const t = tokens[mode];
  if (!t) return null;
  const colors = [t.bg, t.accent, t.text, t.bgMuted].filter(
    Boolean
  ) as string[];
  if (colors.length === 0) return null;
  return swatchRowSvg(colors, `${mode} theme`);
}

export async function presentLogoCandidates(
  data: LogoCandidatesPayload,
  ctx: PresentContext
): Promise<McpContentBlock[]> {
  const previewToken = data.previewToken ?? null;
  const projectId = data.projectId?.trim() || ctx.projectId;
  const previewPickerUrl = resolvePickerUrl(
    data.previewPickerUrl,
    logoPickerUrl(ctx.publicBaseUrl, projectId, previewToken)
  );
  const browserLogoUrl = previewPickerUrl;
  const candidates = (data.candidates ?? []).map((c, i) => ({
    index: i + 1,
    id: c.id,
    kind: c.kind,
    templateId: c.templateId ?? null,
    userRating: c.userRating ?? null,
    previewUrl: rewritePreviewUrlOntoPublicBase(
      previewUrl(ctx.publicBaseUrl, projectId, c.id),
      ctx.publicBaseUrl
    ),
    browserPickUrl: rewritePreviewUrlOntoPublicBase(
      studioLogoUrl(ctx.publicBaseUrl, projectId, previewToken, c.id),
      ctx.publicBaseUrl
    ),
    selectHint: `After user confirms or delegates: reply ${i + 1} with userConfirmed: true, or call select_logo with candidateId "${c.id}" and userConfirmed/userDelegatedPick: true`,
  }));

  const summary = {
    ...USER_SELECTION_JSON_META,
    selectedLogoTemplateId: data.selectedLogoTemplateId,
    logoSvg: data.logoSvg,
    logoFavorites: data.logoFavorites,
    shortlistCount: data.shortlistCount,
    emptyReason: data.emptyReason ?? null,
    guidance: data.guidance ?? null,
    browserLogoUrl,
    previewPickerUrl,
    previewToken,
    agentInstructions:
      candidates.length === 0
        ? "No distinct generated logo candidates. Do not invent generic marks — run logo generation, then list_logo_candidates again."
        : "Show each numbered logo image below. Default: wait for user pick (1-N). If user prompt explicitly asks you to choose, select_logo with userDelegatedPick: true.",
    userSelectionWarning: LOGO_USER_SELECTION_WARNING,
    candidates,
  };

  if (candidates.length === 0) {
    return [
      {
        type: "text",
        text: [
          `# Logo candidates (0)`,
          "",
          data.guidance ??
            "No generated logo candidates yet. Run logo generation, then call list_logo_candidates again.",
          "",
          PLAN_MODE_PREVIEW_NOTE,
          "",
          `[Open logo picker](${previewPickerUrl})`,
          "",
          JSON.stringify(summary, null, 2),
        ].join("\n"),
      },
    ];
  }

  const content: McpContentBlock[] = [
    {
      type: "text",
      text: [
        `# Logo candidates (${candidates.length})`,
        "",
        LOGO_USER_SELECTION_WARNING,
        "",
        PLAN_MODE_PREVIEW_NOTE,
        "",
        `[Open logo picker](${previewPickerUrl})`,
        "",
        `Studio (full canvas): ${normalizeBase(ctx.publicBaseUrl)}/canvas?project=${encodeURIComponent(projectId)}`,
        "",
        JSON.stringify(summary, null, 2),
      ].join("\n"),
    },
  ];

  for (const c of candidates) {
    const raw = data.candidates[c.index - 1]?.previewSvg;
    content.push({
      type: "text",
      text: [
        `## Option ${c.index} — \`${c.id.slice(0, 8)}…\``,
        `Preview: ${c.previewUrl}`,
        `Browser: ${c.browserPickUrl}`,
        c.selectHint,
      ].join("\n"),
    });
    if (raw?.trim()) content.push(await svgPreviewBlock(raw));
  }

  return content;
}

export async function presentPaletteOptions(
  data: PaletteCandidatesPayload,
  ctx: PresentContext
): Promise<McpContentBlock[]> {
  const previewToken = data.previewToken ?? null;
  const projectId = data.projectId?.trim() || ctx.projectId;
  const projectName = data.projectName?.trim() || null;
  const previewPickerUrl = resolvePickerUrl(
    data.previewPickerUrl,
    palettePickerUrl(ctx.publicBaseUrl, projectId, previewToken)
  );
  const headingFont = data.headingFont?.trim() || DEFAULT_HEADING_FONT;
  const bodyFont = data.bodyFont?.trim() || DEFAULT_BODY_FONT;
  const allOptions = data.options ?? [];
  const displayed = pickPaletteOptionsForDisplay(allOptions);
  const reeldemoCtx = isReeldemoPaletteContext(ctx);
  const reeldemoBest =
    reeldemoCtx && displayed.length > 0
      ? displayed.reduce(
          (best, o, i) => {
            const score = scoreReeldemoPaletteMatch(o);
            return score < best.score
              ? { index: i + 1, optionId: o.optionId, score }
              : best;
          },
          { index: 1, optionId: displayed[0]!.optionId, score: Infinity }
        )
      : null;

  const options = displayed.map((o, i) => ({
    index: i + 1,
    optionId: o.optionId,
    label: o.label,
    isSelected: o.isSelected,
    swatches: o.swatches,
    previewTokens: o.previewTokens,
    browserPickUrl: rewritePreviewUrlOntoPublicBase(
      palettePickerUrl(
        ctx.publicBaseUrl,
        projectId,
        previewToken,
        o.optionId
      ),
      ctx.publicBaseUrl
    ),
    selectHint: `After user confirms or delegates: reply **${i + 1}** with userConfirmed: true, or call \`select_palette\` with optionId \`${o.optionId}\` and userConfirmed/userDelegatedPick: true`,
    reeldemoFitAdvisory:
      reeldemoBest?.optionId === o.optionId && reeldemoCtx ? true : undefined,
  }));

  const reeldemoHint =
    reeldemoBest && reeldemoCtx
      ? `**Reeldemo fit (advisory only):** Option **${reeldemoBest.index}** is closest to dark studio (Pitch Black \`${REELDEMO_BRAND.bg}\`, Ember Orange \`${REELDEMO_BRAND.accent}\`, Acid Moss \`${REELDEMO_BRAND.signal}\`). Mention to the user — only call \`select_palette\` after they pick or explicitly delegate (e.g. "auto-select the Reeldemo match").`
      : null;

  const content: McpContentBlock[] = [
    {
      type: "text",
      text: [
        `# Palette options (${options.length} of ${allOptions.length} shown)`,
        "",
        PALETTE_USER_SELECTION_WARNING,
        "",
        PLAN_MODE_PREVIEW_NOTE,
        "",
        data.agentInstructions ??
          "Present the browser palette picker link first. Default: wait for user pick 1–3. If user prompt explicitly asks you to choose, select_palette with userDelegatedPick: true.",
        "",
        reeldemoHint,
        "",
        `[Open palette picker](${previewPickerUrl})`,
        "",
        JSON.stringify(
          {
            ...USER_SELECTION_JSON_META,
            userSelectionWarning: PALETTE_USER_SELECTION_WARNING,
            previewPickerUrl,
            projectId,
            ...(projectName ? { projectName } : {}),
            previewToken,
            selectedOptionId: data.selectedOptionId,
            paletteTokens: data.paletteTokens,
            headingFont,
            bodyFont,
            options,
            totalOptions: allOptions.length,
            displayedCount: options.length,
          },
          null,
          2
        ),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  if (options.length > 0) {
    for (const o of options) {
      const source = displayed[o.index - 1]!;
      const tokens = tokensFromOption(source);
      const cardSvg = buildPalettePreviewCardSvg({
        label: o.label,
        index: o.index,
        tokens,
        headingFont,
        bodyFont,
      });
      const reeldemoTag = o.reeldemoFitAdvisory
        ? " _(advisory Reeldemo fit — pick only after user confirms or delegates)_"
        : "";
      content.push({
        type: "text",
        text: [
          `## Option ${o.index} — \`${o.optionId}\`${reeldemoTag}`,
          o.label,
          "",
          `[Pick option ${o.index} in browser](${o.browserPickUrl})`,
          o.selectHint,
        ].join("\n"),
      });
      content.push(await svgPreviewBlock(cardSvg));
    }
  } else if (data.paletteTokens) {
    content.push({
      type: "text",
      text: "## Current palette (locked — no alternates in snapshot)",
    });
    const light = lockedPaletteSvg(data.paletteTokens, "light");
    const dark = lockedPaletteSvg(data.paletteTokens, "dark");
    if (light) content.push(await svgPreviewBlock(light));
    if (dark) content.push(await svgPreviewBlock(dark));
  }

  return content;
}

export function presentTweetDrafts(
  data: TweetDraftsPayload
): McpContentBlock[] {
  const drafts = data.drafts ?? [];
  const content: McpContentBlock[] = [
    {
      type: "text",
      text: [
        "# Tweet drafts",
        "",
        data.agentInstructions ??
          "Present drafts numbered. Wait for the user before select_tweet_draft.",
        "",
        JSON.stringify(data, null, 2),
      ].join("\n"),
    },
  ];

  drafts.forEach((d, i) => {
    content.push({
      type: "text",
      text: `## Draft ${i + 1} — \`${d.draftId}\`\n\n${d.text}\n\nReply ${i + 1} or select_tweet_draft with draftId "${d.draftId}"`,
    });
  });

  return content;
}

export function presentCursorHandoff(
  data: CursorHandoffPayloadResponse
): McpContentBlock[] {
  const h = data.handoff;
  return [
    {
      type: "text",
      text: [
        "# Cursor handoff",
        h ? `**Event:** ${h.event}` : "",
        `**Pending:** ${data.pending}`,
        h?.browserUrl ? `**Browser:** ${h.browserUrl}` : "",
        h?.chatPrompt ? `\n${h.chatPrompt}` : "",
        "",
        JSON.stringify(data, null, 2),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}
