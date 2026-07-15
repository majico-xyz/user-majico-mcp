import { MajicoAgentClient } from "@majico/sdk";

export function readAgentEnv(): {
  baseUrl: string;
  agentSecret: string;
} | null {
  const agentSecret = process.env.MAJICO_AGENT_API_SECRET?.trim();
  const baseUrl =
    process.env.MAJICO_API_URL?.trim() ||
    process.env.MAJICO_AGENT_API_URL?.trim() ||
    "https://majico.d3bu7.com";
  if (!agentSecret) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), agentSecret };
}

export async function bootstrapProjectViaAgent(name: string) {
  const env = readAgentEnv();
  if (!env) {
    throw new Error(
      "MAJICO_AGENT_API_SECRET is required for bootstrap_project (set in MCP env)."
    );
  }
  const agent = new MajicoAgentClient({
    baseUrl: env.baseUrl,
    agentSecret: env.agentSecret,
  });
  return agent.bootstrapProject(name);
}
