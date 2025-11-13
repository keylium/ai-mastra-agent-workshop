import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { githubClient } from "../../mastra/github-client";
import { handleGitHubResponse } from "../../mastra/error-handler";
import { GitHubIssue } from "../../mastra/types";

export const createIssue = createTool({
  id: "create-issue",
  inputSchema: z.object({
    owner: z.string().describe("Repository owner (username or organization)"),
    repo: z.string().describe("Repository name"),
    title: z.string().describe("Issue title"),
    body: z.string().optional().describe("Issue body/description"),
    labels: z.array(z.string()).optional().describe("Issue labels"),
    assignees: z.array(z.string()).optional().describe("Users to assign to the issue"),
  }),
  description: `Creates a new GitHub issue in the specified repository. Use this to create bug reports, feature requests, or any other type of issue.`,
  execute: async ({ context: { owner, repo, title, body, labels, assignees } }) => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    
    const issueData = {
      title,
      body: body || "",
      labels: labels || [],
      assignees: assignees || [],
    };

    const response = await githubClient.post<GitHubIssue>(
      apiUrl, 
      issueData, 
      process.env.GITHUB_TOKEN
    );
    
    const data = handleGitHubResponse(response, "create issue");

    return {
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      html_url: data.html_url,
      labels: data.labels?.map((label: any) => typeof label === 'string' ? label : label.name) || [],
      assignees: data.assignees?.map((assignee: any) => assignee.login) || [],
    };
  },
});