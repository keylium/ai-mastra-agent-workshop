#!/usr/bin/env node

/**
 * CLI Script to execute test plan from GitHub issue
 * Usage: node scripts/run-issue-tests.js <issue-url> [target-url]
 */

import { BrowserTestExecutor } from '../src/agents/browser-agent.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/run-issue-tests.js <issue-url> [target-url]');
    console.error('Example: node scripts/run-issue-tests.js https://github.com/owner/repo/issues/123 https://example.com');
    process.exit(1);
  }

  const issueUrl = args[0];
  const targetUrl = args[1];
  
  if (!issueUrl.includes('github.com') || !issueUrl.includes('/issues/')) {
    console.error('Invalid GitHub issue URL format');
    process.exit(1);
  }

  console.log('🤖 Starting Test Execution from GitHub Issue...');
  console.log(`📝 Issue: ${issueUrl}`);
  if (targetUrl) {
    console.log(`🎯 Target URL: ${targetUrl}`);
  }
  console.log('');

  try {
    // Check environment variables
    const requiredEnvVars = ['GITHUB_TOKEN', 'BROWSER_USE_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }

    // Create browser test executor
    const executor = new BrowserTestExecutor();
    
    console.log('🔍 Reading test plan from issue comments...');
    
    // Execute test plan from issue
    const results = await executor.executeTestPlanFromIssue(issueUrl, targetUrl);
    
    console.log('');
    console.log('📊 Test Results:');
    console.log('================');
    
    let passedCount = 0;
    let failedCount = 0;
    
    results.forEach((result, index) => {
      const emoji = result.status === 'success' ? '✅' : '❌';
      const status = result.status === 'success' ? 'PASSED' : 'FAILED';
      
      console.log(`${emoji} Test ${index + 1}: ${result.title} - ${status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      console.log('');
      
      if (result.status === 'success') {
        passedCount++;
      } else {
        failedCount++;
      }
    });
    
    console.log('📈 Summary:');
    console.log(`   Total: ${results.length}`);
    console.log(`   Passed: ${passedCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Success Rate: ${Math.round((passedCount / results.length) * 100)}%`);
    
    if (failedCount > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:');
    console.error(error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);