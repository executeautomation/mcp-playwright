import { v4 as uuidv4 } from "uuid";
import type { CodegenAction, CodegenSession } from "./types";

export class ActionRecorder {
  private static instance: ActionRecorder;
  private sessions: Map<string, CodegenSession>;
  private activeSession: string | null;

  private constructor() {
    this.sessions = new Map();
    this.activeSession = null;
  }

  static getInstance(): ActionRecorder {
    if (!ActionRecorder.instance) {
      ActionRecorder.instance = new ActionRecorder();
    }
    return ActionRecorder.instance;
  }

  startSession(): string {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      id: sessionId,
      actions: [],
      startTime: Date.now(),
    });
    this.activeSession = sessionId;
    return sessionId;
  }

  endSession(sessionId: string): CodegenSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      if (this.activeSession === sessionId) {
        this.activeSession = null;
      }
      return session;
    }
    return null;
  }

  recordAction(toolName: string, parameters: Record<string, unknown>, result?: unknown): void {
    if (!this.activeSession) {
      return;
    }

    const session = this.sessions.get(this.activeSession);
    if (!session) {
      return;
    }

    const action: CodegenAction = {
      toolName,
      parameters,
      timestamp: Date.now(),
      result,
    };

    session.actions.push(action);
  }

  getSession(sessionId: string): CodegenSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getActiveSession(): CodegenSession | null {
    return this.activeSession ? this.sessions.get(this.activeSession) : null;
  }

  clearSession(sessionId: string): boolean {
    if (this.activeSession === sessionId) {
      this.activeSession = null;
    }
    return this.sessions.delete(sessionId);
  }
}
