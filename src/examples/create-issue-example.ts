import { issueAgent } from "../agents/issue-agent";

async function createGitHubIssue() {
  try {
    // issueAgentを使ってissueを作成
    const result = await issueAgent.generate(
      "Create a bug report issue for the repository 'keylium/ai-mastra-agent-workshop' with the title 'ログイン機能の不具合' and description 'ユーザーがログインしようとするとエラーが発生します。ブラウザのコンソールに404エラーが表示されます。' Add labels 'bug' and 'high-priority'."
    );
    
    console.log("Issue creation result:", result);
  } catch (error) {
    console.error("Error creating issue:", error);
  }
}

async function createFeatureRequestIssue() {
  try {
    const result = await issueAgent.generate(
      "Create a feature request for repository 'keylium/ai-mastra-agent-workshop' to add a new user dashboard with the following requirements: - User profile management - Activity history - Settings page. Add labels 'enhancement' and 'frontend'."
    );
    
    console.log("Feature request result:", result);
  } catch (error) {
    console.error("Error creating feature request:", error);
  }
}

// 使用例
createGitHubIssue();
// createFeatureRequestIssue();