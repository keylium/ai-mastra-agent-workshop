export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: { login: string };
  created_at: string;
  path?: string;
  line?: number;
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  labels?: Array<{ name: string } | string>;
  assignees?: Array<{ login: string }>;
}

export interface GitHubApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}
