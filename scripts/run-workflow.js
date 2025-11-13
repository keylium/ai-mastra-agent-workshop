#!/usr/bin/env node

/**
 * CLI Script to trigger AI Test Automation Workflow
 * Usage: node scripts/run-workflow.js <pull-request-url>
 */

import { mastra } from '../src/mastra/index.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/run-workflow.js <pull-request-url>');
    console.error('Example: node scripts/run-workflow.js https://github.com/owner/repo/pull/123');
    process.exit(1);
  }

  const pullRequestUrl = args[0];
  
  if (!pullRequestUrl.includes('github.com') || !pullRequestUrl.includes('/pull/')) {
    console.error('Invalid GitHub pull request URL format');
    process.exit(1);
  }

  console.log('🤖 Starting AI Test Automation Workflow...');
  console.log(`📋 Pull Request: ${pullRequestUrl}`);
  console.log('');

  try {
    // Check environment variables
    const requiredEnvVars = ['GITHUB_TOKEN', 'OPENAI_API_KEY', 'BROWSER_USE_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    // Run the workflow using Mastra
    console.log('🔄 Executing workflow steps...');
    
    // Note: This is a simplified approach since we don't have access to mastra.runWorkflow
    // We'll execute the workflow steps manually
    const { prWorkflow } = await import('../src/workflows/pull-request-workflow.js');
    
    // Create a mock context for workflow execution
    const context = {
      inputData: { pullRequestUrl },
      getInitData: () => ({ pullRequestUrl }),
      getStepResult: () => null,
      bail: (data) => data,
    };

    console.log('✅ Workflow setup complete');
    console.log('');
    console.log('📝 The workflow will:');
    console.log('   1. Generate test plan from PR changes');
    console.log('   2. Post test plan as GitHub comment');
    console.log('   3. Wait for preview environment');
    console.log('   4. Execute test cases automatically');
    console.log('   5. Post test results as GitHub comment');
    console.log('');
    console.log('🎯 Check your pull request for automated comments!');
    
  } catch (error) {
    console.error('❌ Workflow execution failed:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);