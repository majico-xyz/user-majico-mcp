/** Shared palette/logo pick policy for MCP tools and presentation metadata. */

export const AUTO_PICK_ALLOWED_WHEN =
  'User prompt explicitly asks the agent to choose (e.g. "pick option 2 for me", "choose the best dark scheme", "auto-select the Reeldemo match").';

export const AUTO_PICK_DEFAULT_POLICY =
  "Default: present numbered options and wait for user choice. Do not auto-pick from heuristics, fit hints, or agent judgment.";

export const USER_SELECTION_JSON_META = {
  requiresUserSelection: true,
  autoPickForbidden: true,
  autoPickAllowedWhen: AUTO_PICK_ALLOWED_WHEN,
} as const;

export type UserPickGateArgs = {
  userConfirmed?: boolean;
  userDelegatedPick?: boolean;
};

/**
 * Validates select_palette / select_logo confirmation gates.
 * - userConfirmed: user replied 1/2/3, confirmed in chat, or saved via browser picker
 * - userDelegatedPick: user prompt explicitly delegated the choice to the agent
 */
export function validateUserPickGate(
  args: UserPickGateArgs | undefined,
  toolName: "select_palette" | "select_logo"
): string | null {
  if (args?.userConfirmed === true || args?.userDelegatedPick === true) {
    return null;
  }
  return (
    `${toolName} requires userConfirmed: true (user replied 1/2/3, browser pick, or confirmed in chat) ` +
    `or userDelegatedPick: true (user prompt explicitly asked you to choose, e.g. "pick option 2 for me"). ` +
    `Do not pick based on heuristics or advisory hints without explicit user delegation.`
  );
}
