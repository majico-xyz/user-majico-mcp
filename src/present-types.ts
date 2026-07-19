export type McpAnnotations = {
  audience?: Array<"user" | "assistant">;
  priority?: number;
};

export type McpContentBlock =
  | { type: "text"; text: string; annotations?: McpAnnotations }
  | {
      type: "image";
      data: string;
      mimeType: string;
      annotations?: McpAnnotations;
    };

export type PresentContext = {
  projectId: string;
  publicBaseUrl: string;
  repoHints?: string[];
};
