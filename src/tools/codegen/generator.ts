import * as path from "node:path";
import type { CodegenAction, CodegenOptions, CodegenResult, CodegenSession, PlaywrightTestCase } from "./types.js";

export class PlaywrightGenerator {
  private static readonly DEFAULT_OPTIONS: Required<CodegenOptions> = {
    outputPath: "tests",
    testNamePrefix: "MCP",
    includeComments: true,
  };

  private options: Required<CodegenOptions>;

  constructor(options: CodegenOptions = {}) {
    this.validateOptions(options);
    this.options = { ...PlaywrightGenerator.DEFAULT_OPTIONS, ...options };
  }

  private validateOptions(options: CodegenOptions): void {
    if (options.outputPath && typeof options.outputPath !== "string") {
      throw new Error("outputPath must be a string");
    }
    if (options.testNamePrefix && typeof options.testNamePrefix !== "string") {
      throw new Error("testNamePrefix must be a string");
    }
    if (options.includeComments !== undefined && typeof options.includeComments !== "boolean") {
      throw new Error("includeComments must be a boolean");
    }
  }

  async generateTest(session: CodegenSession): Promise<CodegenResult> {
    if (!session || !Array.isArray(session.actions)) {
      throw new Error("Invalid session data");
    }

    const testCase = this.createTestCase(session);
    const testCode = this.generateTestCode(testCase);
    const filePath = this.getOutputFilePath(session);

    return {
      testCode,
      filePath,
      sessionId: session.id,
    };
  }

  private createTestCase(session: CodegenSession): PlaywrightTestCase {
    const testCase: PlaywrightTestCase = {
      name: `${this.options.testNamePrefix}_${new Date(session.startTime).toISOString().split("T")[0]}`,
      steps: [],
      imports: new Set(["test", "expect"]),
    };

    for (const action of session.actions) {
      const step = this.convertActionToStep(action);
      if (step) {
        testCase.steps.push(step);
      }
    }

    return testCase;
  }

  private convertActionToStep(action: CodegenAction): string | null {
    const { toolName, parameters } = action;

    switch (toolName) {
      case "playwright_navigate":
        return this.generateNavigateStep(parameters);
      case "playwright_fill":
        return this.generateFillStep(parameters);
      case "playwright_click":
        return this.generateClickStep(parameters);
      case "playwright_screenshot":
        return this.generateScreenshotStep(parameters);
      case "playwright_expect_response":
        return this.generateExpectResponseStep(parameters);
      case "playwright_assert_response":
        return this.generateAssertResponseStep(parameters);
      case "playwright_hover":
        return this.generateHoverStep(parameters);
      case "playwright_select":
        return this.generateSelectStep(parameters);
      case "playwright_custom_user_agent":
        return this.generateCustomUserAgentStep(parameters);
      default:
        console.warn(`Unsupported tool: ${toolName}`);
        return null;
    }
  }

  private generateNavigateStep(parameters: Record<string, unknown>): string {
    const { url, waitUntil } = parameters;
    const options = waitUntil ? `, { waitUntil: '${waitUntil}' }` : "";
    return `
    // Navigate to URL
    await page.goto('${url}'${options});`;
  }

  private generateFillStep(parameters: Record<string, unknown>): string {
    const { selector, value } = parameters;
    return `
    // Fill input field
    await page.fill('${selector}', '${value}');`;
  }

  private generateClickStep(parameters: Record<string, unknown>): string {
    const { selector } = parameters;
    return `
    // Click element
    await page.click('${selector}');`;
  }

  private generateScreenshotStep(parameters: Record<string, unknown>): string {
    const { name, fullPage = false, path } = parameters;
    const options = [];
    if (fullPage) options.push("fullPage: true");
    if (path) options.push(`path: '${path}'`);

    const optionsStr = options.length > 0 ? `, { ${options.join(", ")} }` : "";
    return `
    // Take screenshot
    await page.screenshot({ path: '${name}.png'${optionsStr} });`;
  }

  private generateExpectResponseStep(parameters: Record<string, unknown>): string {
    const { url, id } = parameters;
    return `
    // Wait for response
    const ${id}Response = page.waitForResponse('${url}');`;
  }

  private generateAssertResponseStep(parameters: Record<string, unknown>): string {
    const { id, value } = parameters;
    const assertion = value
      ? `\n    const responseText = await ${id}Response.text();\n    expect(responseText).toContain('${value}');`
      : `\n    expect(${id}Response.ok()).toBeTruthy();`;
    return `
    // Assert response${assertion}`;
  }

  private generateHoverStep(parameters: Record<string, unknown>): string {
    const { selector } = parameters;
    return `
    // Hover over element
    await page.hover('${selector}');`;
  }

  private generateSelectStep(parameters: Record<string, unknown>): string {
    const { selector, value } = parameters;
    return `
    // Select option
    await page.selectOption('${selector}', '${value}');`;
  }

  private generateCustomUserAgentStep(parameters: Record<string, unknown>): string {
    const { userAgent } = parameters;
    return `
    // Set custom user agent
    await context.setUserAgent('${userAgent}');`;
  }

  private generateTestCode(testCase: PlaywrightTestCase): string {
    const imports = Array.from(testCase.imports)
      .map((imp) => `import { ${imp} } from '@playwright/test';`)
      .join("\n");

    return `
${imports}

test('${testCase.name}', async ({ page, context }) => {
  ${testCase.steps.join("\n")}
});`;
  }

  private getOutputFilePath(session: CodegenSession): string {
    if (!session.id) {
      throw new Error("Session ID is required");
    }

    const sanitizedPrefix = this.options.testNamePrefix.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const fileName = `${sanitizedPrefix}_${session.id}.spec.ts`;
    return path.resolve(this.options.outputPath, fileName);
  }
}
