import type { Address } from "viem";
import { isAddress } from "viem";

export interface Contributor {
  githubHandle: string;
  avatarUrl: string;
  commits: number;
  additions: number;
  deletions: number;
  /** Wallet address — required to deploy, absent for GitHub-fetched rows (PRD FR-2: address comes from CSV, not the GitHub API). */
  address?: Address;
}

interface GitHubContributorResponse {
  login: string;
  avatar_url: string;
  contributions: number;
}

/** Fetch contributors for a public GitHub repo via the unauthenticated Contributors API. */
export async function fetchContributors(repoUrl: string): Promise<Contributor[]> {
  const match = repoUrl
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\/$/, "")
    .match(/^([^/]+)\/([^/]+)$/);

  if (!match) throw new Error("Enter a valid GitHub repo URL, e.g. github.com/owner/repo");
  const [, owner, repo] = match;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (res.status === 404) throw new Error("Repository not found.");
  if (res.status === 403) throw new Error("GitHub rate limit reached. Try again in a few minutes.");
  if (!res.ok) throw new Error(`GitHub API error (${res.status}).`);

  const data = (await res.json()) as GitHubContributorResponse[];
  if (data.length === 0) throw new Error("No contributors found for this repository.");

  return data.map((c) => ({
    githubHandle: c.login,
    avatarUrl: c.avatar_url,
    commits: c.contributions,
    additions: 0,
    deletions: 0,
  }));
}

/**
 * Parse the PRD FR-2 CSV path (columns: address, github_handle, commits).
 * This is the only source of wallet addresses — GitHub's API has no address field,
 * and a real claim authorization must be cryptographically bound to one.
 */
export function parseContributorsCsv(text: string): Contributor[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) throw new Error("CSV is empty.");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const addressIdx = header.indexOf("address");
  const handleIdx = header.indexOf("github_handle");
  const commitsIdx = header.indexOf("commits");

  if (addressIdx === -1 || handleIdx === -1) {
    throw new Error("CSV must have address and github_handle columns.");
  }

  const rows = lines.slice(1);
  if (rows.length === 0) throw new Error("CSV has a header but no rows.");

  return rows.map((line, i) => {
    const cols = line.split(",").map((c) => c.trim());
    const address = cols[addressIdx];
    const githubHandle = cols[handleIdx];
    if (!isAddress(address)) throw new Error(`Row ${i + 2}: "${address}" is not a valid address.`);
    if (!githubHandle) throw new Error(`Row ${i + 2}: missing github_handle.`);

    return {
      githubHandle,
      avatarUrl: `https://github.com/${githubHandle}.png`,
      commits: commitsIdx !== -1 ? Number(cols[commitsIdx]) || 0 : 0,
      additions: 0,
      deletions: 0,
      address: address as Address,
    };
  });
}

export type Formula = "flat" | "weighted" | "manual";

/** Compute per-contributor amounts from a budget, formula, and commit weights. */
export function computeAllocations(
  contributors: Contributor[],
  selected: Set<string>,
  totalBudget: number,
  formula: Formula,
  manualAmounts: Record<string, number>
): Record<string, number> {
  const active = contributors.filter((c) => selected.has(c.githubHandle));
  if (active.length === 0) return {};

  const out: Record<string, number> = {};

  if (formula === "flat") {
    const each = Math.floor(totalBudget / active.length);
    for (const c of active) out[c.githubHandle] = each;
  } else if (formula === "weighted") {
    const totalCommits = active.reduce((s, c) => s + c.commits, 0);
    for (const c of active) {
      out[c.githubHandle] = Math.floor((c.commits / totalCommits) * totalBudget);
    }
  } else {
    for (const c of active) out[c.githubHandle] = manualAmounts[c.githubHandle] ?? 0;
  }

  return out;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
