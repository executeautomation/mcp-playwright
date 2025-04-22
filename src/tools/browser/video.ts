import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import type { Page, BrowserContext } from 'playwright';
import { BrowserToolBase } from './base.js';
import { ToolContext, ToolResponse, createSuccessResponse, createErrorResponse } from '../common/types.js';

const defaultVideosPath = path.join(os.homedir(), 'Videos');

/**
 * Tool for recording videos of browser sessions
 */
export class StartVideoRecordingTool extends BrowserToolBase {
  /**
   * Execute the start video recording tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    if (!context.browser) {
      return createErrorResponse("Browser not initialized!");
    }

    try {
      // Ensure directory exists
      const outputPath = args.path || defaultVideosPath;
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Get current browser context
      const browserContext = context.page?.context() as BrowserContext;

      // Check if video recording is already active
      if ((browserContext as any)._options.recordVideo) {
        return createErrorResponse("Video recording is already active for this browser session.");
      }

      // Close current page and context to start fresh with video recording
      const url = context.page?.url() || 'about:blank';
      await context.page?.close();

      // Create new context with video recording enabled
      const newContext = await context.browser.newContext({
        recordVideo: {
          dir: outputPath,
          size: {
            width: args.width || 1280,
            height: args.height || 720
          }
        },
        viewport: {
          width: args.width || 1280,
          height: args.height || 720
        }
      });

      // Create new page
      const newPage = await newContext.newPage();
      
      // If we had a URL, navigate back to it
      if (url && url !== 'about:blank') {
        await newPage.goto(url);
      }

      // Store the new page in the global context
      const { setGlobalPage } = await import('../../toolHandler.js');
      setGlobalPage(newPage);
      
      return createSuccessResponse([
        `Video recording started. Output will be saved to: ${outputPath}`,
        `Browser viewport set to ${args.width || 1280}x${args.height || 720}`
      ]);
    } catch (error) {
      return createErrorResponse(`Failed to start video recording: ${(error as Error).message}`);
    }
  }
}

/**
 * Tool for stopping video recording
 */
export class StopVideoRecordingTool extends BrowserToolBase {
  /**
   * Execute the stop video recording tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    return this.safeExecute(context, async (page) => {
      try {
        const browserContext = page.context();
        
        // Check if video recording is active
        if (!(browserContext as any)._options.recordVideo) {
          return createErrorResponse("No active video recording found.");
        }

        // Video is saved automatically when context is closed
        // Save current URL to restore it after
        const url = page.url();
        
        // Close current context which will save the video
        await browserContext.close();
        
        // Create new context without video recording
        const newContext = await context.browser!.newContext({
          viewport: {
            width: 1280,
            height: 720
          }
        });
        
        // Create new page
        const newPage = await newContext.newPage();
        
        // Restore URL if needed
        if (url && url !== 'about:blank') {
          await newPage.goto(url);
        }
        
        // Update global page reference
        const { setGlobalPage } = await import('../../toolHandler.js');
        setGlobalPage(newPage);
        
        return createSuccessResponse([
          "Video recording stopped and saved successfully.",
          "A new browser session has been started."
        ]);
      } catch (error) {
        return createErrorResponse(`Failed to stop video recording: ${(error as Error).message}`);
      }
    });
  }
}