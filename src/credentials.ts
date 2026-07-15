import { MajicoClient, type MajicoClientConfig } from "@majico/sdk";
import {
  buildMcpAuthRequiredPayload,
  MAJICO_MCP_CONNECT_PROMPT,
  MAJICO_MCP_PLAN_REQUIRED_PROMPT,
  type McpAuthRequiredPayload,
} from "./auth-prompt.js";

export type ResolvedCredentials = {
  projectId: string;
  apiKey: string;
  baseUrl?: string;
};

export type CredentialSource = {
  projectId?: string;
  apiKey?: string;
  /** Internal API base (e.g. http://127.0.0.1:3000) for server-side SDK calls */
  baseUrl?: string;
  /** Public origin for browser + preview links in interactive MCP results */
  publicBaseUrl?: string;
  /** Origin for MCP serverInfo icon URLs (defaults to publicBaseUrl; prod uses app host). */
  iconBaseUrl?: string;
  /** How the MCP session authenticated (set by HTTP transport). */
  auth?: "oauth" | "api_key";
  /** Authenticated Supabase user id when available (OAuth or derived from API key). */
  userId?: string;
  /** Include admin-only bootstrap tools in tools/list (requires agent secret). */
  includeAdminTools?: boolean;
  /** OAuth-only: resolve delegated project scope server-side without exposing API keys. */
  resolveOAuthProject?: (
    projectId: string
  ) => Promise<{ projectId: string; apiKey: string } | { error: string }>;
  /** OAuth session is valid but the bound project lacks Pro/Creator MCP access. */
  planRequired?: boolean;
};

const ENV_PROJECT_ID = "MAJICO_PROJECT_ID";
const ENV_API_KEY = "MAJICO_API_KEY";
const ENV_API_URL = "MAJICO_API_URL";

export function readEnvCredentials(): CredentialSource {
  return {
    projectId: process.env[ENV_PROJECT_ID]?.trim() || undefined,
    apiKey: process.env[ENV_API_KEY]?.trim() || undefined,
    baseUrl: process.env[ENV_API_URL]?.trim() || undefined,
  };
}

export type CredentialResolutionError =
  | (McpAuthRequiredPayload & { error: string })
  | { error: string };

export async function resolveCredentials(
  args?: CredentialSource,
  env: CredentialSource = readEnvCredentials()
): Promise<ResolvedCredentials | CredentialResolutionError> {
  const requestedProjectId = args?.projectId?.trim() || env.projectId;
  const apiKey = args?.apiKey?.trim() || env.apiKey;
  const baseUrl = args?.baseUrl?.trim() || env.baseUrl;

  if (env.planRequired) {
    return {
      ...buildMcpAuthRequiredPayload("upgrade_plan"),
      error: MAJICO_MCP_PLAN_REQUIRED_PROMPT,
    };
  }

  if (
    env.resolveOAuthProject &&
    requestedProjectId &&
    env.projectId &&
    requestedProjectId !== env.projectId &&
    !args?.apiKey
  ) {
    const delegated = await env.resolveOAuthProject(requestedProjectId);
    if ("error" in delegated) return delegated;
    return {
      projectId: delegated.projectId,
      apiKey: delegated.apiKey,
      baseUrl,
    };
  }

  if (!requestedProjectId || !apiKey) {
    const oauthSession =
      env.auth === "oauth" || Boolean(env.resolveOAuthProject);
    if (oauthSession) {
      return {
        ...buildMcpAuthRequiredPayload("connect_oauth"),
        error: MAJICO_MCP_CONNECT_PROMPT,
      };
    }
    return {
      ...buildMcpAuthRequiredPayload("connect_oauth"),
      error: MAJICO_MCP_CONNECT_PROMPT,
    };
  }

  return { projectId: requestedProjectId, apiKey, baseUrl };
}

export function createClientFromCredentials(
  creds: ResolvedCredentials
): MajicoClient {
  const config: MajicoClientConfig = {
    apiKey: creds.apiKey,
    projectId: creds.projectId,
    baseUrl: creds.baseUrl,
    retry: { max: 2, retryOn: [429, 503] },
  };
  return new MajicoClient(config);
}
