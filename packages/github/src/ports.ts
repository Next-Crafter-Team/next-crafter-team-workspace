import type { GithubInstallation, GithubRepositoryRecord } from "./types.ts";

export interface InstallationStore {
  getByUserId(userId: string): Promise<GithubInstallation | null>;
  getByInstallationId(installationId: string): Promise<GithubInstallation | null>;
  upsert(installation: GithubInstallation): Promise<void>;
  markRevoked(installationId: string): Promise<void>;
  replaceRepositories(
    installationId: string,
    repos: GithubRepositoryRecord[],
  ): Promise<void>;
}

export type CachedInstallationToken = {
  token: string;
  expiresAt: number;
};

export interface InstallationTokenCache {
  get(installationId: string): Promise<CachedInstallationToken | null>;
  set(installationId: string, value: CachedInstallationToken): Promise<void>;
  clear(installationId: string): Promise<void>;
}

export class MemoryTokenCache implements InstallationTokenCache {
  private readonly values = new Map<string, CachedInstallationToken>();

  async get(installationId: string): Promise<CachedInstallationToken | null> {
    const cached = this.values.get(installationId);
    if (!cached) return null;
    if (cached.expiresAt <= Date.now()) {
      this.values.delete(installationId);
      return null;
    }
    return cached;
  }

  async set(installationId: string, value: CachedInstallationToken): Promise<void> {
    this.values.set(installationId, value);
  }

  async clear(installationId: string): Promise<void> {
    this.values.delete(installationId);
  }
}
