import type { CredentialSource } from "../credentials.js";
import { buildMcpAuthRequiredPayload } from "../auth-prompt.js";
import {
  type ToolCallResult,
  toolError,
  toolAuthRequired,
  clientFromArgs,
  presentContext,
} from "./tool-call-helpers.js";
import { handlePreClientToolCall } from "./handle-tool-call-pre.js";
import { dispatchBrandingStudioTool } from "./dispatch-branding-studio.js";
import { dispatchPulseBlogTool } from "./dispatch-pulse-blog.js";
import { dispatchResearchAssetsTool } from "./dispatch-research-assets.js";

type MajicoErrorLike = {
  code?: string;
  status?: number;
  body?: { code?: string } | null;
};

function isMajicoErrorLike(err: unknown): err is MajicoErrorLike {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  return (
    e.name === "MajicoError" &&
    (typeof e.status === "number" || typeof e.code === "string")
  );
}

export async function handleMajicoToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
  defaultCredentials?: CredentialSource
): Promise<ToolCallResult> {
  try {
    const pre = await handlePreClientToolCall(name, args, defaultCredentials);
    if (pre) return pre;

    const clientOrError = await clientFromArgs(args, defaultCredentials);
    if ("content" in clientOrError) return clientOrError;
    const { client, creds } = clientOrError;
    const ctx = presentContext(creds, defaultCredentials);

    const branding = await dispatchBrandingStudioTool(
      name,
      args,
      client,
      creds,
      ctx,
      defaultCredentials
    );
    if (branding) return branding;

    const pulseBlog = await dispatchPulseBlogTool(name, args, client);
    if (pulseBlog) return pulseBlog;

    const research = await dispatchResearchAssetsTool(name, args, client);
    if (research) return research;

    return toolError(`Unknown tool: ${name}`);
  } catch (err) {
    if (isMajicoErrorLike(err)) {
      if (err.code === "plan_required" || err.code === "INSUFFICIENT_TOKENS") {
        return toolAuthRequired(buildMcpAuthRequiredPayload("upgrade_plan"));
      }
      if (err.body?.code === "INSUFFICIENT_TOKENS") {
        return toolAuthRequired(buildMcpAuthRequiredPayload("upgrade_plan"));
      }
      if (
        err.code === "auth_invalid_key" ||
        err.code === "auth_missing" ||
        err.status === 401
      ) {
        return toolAuthRequired(buildMcpAuthRequiredPayload("connect_oauth"));
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    return toolError(message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]"));
  }
}
