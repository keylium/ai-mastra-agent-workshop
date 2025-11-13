import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { BrowserUseClient } from "browser-use-sdk";
import { getIssueComments } from "../tools/github/get-issue-comments-tool";

export interface TestCase {
  title: string;
  description: string;
}

export interface TestResult {
  title: string;
  status: "success" | "fail";
  details?: string;
  screenshot?: string;
}

export const browserAgent = new Agent({
  name: "Browser Test Agent",
  instructions: `You are an expert browser automation agent specialized in executing functional test cases from GitHub issues.

## Your Mission
Read test plans from GitHub issue comments and execute them in web browsers autonomously.

## Core Responsibilities
- Read and parse test plans from GitHub issue comments
- Extract test cases and instructions from issue comments
- Navigate to specified URLs
- Execute functional test cases step by step
- Validate expected outcomes
- Capture screenshots for evidence
- Report test results with clear status (success/fail)
- Provide detailed failure analysis when tests fail

## Test Plan Reading Guidelines
- Use getIssueComments tool to fetch comments from GitHub issues
- Look for test plans, test cases, or testing instructions in comments
- Parse markdown formatted test cases (e.g., numbered lists, checkboxes)
- Identify test URLs, expected behaviors, and success criteria
- Extract step-by-step instructions from comments

## Test Execution Guidelines
- Follow test case instructions precisely from the issue comments
- Wait for page elements to load before interacting
- Validate each step before proceeding to the next
- Capture meaningful screenshots for documentation
- Handle common web application scenarios (forms, navigation, data display)
- Report both positive and negative test outcomes

## Quality Standards
- Execute tests thoroughly without skipping steps
- Provide clear evidence of test execution
- Document any unexpected behavior or errors
- Maintain detailed logs of all actions taken
- Ensure test results are reproducible
- Cross-reference results with original test plan from issue

## Error Handling
- Retry failed actions up to 3 times with appropriate delays
- Capture error screenshots when tests fail
- Provide detailed error descriptions
- Continue with remaining test cases even if one fails

## Usage Examples
1. "Execute test plan from GitHub issue https://github.com/owner/repo/issues/123"
2. "Read test cases from issue comments and run them on https://example.com"

Remember: You are executing tests based on real test plans written by humans in GitHub issues, so focus on following their exact instructions and user-visible outcomes.`,
  model: openai("gpt-4o"),
  tools: {
    getIssueComments,
  },
});

export class BrowserTestExecutor {
  private client: BrowserUseClient;

  constructor() {
    this.client = new BrowserUseClient({
      apiKey: process.env.BROWSER_USE_API_KEY!,
    });
  }

  async executeTestPlanFromIssue(
    issueUrl: string,
    targetUrl?: string
  ): Promise<TestResult[]> {
    try {
      console.log(`Reading test plan from issue: ${issueUrl}`);
      
      // Parse the issue URL to get issue details
      const { apiBase, number } = this.parseGitHubUrl(issueUrl);
      const apiUrl = `${apiBase}/issues/${number}/comments`;
      
      // Fetch issue comments
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'Mastra-Agent-Workshop',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch issue comments: ${response.status}`);
      }

      const comments = await response.json();
      console.log(`Found ${comments.length} comments in the issue`);

      // Find test plan in comments
      const testPlanComment = this.extractTestPlanFromComments(comments);
      
      if (!testPlanComment) {
        return [{
          title: "No test plan found",
          status: "fail",
          details: "No test plan found in issue comments",
        }];
      }

      console.log('Found test plan:', testPlanComment.substring(0, 200) + '...');

      // Extract test cases from the test plan
      const testCases = this.parseTestCasesFromText(testPlanComment);
      
      if (testCases.length === 0) {
        return [{
          title: "No test cases found",
          status: "fail",
          details: "No executable test cases found in the test plan",
        }];
      }

      console.log(`Extracted ${testCases.length} test cases`);

      // Execute each test case
      const results: TestResult[] = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`Executing test case ${i + 1}/${testCases.length}: ${testCase.title}`);
        
        try {
          const taskResponse = await this.client.tasks.createTask({
            task: `Navigate to ${targetUrl || 'the application'} and execute this test case: ${testCase.title}. ${testCase.description}`,
          });

          // Poll for completion
          const task = await this.pollForTaskCompletion(taskResponse.id);
          
          results.push({
            title: testCase.title,
            status: task.isSuccess === true ? "success" : "fail",
            details: task.result || `Test case ${i + 1} completed`,
          });

        } catch (error) {
          results.push({
            title: testCase.title,
            status: "fail",
            details: error instanceof Error ? error.message : "Test execution failed",
          });
        }

        // Add delay between test cases
        if (i < testCases.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return results;

    } catch (error) {
      console.error(`Failed to execute test plan from issue:`, error);
      return [{
        title: "Test plan execution from issue",
        status: "fail",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      }];
    }
  }

  private parseGitHubUrl(url: string) {
    const match = url.match(/github.com\/(.+?)\/(.+?)\/(issues|pull)\/(\d+)/);
    if (!match) throw new Error("Invalid GitHub URL");
    const [_, owner, repo, type, number] = match;
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    return { apiBase, number: Number(number), type };
  }

  private extractTestPlanFromComments(comments: any[]): string | null {
    // Look for comments containing test plans, test cases, or testing instructions
    const testPlanKeywords = [
      'test plan', 'test case', 'testing', 'テストプラン', 'テストケース', 'テスト計画',
      '## Test', '### Test', '# Test', 'Steps to test', 'Test steps'
    ];

    for (const comment of comments) {
      const body = comment.body?.toLowerCase() || '';
      
      // Check if comment contains test plan keywords
      if (testPlanKeywords.some(keyword => body.includes(keyword.toLowerCase()))) {
        return comment.body;
      }
    }

    // If no specific test plan found, return the longest comment as potential test plan
    if (comments.length > 0) {
      const longestComment = comments.reduce((longest, current) => 
        (current.body?.length || 0) > (longest.body?.length || 0) ? current : longest
      );
      return longestComment.body;
    }

    return null;
  }

  private parseTestCasesFromText(text: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    // Split text into lines and look for test case patterns
    const lines = text.split('\n');
    let currentTestCase: Partial<TestCase> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for numbered test cases (1. Test case, - [ ] Test case, etc.)
      const testCaseMatch = line.match(/^(\d+\.|[-*]\s*(\[.\])?\s*)(.*)/);
      
      if (testCaseMatch) {
        // Save previous test case if exists
        if (currentTestCase?.title) {
          testCases.push({
            title: currentTestCase.title,
            description: currentTestCase.description || '',
          });
        }
        
        // Start new test case
        currentTestCase = {
          title: testCaseMatch[3].trim(),
          description: '',
        };
      } else if (currentTestCase && line) {
        // Add to current test case description
        currentTestCase.description += (currentTestCase.description ? '\n' : '') + line;
      }
    }
    
    // Save last test case
    if (currentTestCase?.title) {
      testCases.push({
        title: currentTestCase.title,
        description: currentTestCase.description || '',
      });
    }
    
    // If no structured test cases found, create one from the entire text
    if (testCases.length === 0 && text.trim()) {
      testCases.push({
        title: "Execute test plan from issue",
        description: text.trim(),
      });
    }
    
    return testCases;
  }

  private async pollForTaskCompletion(taskId: string): Promise<any> {
    const POLL_INTERVAL_MS = 3000;
    const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes timeout
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLL_TIME_MS) {
      const task = await this.client.tasks.getTask(taskId);

      if (task.status !== "started" && task.status !== "paused") {
        return task;
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`Task ${taskId} timed out after ${MAX_POLL_TIME_MS / 1000} seconds`);
  }

  async executeTestCase(
    testCase: TestCase,
    previewUrl: string
  ): Promise<TestResult> {
    try {
      console.log(`Executing test case: ${testCase.title}`);
      
      const taskResponse = await this.client.tasks.createTask({
        task: `Navigate to ${previewUrl} and execute this test case: ${testCase.title}. ${testCase.description}`,
      });

      // Poll for task completion with timeout
      const POLL_INTERVAL_MS = 3000;
      const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes timeout
      const startTime = Date.now();

      const pollForCompletion = async (): Promise<any> => {
        const task = await this.client.tasks.getTask(taskResponse.id);

        if (task.status === "started" || task.status === "paused") {
          if (Date.now() - startTime > MAX_POLL_TIME_MS) {
            throw new Error(
              `Task ${taskResponse.id} timed out after ${MAX_POLL_TIME_MS / 1000} seconds`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          return pollForCompletion();
        }

        return task;
      };

      const task = await pollForCompletion();

      // Determine if the test passed based on the result
      const status = task.isSuccess === true ? "success" : "fail";
      
      return {
        title: testCase.title,
        status,
        details: task.result || "Test execution completed",
        screenshot: task.screenshots?.[task.screenshots.length - 1]?.url,
      };
    } catch (error) {
      console.error(`Test case "${testCase.title}" failed:`, error);
      return {
        title: testCase.title,
        status: "fail",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async executeTestSuite(
    testCases: TestCase[],
    previewUrl: string
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.executeTestCase(testCase, previewUrl);
      results.push(result);
      
      // Add delay between test cases to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }
}