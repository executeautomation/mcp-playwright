import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Browser, Page } from "playwright";
import { registerFileResource } from "../../resourceManager.js";
import type { Tool } from "../../types.js";
import { PlaywrightGenerator } from "./generator.js";
import { ActionRecorder } from "./recorder.js";
import type { CodegenOptions } from "./types.js";

declare global {
  var browser: Browser | undefined;
  var page: Page | undefined;
}

// Helper function to get workspace root path
const getWorkspaceRoot = () => {
  return process.cwd();
};

const DEFAULT_OPTIONS: Required<CodegenOptions> = {
  outputPath: path.join(getWorkspaceRoot(), "e2e"),
  testNamePrefix: "Test",
  includeComments: true,
};

export const startCodegenSession: Tool = {
  name: "start_codegen_session",
  description: "Start a new code generation session to record MCP tool actions",
  parameters: {
    type: "object",
    properties: {
      options: {
        type: "object",
        description: "Code generation options",
        properties: {
          outputPath: { type: "string" },
          testNamePrefix: { type: "string" },
          includeComments: { type: "boolean" },
        },
      },
    },
  },
  handler: async ({ options = {} }: { options?: CodegenOptions }, _context?: { server?: any }) => {
    try {
      // Merge provided options with defaults
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

      // Ensure output path is absolute and normalized
      const workspaceRoot = getWorkspaceRoot();
      const outputPath = path.isAbsolute(mergedOptions.outputPath)
        ? mergedOptions.outputPath
        : path.join(workspaceRoot, mergedOptions.outputPath);

      mergedOptions.outputPath = outputPath;

      // Ensure output directory exists
      try {
        await fs.mkdir(outputPath, { recursive: true });
      } catch (mkdirError: any) {
        throw new Error(`Failed to create output directory: ${mkdirError.message}`);
      }

      const sessionId = ActionRecorder.getInstance().startSession();

      // Store options with the session
      const recorder = ActionRecorder.getInstance();
      const session = recorder.getSession(sessionId);
      if (session) {
        session.options = mergedOptions;
      }

      return {
        sessionId,
        options: mergedOptions,
        message: `Started codegen session. Tests will be generated in: ${outputPath}`,
      };
    } catch (error: any) {
      throw new Error(`Failed to start codegen session: ${error.message}`);
    }
  },
};

export const endCodegenSession: Tool = {
  name: "end_codegen_session",
  description: "End the current code generation session and generate Playwright test",
  parameters: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "ID of the session to end",
      },
    },
    required: ["sessionId"],
  },
  handler: async ({ sessionId }: { sessionId: string }, context?: { server?: any }) => {
    try {
      const recorder = ActionRecorder.getInstance();
      const session = recorder.endSession(sessionId);

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.options) {
        throw new Error(`Session ${sessionId} has no options configured`);
      }

      const generator = new PlaywrightGenerator(session.options);
      const result = await generator.generateTest(session);

      // Double check output directory exists
      const outputDir = path.dirname(result.filePath);
      await fs.mkdir(outputDir, { recursive: true });

      // Write test file
      try {
        await fs.writeFile(result.filePath, result.testCode, "utf-8");
      } catch (writeError: any) {
        throw new Error(`Failed to write test file: ${writeError.message}`);
      }

      let resourceLink: Awaited<ReturnType<typeof registerFileResource>> | undefined;
      try {
        resourceLink = await registerFileResource({
          filePath: result.filePath,
          name: path.basename(result.filePath),
          mimeType: "text/plain",
          server: context?.server,
        });
      } catch (error) {
        console.warn("Failed to register generated test as resource:", error);
      }

      // Close Playwright browser and cleanup
      try {
        if (global.browser?.isConnected()) {
          await global.browser.close();
        }
      } catch (browserError: any) {
        console.warn("Failed to close browser:", browserError.message);
      } finally {
        global.browser = undefined;
        global.page = undefined;
      }

      const absolutePath = path.resolve(result.filePath);
      const displayPath = resourceLink?.uri ?? absolutePath;

      return {
        filePath: absolutePath,
        outputDirectory: outputDir,
        testCode: result.testCode,
        message: `Generated test file at: ${displayPath}\nOutput directory: ${outputDir}`,
        ...(resourceLink ? { resourceLinks: [resourceLink] } : {}),
      };
    } catch (error: any) {
      // Ensure browser cleanup even on error
      try {
        if (global.browser?.isConnected()) {
          await global.browser.close();
        }
      } catch {
        // Ignore cleanup errors
      } finally {
        global.browser = undefined;
        global.page = undefined;
      }

      throw new Error(`Failed to end codegen session: ${error.message}`);
    }
  },
};

export const getCodegenSession: Tool = {
  name: "get_codegen_session",
  description: "Get information about a code generation session",
  parameters: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "ID of the session to retrieve",
      },
    },
    required: ["sessionId"],
  },
  handler: async ({ sessionId }: { sessionId: string }, _context?: { server?: any }) => {
    const session = ActionRecorder.getInstance().getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session;
  },
};

export const clearCodegenSession: Tool = {
  name: "clear_codegen_session",
  description: "Clear a code generation session",
  parameters: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "ID of the session to clear",
      },
    },
    required: ["sessionId"],
  },
  handler: async ({ sessionId }: { sessionId: string }, _context?: { server?: any }) => {
    const success = ActionRecorder.getInstance().clearSession(sessionId);
    if (!success) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return { success };
  },
};

export const codegenTools = [startCodegenSession, endCodegenSession, getCodegenSession, clearCodegenSession];
