import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { verify } from "@octokit/webhooks-methods";
import { GithubError, githubErrorFromHttp } from "./errors.ts";
import { toUnpublishedDraftCandidate } from "./mapper.ts";
import { MemoryTokenCache } from "./ports.ts";
import type { InstallationStore, InstallationTokenCache } from "./ports.ts";
import type {
  ConnectionStatus,
  GithubAppConfig,
  GithubInstallation,
  GithubRepositoryRecord,
  ListedRepository,
  ScopeType,
  UnpublishedDraftCandidate,
  WebhookHeaders,
} from "./types.ts";

const TOKEN_SAFETY_WINDOW_MS = 60_000;

export type GithubConnectorDeps = {
  config: GithubAppConfig;
  store: InstallationStore;
  tokenCache?: InstallationTokenCache;
};

export function createGithubConnector(deps: GithubConnectorDeps) {
  const tokenCache = deps.tokenCache ?? new MemoryTokenCache();
  const { config, store } = deps;

  function appOctokit(): Octokit {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: config.appId,
        privateKey: config.privateKey,
      },
    });
  }

  async function installationToken(installationId: string): Promise<string> {
    const cached = await tokenCache.get(installationId);
    if (cached && cached.expiresAt - TOKEN_SAFETY_WINDOW_MS > Date.now()) {
      return cached.token;
    }

    const auth = createAppAuth({
      appId: config.appId,
      privateKey: config.privateKey,
    });

    try {
      const result = await auth({
        type: "installation",
        installationId: Number(installationId),
      });
      await tokenCache.set(installationId, {
        token: result.token,
        expiresAt: new Date(result.expiresAt).getTime(),
      });
      return result.token;
    } catch (error) {
      throw wrapOctokitError(error);
    }
  }

  async function installationOctokit(installationId: string): Promise<Octokit> {
    const token = await installationToken(installationId);
    return new Octokit({ auth: token });
  }

  async function requireActiveInstallation(userId: string): Promise<GithubInstallation> {
    const installation = await store.getByUserId(userId);
    if (!installation || installation.status !== "active") {
      throw new GithubError("not_connected", "GitHub App is not connected for this user");
    }
    return installation;
  }

  async function getConnectionStatus(args: { userId: string }): Promise<ConnectionStatus> {
    const installation = await store.getByUserId(args.userId);
    if (!installation || installation.status !== "active") {
      return { connected: false, scopeType: "selected" };
    }
    return {
      connected: true,
      installationId: installation.installationId,
      accountLogin: installation.accountLogin,
      scopeType: installation.repositorySelection,
    };
  }

  function startConnection(args: { userId: string; state: string }): { installUrl: string } {
    if (!args.userId) {
      throw new GithubError("verification_failed", "userId is required to start a GitHub connection");
    }
    if (!args.state) {
      throw new GithubError("verification_failed", "state is required to start a GitHub connection");
    }
    const url = new URL(`https://github.com/apps/${config.appSlug}/installations/new`);
    url.searchParams.set("state", args.state);
    return { installUrl: url.toString() };
  }

  async function verifyAndLinkInstallation(args: {
    userId: string;
    installationId: string;
  }): Promise<GithubInstallation> {
    if (!args.userId) {
      throw new GithubError("verification_failed", "installation_id must be bound to a signed-in userId");
    }

    const existing = await store.getByInstallationId(args.installationId);
    if (existing && existing.userId !== args.userId) {
      throw new GithubError(
        "verification_failed",
        "installation_id is already linked to a different user",
      );
    }

    let accountLogin: string;
    let repositorySelection: ScopeType;
    try {
      const { data } = await appOctokit().apps.getInstallation({
        installation_id: Number(args.installationId),
      });
      accountLogin = data.account && "login" in data.account ? data.account.login : "";
      repositorySelection = data.repository_selection === "all" ? "all" : "selected";
    } catch (error) {
      throw wrapOctokitError(error);
    }

    const installation: GithubInstallation = {
      userId: args.userId,
      installationId: String(args.installationId),
      accountLogin,
      repositorySelection,
      status: "active",
    };
    await store.upsert(installation);
    const repos = await fetchInstallationRepos(installation.installationId);
    await store.replaceRepositories(installation.installationId, repos);
    return installation;
  }

  async function fetchInstallationRepos(
    installationId: string,
  ): Promise<GithubRepositoryRecord[]> {
    try {
      const octokit = await installationOctokit(installationId);
      const repos: GithubRepositoryRecord[] = [];
      const iterator = octokit.paginate.iterator(
        octokit.rest.apps.listReposAccessibleToInstallation,
        { per_page: 100 },
      );
      for await (const page of iterator) {
        const batch = page.data.repositories ?? [];
        for (const row of batch) {
          repos.push({
            installationId,
            repoId: String(row.id),
            fullName: row.full_name,
            private: row.private,
            defaultBranch: row.default_branch,
            lastPushAt: row.pushed_at ? Date.parse(row.pushed_at) : null,
            isFork: row.fork,
            isArchived: row.archived,
          });
        }
      }
      return repos;
    } catch (error) {
      throw wrapOctokitError(error);
    }
  }

  async function listRepositories(args: { userId: string }): Promise<ListedRepository[]> {
    const installation = await requireActiveInstallation(args.userId);
    const records = await fetchInstallationRepos(installation.installationId);
    await store.replaceRepositories(installation.installationId, records);
    return records.map((repo) => ({
      id: repo.repoId,
      fullName: repo.fullName,
      private: repo.private,
      defaultBranch: repo.defaultBranch,
      lastPushAt: repo.lastPushAt,
      isFork: repo.isFork,
      isArchived: repo.isArchived,
    }));
  }

  function listRepositoriesAsCandidates(repos: ListedRepository[]): UnpublishedDraftCandidate[] {
    return repos.map(toUnpublishedDraftCandidate);
  }

  async function disconnect(args: { userId: string }): Promise<{ ok: boolean }> {
    const installation = await store.getByUserId(args.userId);
    if (!installation || installation.status !== "active") {
      return { ok: true };
    }

    try {
      await appOctokit().apps.deleteInstallation({
        installation_id: Number(installation.installationId),
      });
    } catch (error) {
      const wrapped = wrapOctokitError(error);
      if (wrapped.code !== "not_found") throw wrapped;
    }

    await store.markRevoked(installation.installationId);
    await tokenCache.clear(installation.installationId);
    return { ok: true };
  }

  async function handleWebhook(rawBody: string, headers: WebhookHeaders): Promise<void> {
    const signature = headers.signature256;
    if (!signature) {
      throw new GithubError("webhook_invalid", "Missing X-Hub-Signature-256");
    }

    const valid = await verify(config.webhookSecret, rawBody, signature);
    if (!valid) {
      throw new GithubError("webhook_invalid", "GitHub webhook signature mismatch");
    }

    const event = headers.event;
    const payload = JSON.parse(rawBody) as {
      action?: string;
      installation?: {
        id: number;
        account?: { login?: string };
        repository_selection?: string;
      };
    };

    const installationId = payload.installation ? String(payload.installation.id) : null;
    if (!installationId) return;

    if (event === "installation" && payload.action === "deleted") {
      await store.markRevoked(installationId);
      await tokenCache.clear(installationId);
      return;
    }

    if (event === "installation" && (payload.action === "suspend" || payload.action === "unsuspend")) {
      if (payload.action === "suspend") {
        await store.markRevoked(installationId);
        await tokenCache.clear(installationId);
      }
      return;
    }

    const known = await store.getByInstallationId(installationId);
    if (!known || known.status !== "active") return;

    if (event === "installation" || event === "installation_repositories") {
      const accountLogin =
        payload.installation?.account?.login ?? known.accountLogin;
      const repositorySelection: ScopeType =
        payload.installation?.repository_selection === "all" ? "all" : known.repositorySelection;
      await store.upsert({
        ...known,
        accountLogin,
        repositorySelection,
        status: "active",
      });
      const repos = await fetchInstallationRepos(installationId);
      await store.replaceRepositories(installationId, repos);
    }
  }

  return {
    getConnectionStatus,
    listRepositories,
    listRepositoriesAsCandidates,
    startConnection,
    disconnect,
    verifyAndLinkInstallation,
    handleWebhook,
  };
}

function wrapOctokitError(error: unknown): GithubError {
  if (error instanceof GithubError) return error;
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status: number }).status)
      : undefined;
  const message = error instanceof Error ? error.message : "GitHub API error";
  if (status) return githubErrorFromHttp(status, message);
  return new GithubError("api_error", message);
}
