export { MCP_SERVER_VERSION } from "./tools/constants.js";
export {
  MAJICO_USER_TOOLS,
  MAJICO_ADMIN_BOOTSTRAP_TOOLS,
  MAJICO_TOOLS,
  listMcpTools,
  classifyMcpTool,
  MCP_LLM_TOOL_NAMES,
  partitionMcpToolNames,
} from "./tools/tool-catalog.js";
export type { McpToolKind } from "./tools/tool-catalog.js";
export { type ToolCallResult } from "./tools/tool-call-helpers.js";
export { handleMajicoToolCall } from "./tools/handle-tool-call.js";
