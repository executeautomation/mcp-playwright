export interface CodegenAction {
  toolName: string;
  parameters: Record<string, unknown>;
  timestamp: number;
  result?: unknown;
}

export interface CodegenSession {
  id: string;
  actions: CodegenAction[];
  startTime: number;
  endTime?: number;
  options?: CodegenOptions;
}

export interface PlaywrightTestCase {
  name: string;
  steps: string[];
  imports: Set<string>;
}

export interface CodegenOptions {
  outputPath?: string;
  testNamePrefix?: string;
  includeComments?: boolean;
}

export interface CodegenResult {
  testCode: string;
  filePath: string;
  sessionId: string;
}
