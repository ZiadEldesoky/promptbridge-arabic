import { getPackageVersion } from "../version.js";

export const latestReleaseApiUrl =
  "https://api.github.com/repos/ZiadEldesoky/promptbridge-arabic/releases/latest";
export const latestTagsApiUrl =
  "https://api.github.com/repos/ZiadEldesoky/promptbridge-arabic/tags?per_page=1";
export const releasesPageUrl =
  "https://github.com/ZiadEldesoky/promptbridge-arabic/releases/latest";
export const tagsPageUrl =
  "https://github.com/ZiadEldesoky/promptbridge-arabic/tags";

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  releaseUrl: string;
  error?: string;
}

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> }
) => Promise<FetchResponseLike>;

export async function checkForUpdates(options: {
  currentVersion?: string;
  fetchImpl?: FetchLike;
} = {}): Promise<UpdateCheckResult> {
  const currentVersion = normalizeVersion(
    options.currentVersion ?? getPackageVersion()
  );
  const fetchImpl = options.fetchImpl ?? defaultFetch();

  if (!fetchImpl) {
    return {
      currentVersion,
      updateAvailable: false,
      releaseUrl: releasesPageUrl,
      error: "This Node.js runtime does not provide fetch()."
    };
  }

  try {
    const release = await fetchLatestRelease(fetchImpl, currentVersion);
    const tag = await fetchLatestTag(fetchImpl, currentVersion);
    const latest = latestCandidate([release, tag]);

    if (latest) {
      return formatUpdateResult(currentVersion, latest);
    }

    return {
      currentVersion,
      updateAvailable: false,
      releaseUrl: tag.releaseUrl,
      error:
        tag.error ??
        release.error ??
        "GitHub did not return a release tag or repository tag."
    };
  } catch (error) {
    return {
      currentVersion,
      updateAvailable: false,
      releaseUrl: releasesPageUrl,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function normalizeVersion(version: string): string {
  return version
    .trim()
    .replace(/^v/i, "")
    .split("-")[0]
    .trim();
}

export function compareVersions(left: string, right: string): number {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

function defaultFetch(): FetchLike | undefined {
  return typeof fetch === "function" ? (fetch as FetchLike) : undefined;
}

async function fetchLatestRelease(
  fetchImpl: FetchLike,
  currentVersion: string
): Promise<{
  latestVersion?: string;
  releaseUrl: string;
  error?: string;
}> {
  const response = await fetchImpl(latestReleaseApiUrl, {
    headers: gitHubHeaders(currentVersion)
  });

  if (!response.ok) {
    return {
      releaseUrl: releasesPageUrl,
      error: `GitHub Releases returned HTTP ${response.status}.`
    };
  }

  return parseRelease(await response.json());
}

async function fetchLatestTag(
  fetchImpl: FetchLike,
  currentVersion: string
): Promise<{
  latestVersion?: string;
  releaseUrl: string;
  error?: string;
}> {
  const response = await fetchImpl(latestTagsApiUrl, {
    headers: gitHubHeaders(currentVersion)
  });

  if (!response.ok) {
    return {
      releaseUrl: tagsPageUrl,
      error: `GitHub Tags returned HTTP ${response.status}.`
    };
  }

  return parseTagList(await response.json());
}

function gitHubHeaders(currentVersion: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": `promptbridge-arabic/${currentVersion}`
  };
}

function formatUpdateResult(
  currentVersion: string,
  latest: { latestVersion: string; releaseUrl: string }
): UpdateCheckResult {
  return {
    currentVersion,
    latestVersion: latest.latestVersion,
    updateAvailable: compareVersions(latest.latestVersion, currentVersion) > 0,
    releaseUrl: latest.releaseUrl
  };
}

function latestCandidate(
  candidates: Array<{
    latestVersion?: string;
    releaseUrl: string;
  }>
): { latestVersion: string; releaseUrl: string } | undefined {
  return candidates
    .filter(
      (candidate): candidate is { latestVersion: string; releaseUrl: string } =>
        Boolean(candidate.latestVersion)
    )
    .sort((left, right) =>
      compareVersions(right.latestVersion, left.latestVersion)
    )[0];
}

function parseRelease(value: unknown): {
  latestVersion?: string;
  releaseUrl: string;
} {
  if (!value || typeof value !== "object") {
    return { releaseUrl: releasesPageUrl };
  }

  const release = value as { tag_name?: unknown; html_url?: unknown };
  const latestVersion =
    typeof release.tag_name === "string"
      ? normalizeVersion(release.tag_name)
      : undefined;
  const releaseUrl =
    typeof release.html_url === "string" && release.html_url.trim()
      ? release.html_url
      : releasesPageUrl;

  return { latestVersion, releaseUrl };
}

function parseTagList(value: unknown): {
  latestVersion?: string;
  releaseUrl: string;
} {
  if (!Array.isArray(value)) {
    return { releaseUrl: tagsPageUrl };
  }

  const firstTag = value[0] as { name?: unknown } | undefined;
  const latestVersion =
    typeof firstTag?.name === "string"
      ? normalizeVersion(firstTag.name)
      : undefined;

  return { latestVersion, releaseUrl: tagsPageUrl };
}

function versionParts(version: string): number[] {
  return normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part.match(/^\d+/)?.[0] ?? "0", 10));
}
