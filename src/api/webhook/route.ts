import { prWorkflow } from '../../workflows/pull-request-workflow';

interface GitHubWebhookPayload {
  action: string;
  number: number;
  pull_request: {
    html_url: string;
    title: string;
    body: string;
    draft: boolean;
    merged: boolean;
    state: string;
  };
  repository: {
    full_name: string;
  };
}

export async function handleWebhook(payload: GitHubWebhookPayload) {
  try {
    // Only process pull request events
    if (!payload.pull_request) {
      return {
        status: 200,
        message: 'Not a pull request event'
      };
    }

    // Skip draft PRs and merged PRs
    if (payload.pull_request.draft || payload.pull_request.merged) {
      return {
        status: 200,
        message: 'Skipping draft or merged PR'
      };
    }

    // Only process opened, synchronize, and reopened actions
    const validActions = ['opened', 'synchronize', 'reopened'];
    if (!validActions.includes(payload.action)) {
      return {
        status: 200,
        message: `Skipping action: ${payload.action}`
      };
    }

    console.log(`Processing PR #${payload.number} from ${payload.repository.full_name}`);
    console.log(`Action: ${payload.action}`);
    console.log(`PR URL: ${payload.pull_request.html_url}`);

    // Execute the AI test workflow directly
    const workflowContext = {
      inputData: {
        pullRequestUrl: payload.pull_request.html_url,
      },
      getInitData: () => ({
        pullRequestUrl: payload.pull_request.html_url,
      }),
      getStepResult: (step: any) => null,
      bail: (data: any) => data,
    };

    // Execute workflow steps in sequence
    const testPlanResult = await prWorkflow.run(workflowContext);

    console.log('Workflow completed successfully:', testPlanResult);

    return {
      status: 200,
      message: 'AI test workflow completed successfully',
      pullRequest: {
        number: payload.number,
        title: payload.pull_request.title,
        url: payload.pull_request.html_url,
      },
      result: testPlanResult,
    };

  } catch (error) {
    console.error('Webhook processing failed:', error);
    
    return {
      status: 500,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}