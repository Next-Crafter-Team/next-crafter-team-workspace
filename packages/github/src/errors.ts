export type GithubErrorCode =
  | "not_connected"
  | "verification_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "webhook_invalid"
  | "api_error";

export class GithubError extends Error {
  readonly code: GithubErrorCode;
  readonly status?: number;

  constructor(code: GithubErrorCode, message: string, status?: number) {
    super(message);
    this.name = "GithubError";
    this.code = code;
    this.status = status;
  }
}

export function githubErrorFromHttp(status: number, message: string): GithubError {
  if (status === 401) return new GithubError("unauthorized", message, status);
  if (status === 403) return new GithubError("forbidden", message, status);
  if (status === 404) return new GithubError("not_found", message, status);
  if (status === 429) return new GithubError("rate_limited", message, status);
  return new GithubError("api_error", message, status);
}
