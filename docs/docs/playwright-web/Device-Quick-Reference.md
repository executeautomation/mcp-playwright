# Device Testing Quick Reference

## 🎯 Quick Commands

### Just Tell the AI:

| What You Want | Natural Language Prompt |
|---------------|------------------------|
| 📱 iPhone | "Test on iPhone 13" |
| 📱 iPhone Landscape | "Switch to iPhone 13 landscape" |
| 📱 Android | "Test on Pixel 7" |
| 📱 Samsung | "Switch to Galaxy S24" |
| 📱 Tablet | "Test on iPad Pro 11" |
| 💻 Desktop | "Show desktop view" or "Desktop Chrome" |
| 🔄 Rotate | "Rotate to landscape" |
| 📏 Custom | "Resize to 1024x768" |

## 📱 Popular Device Presets

### iOS Devices

```
iPhone SE (smallest) - 375×667
iPhone 13 (popular)  - 390×844  ⭐ Most tested
iPhone 14            - 390×844
iPhone 15            - 393×852
iPhone 15 Pro Max    - 430×932  (largest iPhone)
```

### iPad Devices

```
iPad Mini            - 768×1024
iPad Air             - 820×1180
iPad Pro 11          - 834×1194  ⭐ Popular tablet
iPad Pro 12.9        - 1024×1366 (largest iPad)
```

### Android Phones

```
Pixel 5              - 393×851
Pixel 7              - 412×915   ⭐ Stock Android
Galaxy S9+           - 360×740
Galaxy S24           - 360×780   ⭐ Latest Samsung
```

### Desktop

```
Desktop Chrome       - 1280×720  ⭐ Most common
Desktop Firefox      - 1280×720
Desktop Safari       - 1280×720
```

## 💬 Example Prompts for VS Code / Claude

### Testing a Single Device

**You say:**
```
"Navigate to my-site.com and test on iPhone 13"
```

**AI understands:**
```javascript
await playwright_navigate({ url: "my-site.com" });
await playwright_resize({ device: "iPhone 13" });
```

---

### Testing Multiple Devices

**You say:**
```
"Test the homepage on iPhone 13, iPad Pro, and Desktop Chrome. 
Take screenshots of each."
```

**AI understands:**
```javascript
await playwright_navigate({ url: "homepage" });

await playwright_resize({ device: "iPhone 13" });
await playwright_screenshot({ name: "mobile" });

await playwright_resize({ device: "iPad Pro 11" });
await playwright_screenshot({ name: "tablet" });

await playwright_resize({ device: "Desktop Chrome" });
await playwright_screenshot({ name: "desktop" });
```

---

### Orientation Testing

**You say:**
```
"Test the menu on iPhone 13 in both portrait and landscape"
```

**AI understands:**
```javascript
await playwright_resize({ device: "iPhone 13" });
// Test portrait menu

await playwright_resize({ 
  device: "iPhone 13", 
  orientation: "landscape" 
});
// Test landscape menu
```

---

### Custom Dimensions

**You say:**
```
"Resize to 1024x768 and test the layout"
```

**AI understands:**
```javascript
await playwright_resize({ width: 1024, height: 768 });
```

---

### Debugging Device-Specific Issues

**You say:**
```
"The button is broken on mobile. Test on iPhone SE (small screen), 
iPhone 13 (medium), and iPhone 15 Pro Max (large)"
```

**AI understands:**
```javascript
await playwright_resize({ device: "iPhone SE" });
// Check button

await playwright_resize({ device: "iPhone 13" });
// Check button

await playwright_resize({ device: "iPhone 15 Pro Max" });
// Check button
```

## 🎨 Testing Workflows

### Responsive Design Testing

**Workflow 1: Mobile-First**
```
"Start mobile (iPhone 13), then tablet (iPad), then desktop"
```

**Workflow 2: Edge Cases**
```
"Test on the smallest (iPhone SE) and largest (iPad Pro 12.9) screens"
```

**Workflow 3: Cross-Platform**
```
"Compare iPhone 13 vs Galaxy S24 vs Pixel 7"
```

### Form Testing

**You say:**
```
"Fill the signup form on iPhone 13, then switch to desktop and 
verify everything still looks good"
```

### Navigation Testing

**You say:**
```
"Test the mobile menu hamburger on iPhone 13, then switch to 
desktop and verify it becomes a full navigation bar"
```

## 🔍 Finding Devices

**To see all devices:**
```bash
node scripts/list-devices.cjs
```

**To filter devices:**
```bash
node scripts/list-devices.cjs iphone
node scripts/list-devices.cjs pixel
node scripts/list-devices.cjs ipad
node scripts/list-devices.cjs galaxy
```

**Ask the AI:**
```
"What iPhone models can I test?"
"Show me all Android devices"
"What are the desktop browser options?"
```

## 📊 Recommended Test Matrix

### Minimum Coverage (3 devices)
```
✅ iPhone 13        (iOS mobile)
✅ iPad Pro 11      (Tablet)
✅ Desktop Chrome   (Desktop)
```

### Good Coverage (5 devices)
```
✅ iPhone 13        (iOS mobile)
✅ iPhone SE        (Small iOS)
✅ Galaxy S24       (Android mobile)
✅ iPad Pro 11      (Tablet)
✅ Desktop Chrome   (Desktop)
```

### Excellent Coverage (8 devices)
```
✅ iPhone SE        (Smallest iOS)
✅ iPhone 13        (Standard iOS)
✅ iPhone 15 Pro Max (Largest iOS)
✅ Pixel 7          (Standard Android)
✅ Galaxy S24       (Samsung flagship)
✅ iPad Air         (Standard tablet)
✅ iPad Pro 12.9    (Large tablet)
✅ Desktop Chrome   (Desktop)
```

## 🎯 Common Scenarios

### Scenario 1: "My mobile menu is broken"

**You:** "Test the mobile menu on iPhone 13"

**AI will:**
1. Resize to iPhone 13
2. Test menu functionality
3. Report issues

---

### Scenario 2: "Layout breaks on tablets"

**You:** "Test on iPad Pro 11 and iPad Mini, take screenshots"

**AI will:**
1. Test on iPad Pro 11 → screenshot
2. Test on iPad Mini → screenshot
3. Compare layouts

---

### Scenario 3: "Need full responsive test"

**You:** "Test mobile, tablet, desktop responsiveness with screenshots"

**AI will:**
1. iPhone 13 → screenshot
2. iPad Pro 11 → screenshot
3. Desktop Chrome → screenshot
4. Report on layout changes

---

### Scenario 4: "Button too small on small screens"

**You:** "Test the checkout button on iPhone SE and iPhone 13"

**AI will:**
1. Test on iPhone SE (smallest)
2. Test on iPhone 13 (standard)
3. Compare button sizes

## 💡 Pro Tips

### 1. Always Specify Device Model
❌ "Test on iPhone" (which one?)
✅ "Test on iPhone 13" (specific)

### 2. Use Real Device Names
✅ "iPhone 13", "Galaxy S24", "Pixel 7"
❌ "Modern phone", "Latest Android"

### 3. Request Screenshots
✅ "Test on iPad and take a screenshot"
✅ "Show me mobile view (screenshot)"

### 4. Test Orientations
✅ "Test in both portrait and landscape"
✅ "Rotate to landscape on iPhone 13"

### 5. Test Edge Cases
✅ "Test on iPhone SE (small) and iPad Pro 12.9 (large)"

## 🚀 Getting Started Checklist

- [ ] Navigate to your site
- [ ] Test on iPhone 13 (most common mobile)
- [ ] Test on iPad Pro 11 (common tablet)
- [ ] Test on Desktop Chrome (desktop)
- [ ] Request screenshots of each
- [ ] Test landscape orientation on mobile
- [ ] Test on smallest device (iPhone SE)
- [ ] Test on largest tablet (iPad Pro 12.9)

## 📖 More Information

- **Full Device List:** Run `node scripts/list-devices.cjs`
- **Detailed Prompts:** See `Resize-Prompts-Guide.md`
- **Tool Documentation:** See `Supported-Tools.mdx`

---

**Remember:** Just use natural language! The AI will translate your intent into the correct `playwright_resize` commands automatically. 🎉
