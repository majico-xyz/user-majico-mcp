export type McpContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

export type PresentContext = {
  projectId: string;
  publicBaseUrl: string;
  repoHints?: string[];
};
