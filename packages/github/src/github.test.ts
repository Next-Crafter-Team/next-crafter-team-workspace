import assert from "node:assert/strict";
import { test } from "node:test";
import { createGithubConnector } from "./github.ts";
import { GithubError } from "./errors.ts";
import { toUnpublishedDraftCandidate } from "./mapper.ts";
import { MemoryTokenCache } from "./ports.ts";
import type { InstallationStore } from "./ports.ts";
import type { GithubInstallation, GithubRepositoryRecord } from "./types.ts";

function fakeStore(seed?: GithubInstallation): InstallationStore {
  const byUser = new Map<string, GithubInstallation>();
  const byInstall = new Map<string, GithubInstallation>();
  if (seed) {
    byUser.set(seed.userId, seed);
    byInstall.set(seed.installationId, seed);
  }
  return {
    async getByUserId(userId) {
      return byUser.get(userId) ?? null;
    },
    async getByInstallationId(installationId) {
      return byInstall.get(installationId) ?? null;
    },
    async upsert(installation) {
      byUser.set(installation.userId, installation);
      byInstall.set(installation.installationId, installation);
    },
    async markRevoked(installationId) {
      const row = byInstall.get(installationId);
      if (!row) return;
      const revoked = { ...row, status: "revoked" as const };
      byInstall.set(installationId, revoked);
      byUser.set(row.userId, revoked);
    },
    async replaceRepositories(_installationId: string, _repos: GithubRepositoryRecord[]) {},
  };
}

const config = {
  appId: "1",
  appSlug: "cementerio-ideas",
  privateKey: "test-key",
  webhookSecret: "secret",
};

test("startConnection puts state on the GitHub App install URL", () => {
  const github = createGithubConnector({
    config,
    store: fakeStore(),
    tokenCache: new MemoryTokenCache(),
  });
  const { installUrl } = github.startConnection({ userId: "user_1", state: "nonce-abc" });
  const url = new URL(installUrl);
  assert.equal(url.hostname, "github.com");
  assert.equal(url.pathname, "/apps/cementerio-ideas/installations/new");
  assert.equal(url.searchParams.get("state"), "nonce-abc");
});

test("getConnectionStatus is false without an active installation", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore(),
    tokenCache: new MemoryTokenCache(),
  });
  const status = await github.getConnectionStatus({ userId: "user_1" });
  assert.equal(status.connected, false);
});

test("getConnectionStatus reports selected scope for an active installation", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore({
      userId: "user_1",
      installationId: "42",
      accountLogin: "rodowen",
      repositorySelection: "selected",
      status: "active",
    }),
    tokenCache: new MemoryTokenCache(),
  });
  const status = await github.getConnectionStatus({ userId: "user_1" });
  assert.deepEqual(status, {
    connected: true,
    installationId: "42",
    accountLogin: "rodowen",
    scopeType: "selected",
  });
});

test("listRepositories throws not_connected when there is no install", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore(),
    tokenCache: new MemoryTokenCache(),
  });
  await assert.rejects(
    () => github.listRepositories({ userId: "user_1" }),
    (error: unknown) => error instanceof GithubError && error.code === "not_connected",
  );
});

test("verifyAndLinkInstallation rejects an install owned by another user", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore({
      userId: "user_a",
      installationId: "99",
      accountLogin: "other",
      repositorySelection: "all",
      status: "active",
    }),
    tokenCache: new MemoryTokenCache(),
  });
  await assert.rejects(
    () => github.verifyAndLinkInstallation({ userId: "user_b", installationId: "99" }),
    (error: unknown) => error instanceof GithubError && error.code === "verification_failed",
  );
});

test("disconnect is ok when nothing is connected", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore(),
    tokenCache: new MemoryTokenCache(),
  });
  assert.deepEqual(await github.disconnect({ userId: "user_1" }), { ok: true });
});

test("handleWebhook rejects a missing signature", async () => {
  const github = createGithubConnector({
    config,
    store: fakeStore(),
    tokenCache: new MemoryTokenCache(),
  });
  await assert.rejects(
    () => github.handleWebhook("{}", { event: "installation" }),
    (error: unknown) => error instanceof GithubError && error.code === "webhook_invalid",
  );
});

test("toUnpublishedDraftCandidate maps a repo without autopsy fields", () => {
  const candidate = toUnpublishedDraftCandidate({
    id: "1",
    fullName: "rodowen/old-side-project",
    private: true,
    defaultBranch: "main",
    lastPushAt: 1,
    isFork: false,
    isArchived: true,
  });
  assert.deepEqual(candidate, {
    origin: "github",
    bucket: "unpublished_draft",
    contentType: "repo",
    githubFullName: "rodowen/old-side-project",
    title: "old-side-project",
    defaultBranch: "main",
  });
  assert.equal("whyItDied" in candidate, false);
});
