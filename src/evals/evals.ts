//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const startCodegenSessionEval: EvalFunction = {
  name: 'startCodegenSession Evaluation',
  description: 'Evaluates the start codegen session tool',
  run: async () => {
    const result = await grade(openai("gpt-4"), "Please start a new code generation session with an output path of /my/test/path, a testNamePrefix of MyPrefix, and comments enabled. Confirm the session was created successfully.");
    return JSON.parse(result);
  }
};

const end_codegen_sessionEval: EvalFunction = {
    name: 'end_codegen_session Evaluation',
    description: 'Evaluates the end_codegen_session tool functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please end the code generation session with ID session123 and generate the Playwright test code");
        return JSON.parse(result);
    }
};

const get_codegen_sessionEval: EvalFunction = {
    name: 'get_codegen_session Tool Evaluation',
    description: 'Evaluates the retrieval of code generation session details',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please retrieve the code generation session details using session ID abc123.");
        return JSON.parse(result);
    }
};

const clearCodegenSessionEval: EvalFunction = {
    name: 'clear_codegen_session Evaluation',
    description: 'Evaluates the functionality of clearing a code generation session',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please clear the code generation session with the ID testSession_123 to verify removal.");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [startCodegenSessionEval, end_codegen_sessionEval, get_codegen_sessionEval, clearCodegenSessionEval]
};
  
export default config;
  
export const evals = [startCodegenSessionEval, end_codegen_sessionEval, get_codegen_sessionEval, clearCodegenSessionEval];