export type McpContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      data: string;
      mimeType: string;
      annotations?: {
        audience?: Array<"user" | "assistant">;
        priority?: number;
      };
    };

export type PresentContext = {
  projectId: string;
  publicBaseUrl: string;
  repoHints?: string[];
};
