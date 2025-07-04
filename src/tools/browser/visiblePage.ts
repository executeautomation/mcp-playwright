import { resetBrowserState } from "../../toolHandler.js";
import { ToolContext, ToolResponse, createErrorResponse, createSuccessResponse } from "../common/types.js";
import { BrowserToolBase } from "./base.js";

/**
 * Tool for getting the visible text content of the current page
 */
export class VisibleTextTool extends BrowserToolBase {
  /**
   * Execute the visible text page tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    // Check if browser is available
    if (!context.browser || !context.browser.isConnected()) {
      // If browser is not connected, we need to reset the state to force recreation
      resetBrowserState();
      return createErrorResponse(
        "Browser is not connected. The connection has been reset - please retry your navigation."
      );
    }

    // Check if page is available and not closed
    if (!context.page || context.page.isClosed()) {
      return createErrorResponse(
        "Page is not available or has been closed. Please retry your navigation."
      );
    }
    return this.safeExecute(context, async (page) => {
      try {
        const visibleText = await page!.evaluate(() => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: (node) => {
                const style = window.getComputedStyle(node.parentElement!);
                return (style.display !== "none" && style.visibility !== "hidden")
                  ? NodeFilter.FILTER_ACCEPT
                  : NodeFilter.FILTER_REJECT;
              },
            }
          );
          let text = "";
          let node;
          while ((node = walker.nextNode())) {
            const trimmedText = node.textContent?.trim();
            if (trimmedText) {
              text += trimmedText + "\n";
            }
          }
          return text.trim();
        });
        // Truncate logic
        const maxLength = typeof args.maxLength === 'number' ? args.maxLength : 20000;
        let output = visibleText;
        let truncated = false;
        if (output.length > maxLength) {
          output = output.slice(0, maxLength) + '\n[Output truncated due to size limits]';
          truncated = true;
        }
        return createSuccessResponse(`Visible text content:\n${output}`);
      } catch (error) {
        return createErrorResponse(`Failed to get visible text content: ${(error as Error).message}`);
      }
    });
  }
}

/**
 * Tool for getting the visible HTML content of the current page
 */
export class VisibleHtmlTool extends BrowserToolBase {
  /**
   * Execute the visible HTML page tool
   */
  async execute(args: any, context: ToolContext): Promise<ToolResponse> {
    // Check if browser is available
    if (!context.browser || !context.browser.isConnected()) {
      // If browser is not connected, we need to reset the state to force recreation
      resetBrowserState();
      return createErrorResponse(
        "Browser is not connected. The connection has been reset - please retry your navigation."
      );
    }

    // Check if page is available and not closed
    if (!context.page || context.page.isClosed()) {
      return createErrorResponse(
        "Page is not available or has been closed. Please retry your navigation."
      );
    }
    return this.safeExecute(context, async (page) => {
      try {
        const { selector, removeComments, removeStyles, removeMeta, minify, cleanHtml } = args;
        // Default removeScripts to true unless explicitly set to false
        const removeScripts = args.removeScripts === false ? false : true;

        // Get the HTML content
        let htmlContent: string;

        if (selector) {
          // If a selector is provided, get only the HTML for that element
          const element = await page.$(selector);
          if (!element) {
            return createErrorResponse(`Element with selector "${selector}" not found`);
          }
          htmlContent = await page.evaluate((el) => el.outerHTML, element);
        } else {
          // Otherwise get the full page HTML
          htmlContent = await page.content();
        }

        // Determine if we need to apply filters
        const shouldRemoveScripts = removeScripts || cleanHtml;
        const shouldRemoveComments = removeComments || cleanHtml;
        const shouldRemoveStyles = removeStyles || cleanHtml;
        const shouldRemoveMeta = removeMeta || cleanHtml;

        // Apply filters in the browser context
        if (shouldRemoveScripts || shouldRemoveComments || shouldRemoveStyles || shouldRemoveMeta || minify) {
          htmlContent = await page.evaluate(
            ({ html, removeScripts, removeComments, removeStyles, removeMeta, minify }) => {
              // Create a DOM parser to work with the HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');

              // Remove script tags if requested
              if (removeScripts) {
                const scripts = doc.querySelectorAll('script');
                scripts.forEach(script => script.remove());
              }

              // Remove style tags if requested
              if (removeStyles) {
                const styles = doc.querySelectorAll('style');
                styles.forEach(style => style.remove());
              }

              // Remove meta tags if requested
              if (removeMeta) {
                const metaTags = doc.querySelectorAll('meta');
                metaTags.forEach(meta => meta.remove());
              }

              // Remove HTML comments if requested
              if (removeComments) {
                const removeComments = (node) => {
                  const childNodes = node.childNodes;
                  for (let i = childNodes.length - 1; i >= 0; i--) {
                    const child = childNodes[i];
                    if (child.nodeType === 8) { // 8 is for comment nodes
                      node.removeChild(child);
                    } else if (child.nodeType === 1) { // 1 is for element nodes
                      removeComments(child);
                    }
                  }
                };
                removeComments(doc.documentElement);
              }

              // Get the processed HTML
              let result = doc.documentElement.outerHTML;

              // Minify if requested
              if (minify) {
                // Simple minification: remove extra whitespace
                result = result.replace(/>\s+</g, '><').trim();
              }

              return result;
            },
            {
              html: htmlContent,
              removeScripts: shouldRemoveScripts,
              removeComments: shouldRemoveComments,
              removeStyles: shouldRemoveStyles,
              removeMeta: shouldRemoveMeta,
              minify
            }
          );
        }

        // Truncate logic
        const maxLength = typeof args.maxLength === 'number' ? args.maxLength : 20000;
        let output = htmlContent;
        if (output.length > maxLength) {
          output = output.slice(0, maxLength) + '\n<!-- Output truncated due to size limits -->';
        }
        return createSuccessResponse(`HTML content:\n${output}`);
      } catch (error) {
        return createErrorResponse(`Failed to get visible HTML content: ${(error as Error).message}`);
      }
    });
  }
}