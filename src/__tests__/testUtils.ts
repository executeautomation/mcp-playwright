type ToolContent = { type: string; text?: string };

/**
 * Extracts text content from a tool response while guarding against
 * non-text entries (e.g., future image or resource results).
 */
export function getTextContent(
  result: { content?: ToolContent[] },
  index = 0
): string {
  const entry = result.content?.[index] as ToolContent | undefined;
  if (!entry) {
    throw new Error(`No content found at index ${index}`);
  }
  if (entry.type !== "text" || typeof entry.text !== "string") {
    throw new Error(
      `Expected text content at index ${index} but received ${entry.type ?? "unknown"}`
    );
  }
  return entry.text;
}
