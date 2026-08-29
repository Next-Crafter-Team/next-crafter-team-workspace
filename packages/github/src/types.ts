export type ScopeType = "all" | "selected";
export type InstallationStatus = "active" | "revoked";

export type GithubAppConfig = {
  appId: string;
  appSlug: string;
  privateKey: string;
  webhookSecret: string;
};

export type GithubInstallation = {
  userId: string;
  installationId: string;
  accountLogin: string;
  repositorySelection: ScopeType;
  status: InstallationStatus;
};

export type GithubRepositoryRecord = {
  installationId: string;
  repoId: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  lastPushAt: number | null;
  isFork: boolean;
  isArchived: boolean;
};

export type ConnectionStatus = {
  connected: boolean;
  installationId?: string;
  accountLogin?: string;
  scopeType: ScopeType;
};

export type ListedRepository = {
  id: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  lastPushAt: number | null;
  isFork: boolean;
  isArchived: boolean;
};

export type UnpublishedDraftCandidate = {
  origin: "github";
  bucket: "unpublished_draft";
  contentType: "repo";
  githubFullName: string;
  title: string;
  defaultBranch: string;
};

export type WebhookHeaders = {
  id?: string;
  event?: string;
  signature256?: string;
};
