import type { MajicoClient } from "@majico/sdk";
import {
  createClientFromCredentials,
  readEnvCredentials,
  resolveCredentials,
  type CredentialResolutionError,
  type CredentialSource,
  type ResolvedCredentials,
} from "../credentials.js";
import type { McpAuthRequiredPayload } from "../auth-prompt.js";
import { buildMcpAuthRequiredPayload } from "../auth-prompt.js";
import type {
  McpContentBlock,
  PresentContext,
} from "../present-interactive.js";

export type ToolCallResult = {
  content: McpContentBlock[];
  isError?: boolean;
};

export function toolJson(data: unknown): ToolCallResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function toolPresent(content: McpContentBlock[]): ToolCallResult {
  return { content };
}

export function requireStringArg(
  args: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = args?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Build stable markdown for local-contract brand scaffolding tests and handoff. */
export function buildStableBrandMarkdown(
  args: Record<string, unknown> | undefined
) {
  const productName = requireStringArg(args, "productName");
  const positioningConcept = requireStringArg(args, "positioningConcept");
  const audience = requireStringArg(args, "audience");
  const tone = requireStringArg(args, "tone");

  if (!productName || !positioningConcept || !audience || !tone) {
    return toolError(
      "productName, positioningConcept, audience, and tone are required."
    );
  }

  return toolJson({
    productName,
    sections: ["product_name", "positioning_concept", "audience", "tone"],
    markdown: [
      `# ${productName}`,
      "",
      "## Product Name",
      productName,
      "",
      "## Positioning / Concept",
      positioningConcept,
      "",
      "## Audience",
      audience,
      "",
      "## Tone",
      tone,
      "",
    ].join("\n"),
  });
}

export function presentContext(
  creds: ResolvedCredentials,
  defaults?: CredentialSource
): PresentContext {
  const publicBaseUrl =
    defaults?.publicBaseUrl?.trim() ||
    process.env.MAJICO_PUBLIC_BASE_URL?.trim() ||
    creds.baseUrl?.trim() ||
    "https://majico.xyz";
  return { projectId: creds.projectId, publicBaseUrl };
}

export function toolError(message: string): ToolCallResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export function toolAuthRequired(
  payload: McpAuthRequiredPayload
): ToolCallResult {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError: true,
  };
}

function credentialErrorResult(
  resolved: CredentialResolutionError
): ToolCallResult {
  if (
    "authRequired" in resolved &&
    resolved.authRequired &&
    resolved.action &&
    resolved.message
  ) {
    return toolAuthRequired({
      authRequired: true,
      action: resolved.action,
      message: resolved.message,
      agentInstructions: resolved.agentInstructions,
    });
  }
  return toolError(resolved.error);
}

type ClientContext =
  | ToolCallResult
  | { client: MajicoClient; creds: ResolvedCredentials };

export function clientFromArgs(
  args: Record<string, unknown> | undefined,
  defaultCredentials?: CredentialSource
): Promise<ClientContext> {
  const envDefaults: CredentialSource = {
    ...readEnvCredentials(),
    ...defaultCredentials,
  };
  return resolveCredentials(
    {
      projectId: args?.projectId as string | undefined,
      apiKey: args?.apiKey as string | undefined,
      baseUrl: defaultCredentials?.baseUrl,
    },
    envDefaults
  ).then((resolved) => {
    if ("error" in resolved) return credentialErrorResult(resolved);
    return { client: createClientFromCredentials(resolved), creds: resolved };
  });
}
