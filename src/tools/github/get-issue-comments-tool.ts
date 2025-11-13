import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { parseGitHubUrl } from "../../mastra/helpers";
import { githubClient } from "../../mastra/github-client";
import { handleGitHubResponse } from "../../mastra/error-handler";
import { GitHubComment } from "../../mastra/types";

export const getIssueComments = createTool({
  id: "get-issue-comments",
  inputSchema: z.object({
    issueUrl: z.string().describe("GitHub issue URL"),
  }),
  description: `Fetches comments from a GitHub issue. Useful for reading test plans or instructions posted as comments.`,
  execute: async ({ context: { issueUrl } }) => {
    const { apiBase, number } = parseGitHubUrl(issueUrl);
    const apiUrl = `${apiBase}/issues/${number}/comments`;

    const response = await githubClient.get<GitHubComment[]>(apiUrl);
    const data = handleGitHubResponse(response, "fetch issue comments");

    return {
      issueUrl,
      comments: data.map((comment) => ({
        id: comment.id,
        body: comment.body,
        user: comment.user.login,
        createdAt: comment.created_at,
      })),
    };
  },
});