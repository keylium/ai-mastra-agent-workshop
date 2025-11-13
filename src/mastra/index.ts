import { Mastra } from "@mastra/core";
import { VercelDeployer } from "@mastra/deployer-vercel";

import { testplanAgent } from "../agents/testplan-agent";
import { issueAgent } from "../agents/issue-agent";
import { prWorkflow } from "../workflows/pull-request-workflow";

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set");
}

if (!process.env.BROWSER_USE_API_KEY) {
  throw new Error("BROWSER_USE_API_KEY is not set");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

export const mastra = new Mastra({
  agents: { testplanAgent, issueAgent },
  deployer: new VercelDeployer(),
  workflows: {
    prWorkflow,
  },
});
