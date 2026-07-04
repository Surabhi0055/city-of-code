export interface GitHubFile {
  path: string;
  size: number;
  type: "blob" | "tree";
  sha: string;
}

export interface RepoData {
  owner: string;
  repo: string;
  files: GitHubFile[];
}

// Parses a GitHub URL into owner + repo name
// "https://github.com/facebook/react" → { owner: "facebook", repo: "react" }
export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const clean = url.trim().replace(/\.git$/, "");
    const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

// Fetches the full file tree from GitHub API
export async function fetchRepoData(
  owner: string,
  repo: string,
): Promise<RepoData> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} — check the repo URL is public`,
    );
  }

  const data = await response.json();

  // If truncated, the repo is too large — warn the user
  if (data.truncated) {
    console.warn("Repo too large — showing first 1000 files only");
  }

  const files: GitHubFile[] = data.tree
    .filter((item: GitHubFile) => item.type === "blob" && item.size > 0)
    .slice(0, 300); // ← cap at 300 buildings max

  return { owner, repo, files };
}
