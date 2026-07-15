import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHandleRequest = vi.fn();
const mockTransportClose = vi.fn().mockResolvedValue(undefined);
const mockServerClose = vi.fn().mockResolvedValue(undefined);
const mockServerConnect = vi.fn().mockResolvedValue(undefined);

vi.mock(
  "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js",
  () => ({
    WebStandardStreamableHTTPServerTransport: vi
      .fn()
      .mockImplementation(function MockTransport(this: {
        handleRequest: typeof mockHandleRequest;
        close: typeof mockTransportClose;
      }) {
        this.handleRequest = mockHandleRequest;
        this.close = mockTransportClose;
      }),
  })
);

vi.mock("./server.js", () => ({
  createMajicoMcpServer: vi.fn(() => ({
    connect: (...args: unknown[]) => mockServerConnect(...args),
    close: (...args: unknown[]) => mockServerClose(...args),
  })),
}));

describe("handleMcpHttpRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleRequest.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );
  });

  it("returns 499 when the transport throws a client disconnect error", async () => {
    const { handleMcpHttpRequest } = await import("./http-handler.js");
    mockHandleRequest.mockRejectedValue(
      Object.assign(new Error("aborted"), { code: "ECONNRESET" })
    );

    const res = await handleMcpHttpRequest(
      new Request("http://localhost/mcp", { method: "POST" })
    );

    expect(res.status).toBe(499);
    expect(mockTransportClose).toHaveBeenCalled();
    expect(mockServerClose).toHaveBeenCalled();
  });

  it("rethrows non-disconnect transport errors", async () => {
    const { handleMcpHttpRequest } = await import("./http-handler.js");
    mockHandleRequest.mockRejectedValue(new Error("transport failed"));

    await expect(
      handleMcpHttpRequest(
        new Request("http://localhost/mcp", { method: "POST" })
      )
    ).rejects.toThrow("transport failed");
  });
});
