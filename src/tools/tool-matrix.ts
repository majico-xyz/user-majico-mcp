/**
 * Classifies MCP tools for the quick (mock) vs Ollama integration matrices.
 * Keep in sync with tool definitions — every listMcpTools() name must appear here.
 */
export type McpToolKind = "non_llm" | "llm";

/** Tools that call the LLM router / Ollama / generative model paths. */
export const MCP_LLM_TOOL_NAMES = new Set<string>([
  "generate_creative",
  "refine_creative",
  "generate_tweet_drafts",
  "generate_post_variants",
  "get_performance_insights",
  "run_niche_research",
  "run_market_scan",
  "web_search",
  "run_asset_research",
  "generate_asset",
  "quiver_generate_svg",
  "quiver_vectorize_svg",
  "generate_brand_md",
  "suggest_blog_opportunities",
  "run_blog_research",
  "generate_blog_outline",
  "generate_blog_section",
  "assemble_blog_post",
  "submit_brief",
]);

export function classifyMcpTool(name: string): McpToolKind {
  return MCP_LLM_TOOL_NAMES.has(name) ? "llm" : "non_llm";
}

export function partitionMcpToolNames(names: string[]): {
  llm: string[];
  nonLlm: string[];
} {
  const llm: string[] = [];
  const nonLlm: string[] = [];
  for (const name of names) {
    if (classifyMcpTool(name) === "llm") llm.push(name);
    else nonLlm.push(name);
  }
  return { llm, nonLlm };
}
