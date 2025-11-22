export * from "./api/index.js";
export * from "./browser/index.js";
export * from "./common/types.js";

// Tool type constants
export const BROWSER_TOOLS = [
  "playwright_navigate",
  "playwright_screenshot",
  "playwright_click",
  "playwright_iframe_click",
  "playwright_iframe_fill",
  "playwright_fill",
  "playwright_select",
  "playwright_hover",
  "playwright_evaluate",
  "playwright_console_logs",
  "playwright_close",
  "playwright_get_visible_text",
  "playwright_get_visible_html",
];

export const API_TOOLS = [
  "playwright_get",
  "playwright_post",
  "playwright_put",
  "playwright_patch",
  "playwright_delete",
];
