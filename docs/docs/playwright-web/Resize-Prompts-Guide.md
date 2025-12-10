# Prompt Guide: Using playwright_resize

This guide shows you how to ask AI assistants (Claude Desktop, VS Code Copilot, etc.) to resize the browser viewport using natural language.

## 📱 Basic Device Testing Prompts

### Mobile Devices

**Simple iPhone Testing:**
```
Test this page on iPhone 13
```
```
Switch to iPhone 14 view
```
```
Show me how this looks on iPhone SE
```

**With Orientation:**
```
Test on iPhone 13 in landscape mode
```
```
Rotate to landscape orientation on iPhone 15
```
```
Switch iPhone to portrait mode
```

### Tablet Devices

**iPad Testing:**
```
Test this on iPad Pro 11
```
```
Show me the tablet view using iPad Air
```
```
Switch to iPad Pro 12.9 in landscape
```

**Android Tablets:**
```
Test on Galaxy Tab S4
```
```
Show tablet view on Pixel Tablet
```

### Android Phones

**Popular Android Devices:**
```
Test on Pixel 7
```
```
Show me this on Galaxy S24
```
```
Switch to Pixel 5 view
```
```
Test on Galaxy S9+ in landscape
```

### Desktop Browsers

**Desktop Testing:**
```
Test in Desktop Chrome
```
```
Switch to Desktop Firefox
```
```
Show desktop Safari view
```
```
Test at full desktop resolution
```

## 🎯 Responsive Testing Workflows

### Progressive Testing (Mobile to Desktop)

**AI Prompt:**
```
Test this page's responsiveness:
1. Start with mobile (iPhone 13)
2. Then tablet (iPad Pro 11)
3. Finally desktop (Desktop Chrome)

Take screenshots at each size and check if the layout looks correct.
```

**What the AI will do:**
```javascript
// The AI executes:
await playwright_navigate({ url: "https://example.com" });
await playwright_resize({ device: "iPhone 13" });
await playwright_screenshot({ name: "mobile-view" });

await playwright_resize({ device: "iPad Pro 11" });
await playwright_screenshot({ name: "tablet-view" });

await playwright_resize({ device: "Desktop Chrome" });
await playwright_screenshot({ name: "desktop-view" });
```

### Cross-Device Comparison

**AI Prompt:**
```
Compare how the navigation menu looks on:
- iPhone 13
- iPad Pro 11  
- Desktop Chrome

Take screenshots and tell me if there are any layout issues.
```

### Orientation Testing

**AI Prompt:**
```
Test the page in both portrait and landscape on iPhone 14:
1. Portrait mode first
2. Then landscape mode
Check if content reflows properly.
```

## 🔄 Context-Aware Prompts

### After Navigation

**AI Prompt:**
```
Navigate to https://example.com and test it on iPhone 13
```

**AI Executes:**
```javascript
await playwright_navigate({ url: "https://example.com" });
await playwright_resize({ device: "iPhone 13" });
```

### During Testing

**You:** _"The button looks too small"_

**AI Prompt:**
```
Can you switch to iPhone SE (smaller screen) and check if the button is still clickable?
```

### Quick Device Switch

**AI Prompt:**
```
Switch to Pixel 7
```
```
Try this on Galaxy S24 instead
```
```
Show me desktop view
```

## 📐 Manual Dimensions Prompts

### Custom Sizes

**AI Prompt:**
```
Resize to 1024x768
```
```
Set viewport to 800x600
```
```
Test at 1366x768 resolution
```

### Specific Use Cases

**AI Prompt:**
```
Test at small tablet size: 768x1024
```
```
Show me the mobile breakpoint: 375x667
```
```
Resize to standard HD: 1920x1080
```

## 🎨 Advanced Testing Scenarios

### A/B Device Comparison

**AI Prompt:**
```
Compare the homepage hero section on iPhone 13 vs Galaxy S24.
Take screenshots of both and tell me which one displays the text better.
```

### Responsive Breakpoint Testing

**AI Prompt:**
```
Test the page at these breakpoints:
1. Mobile: iPhone 13
2. Small tablet: iPad Mini
3. Large tablet: iPad Pro 12.9
4. Desktop: Desktop Chrome

Check if the grid layout changes correctly at each breakpoint.
```

### Form Testing Across Devices

**AI Prompt:**
```
Fill out the contact form on iPhone 13, then switch to iPad and verify 
the form data persists. Check if the form looks good on both devices.
```

### Navigation Testing

**AI Prompt:**
```
Test the mobile menu:
1. Load the page on iPhone 13
2. Click the hamburger menu
3. Switch to Desktop Chrome
4. Verify the menu becomes a full navigation bar
```

## 💡 Natural Language Patterns

### Device Requests

✅ **Good Prompts:**
- "Test on iPhone 13"
- "Switch to iPad view"
- "Show me mobile version"
- "Try Galaxy S24"
- "Go to desktop view"

❌ **Less Clear Prompts:**
- "Make it smaller" (ambiguous)
- "Phone view" (which phone?)
- "Resize" (to what?)

### Orientation Requests

✅ **Good Prompts:**
- "Rotate to landscape"
- "Switch to landscape mode"
- "Turn the phone sideways"
- "Portrait orientation"

### Combining Actions

✅ **Good Prompts:**
- "Navigate to example.com and test on iPhone 13"
- "Switch to iPad and take a screenshot"
- "Resize to Galaxy S24 in landscape and scroll down"

## 🎓 Example Conversations

### Scenario 1: Responsive Web Design Testing

**You:** "I need to test if my website's navigation menu works on different devices"

**AI Response:** "I'll test the navigation menu across different device sizes. Let me start with mobile..."

```javascript
await playwright_navigate({ url: "your-site.com" });
await playwright_resize({ device: "iPhone 13" });
// AI tests menu functionality
```

**You:** "Now try on a tablet"

**AI Response:** "Switching to iPad Pro 11..."

```javascript
await playwright_resize({ device: "iPad Pro 11" });
```

### Scenario 2: Bug Investigation

**You:** "A user reported the checkout button is hidden on their phone"

**AI Response:** "Let me test on common mobile devices to reproduce the issue..."

```javascript
await playwright_navigate({ url: "your-site.com/checkout" });
await playwright_resize({ device: "iPhone 13" });
await playwright_screenshot({ name: "checkout-iphone13" });
await playwright_resize({ device: "iPhone SE" });
await playwright_screenshot({ name: "checkout-iphoneSE" });
```

### Scenario 3: Cross-Browser Testing

**You:** "Test the page on different desktop browsers"

**AI Response:** "I'll test across desktop browsers..."

```javascript
await playwright_resize({ device: "Desktop Chrome" });
await playwright_screenshot({ name: "chrome-view" });
await playwright_resize({ device: "Desktop Firefox" });
await playwright_screenshot({ name: "firefox-view" });
await playwright_resize({ device: "Desktop Safari" });
await playwright_screenshot({ name: "safari-view" });
```

## 🔍 Device Discovery Prompts

### Finding Available Devices

**AI Prompt:**
```
What iPhone models can I test on?
```

**AI Response:** "You can test on: iPhone 13, iPhone 14, iPhone 15, iPhone 13 Pro, iPhone SE, iPhone X, iPhone 11, and more. Would you like me to list all available iPhones?"

**AI Prompt:**
```
Show me all available Android devices
```

**AI Prompt:**
```
What desktop browser options do I have?
```

### Device Recommendations

**AI Prompt:**
```
Which device should I test for mobile users?
```

**AI Response:** "For comprehensive mobile testing, I recommend:
- iPhone 13 (most popular iOS)
- Galaxy S24 (latest Android flagship)
- Pixel 7 (stock Android experience)
- iPhone SE (smaller screen testing)"

## 📋 Quick Reference

### Most Common Prompts

| What You Want | Just Say |
|---------------|----------|
| Test mobile | "Test on iPhone 13" |
| Test tablet | "Switch to iPad Pro 11" |
| Test desktop | "Show desktop view" or "Desktop Chrome" |
| Rotate device | "Switch to landscape" |
| Custom size | "Resize to 1024x768" |
| Compare devices | "Compare iPhone 13 and Galaxy S24" |

### Device Categories

| Category | Example Prompt |
|----------|----------------|
| iOS Phones | "iPhone 13", "iPhone SE", "iPhone 15" |
| iOS Tablets | "iPad Pro 11", "iPad Air", "iPad Mini" |
| Android Phones | "Pixel 7", "Galaxy S24", "Galaxy S9+" |
| Android Tablets | "Galaxy Tab S4", "Pixel Tablet" |
| Desktop | "Desktop Chrome", "Desktop Firefox", "Desktop Safari" |

## 🎯 Best Practices

### 1. Be Specific
✅ "Test on iPhone 13"
❌ "Test on iPhone" (which model?)

### 2. Combine with Actions
✅ "Navigate to example.com and test on iPad"
✅ "Switch to iPhone 13 and scroll to footer"

### 3. Request Screenshots
✅ "Test on Galaxy S24 and take a screenshot"
✅ "Show me how it looks on iPhone SE (screenshot)"

### 4. Test Edge Cases
✅ "Test on iPhone SE (smallest screen)"
✅ "Test on iPad Pro 12.9 (largest tablet)"

### 5. Use Natural Language
✅ "Rotate the phone"
✅ "Switch to tablet view"
✅ "Show me desktop version"

---

## 🚀 Getting Started

**New to testing? Start with these prompts:**

1. **Basic mobile test:**
   ```
   Navigate to [your-site.com] and test on iPhone 13
   ```

2. **Responsive test:**
   ```
   Test [your-site.com] on iPhone 13, iPad Pro 11, and Desktop Chrome
   ```

3. **Orientation test:**
   ```
   Test [your-site.com] on iPhone 13 in both portrait and landscape
   ```

The AI assistant will automatically use `playwright_resize` with the appropriate device parameters!
