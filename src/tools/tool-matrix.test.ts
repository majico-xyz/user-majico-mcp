import { describe, expect, it } from "vitest";
import { listMcpTools } from "./tool-catalog.js";
import {
  classifyMcpTool,
  MCP_LLM_TOOL_NAMES,
  partitionMcpToolNames,
} from "./tool-matrix.js";

describe("MCP tool matrix classification", () => {
  it("classifies every listed user tool as llm or non_llm", () => {
    const names = listMcpTools().map((t) => t.name);
    expect(names.length).toBeGreaterThan(10);
    for (const name of names) {
      expect(["llm", "non_llm"]).toContain(classifyMcpTool(name));
    }
  });

  it("partitions without dropping tools", () => {
    const names = listMcpTools().map((t) => t.name);
    const { llm, nonLlm } = partitionMcpToolNames(names);
    expect(new Set([...llm, ...nonLlm])).toEqual(new Set(names));
    expect(llm.every((n) => MCP_LLM_TOOL_NAMES.has(n))).toBe(true);
    expect(nonLlm.every((n) => !MCP_LLM_TOOL_NAMES.has(n))).toBe(true);
  });

  it("keeps ping/health/get_design_md as non_llm", () => {
    expect(classifyMcpTool("ping")).toBe("non_llm");
    expect(classifyMcpTool("health")).toBe("non_llm");
    expect(classifyMcpTool("get_design_md")).toBe("non_llm");
    expect(classifyMcpTool("run_niche_research")).toBe("llm");
  });
});
