/**
 * Returns true when the client closed the MCP HTTP connection mid-request.
 */
export function isMcpClientDisconnectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as NodeJS.ErrnoException;
  if (err.name === "AbortError") return true;
  if (
    err.code === "ECONNRESET" ||
    err.code === "EPIPE" ||
    err.code === "ERR_STREAM_PREMATURE_CLOSE"
  ) {
    return true;
  }
  const message = typeof err.message === "string" ? err.message : "";
  return message === "aborted" || message === "The operation was aborted";
}
