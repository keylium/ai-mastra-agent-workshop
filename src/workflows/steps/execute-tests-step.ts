import { z } from "zod";
import { createStep } from "@mastra/core/workflows";
import { generateTestPlanStep } from "./generate-test-plan-step";
import { previewEnvironmentOutputSchema } from "./wait-for-preview-environment-step";
import { BrowserTestExecutor } from "../../agents/browser-agent";

export const testExecutionOutputSchema = z.object({
  needsTesting: z.boolean(),
  testCases: z.array(
    z.object({
      title: z.string(),
      status: z.enum(["success", "fail"]),
    })
  ),
});

export const executeTestsStep = createStep({
  id: "execute-tests",
  inputSchema: previewEnvironmentOutputSchema,
  outputSchema: testExecutionOutputSchema,

  execute: async (context) => {
    const testPlanResult = context.getStepResult(generateTestPlanStep);

    if (!testPlanResult) {
      throw new Error("Test plan step result not found");
    }

    const { testCases, needsTesting } = testPlanResult;

    if (!needsTesting) {
      return {
        needsTesting: false,
        testCases: [],
      };
    }

    const browserExecutor = new BrowserTestExecutor();
    const testResults = await browserExecutor.executeTestSuite(
      testCases,
      context.inputData.previewUrl
    );

    const executedTestCases = testResults.map((result) => ({
      title: result.title,
      status: result.status,
    }));

    return {
      needsTesting: true,
      testCases: executedTestCases,
    };
  },
});
