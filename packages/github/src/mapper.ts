import type { ListedRepository, UnpublishedDraftCandidate } from "./types.ts";

export function toUnpublishedDraftCandidate(
  repo: ListedRepository,
): UnpublishedDraftCandidate {
  const title = repo.fullName.split("/")[1] ?? repo.fullName;
  return {
    origin: "github",
    bucket: "unpublished_draft",
    contentType: "repo",
    githubFullName: repo.fullName,
    title,
    defaultBranch: repo.defaultBranch,
  };
}
