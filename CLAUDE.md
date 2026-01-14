# FreshBooks Speed Boost - Development Guide

## Project Overview

This Chrome extension improves the performance of FreshBooks' merchant dropdown by implementing client-side pagination. Without this extension, dropdowns with hundreds of merchants can cause significant performance issues and slow page loads.

**Key Details:**
- Extension Name: FreshBooks Speed Boost
- Manifest Version: 3
- Target Site: https://my.freshbooks.com/*
- Primary Function: Paginate merchant dropdown (50 items per page)
- Tech Stack: Vanilla JavaScript, no dependencies

## Architecture

### File Structure
```
.
├── manifest.json          # Chrome extension configuration
├── content.js            # Main content script (injected into FreshBooks pages)
├── icon16.svg            # 16x16 extension icon
├── icon48.svg            # 48x48 extension icon
├── icon128.svg           # 128x128 extension icon
└── .claude/              # Claude Code skills directory
```

### Key Components

**manifest.json**
- Defines extension metadata, permissions, and content script injection
- References external SVG icon files (Manifest V3 requirement - inline data URIs not supported)
- Runs content script at `document_end` for reliable DOM access
- Requires `scripting` and `activeTab` permissions

**icon*.svg files**
- Three SVG icons (16x16, 48x48, 128x128 pixels) for the extension
- Use FreshBooks brand color (#0075dd) with white "FB" text
- SVG format chosen for scalability and text-based editing
- Required as separate files (Chrome Manifest V3 doesn't allow inline data URI icons)

**content.js**
- Self-executing function (IIFE) to avoid global scope pollution
- Monitors for merchant dropdown elements using MutationObserver
- Implements pagination by hiding/showing DOM elements
- Dynamically injects pagination controls into dropdown UI

## Code Patterns and Conventions

### Configuration
All tunable parameters are centralized in the `CONFIG` object:
- `pageSize`: Number of items per page (default: 50)
- `checkInterval`: Polling interval for dropdown detection (default: 500ms)
- `maxChecks`: Maximum initialization attempts (default: 100)

### State Management
Global state variables track pagination state:
- `merchantCache`: Reserved for future caching implementation
- `currentPage`: Current pagination page (0-indexed)
- `allMerchants`: Array of all merchant DOM elements
- `isInitialized`: Prevents duplicate initialization
- `checkCount`: Tracks initialization attempts

### DOM Selectors
The extension targets Ember.js-generated elements:
- Merchant input: `[data-ebd-id="ember361582-trigger"]` or `.ember-power-select-typeahead-input`
- Dropdown container: `[role="listbox"]` or `.ember-power-select-dropdown`
- Dropdown items: `[role="option"]`

**Note:** Ember component IDs may change. If the extension stops working, check for updated selectors.

### Event Handling
Three event handlers on the merchant input:
1. `click` - Triggers dropdown optimization
2. `focus` - Ensures optimization on keyboard navigation
3. `input` - Resets pagination when user types to filter

All handlers use `setTimeout(fn, 100)` to allow DOM rendering before optimization.

### Pagination Implementation
The extension uses a **hide/show strategy** rather than DOM manipulation:
- All merchants remain in the DOM
- CSS `display: none` and `visibility: hidden` hide items outside current page
- Benefits: Preserves FreshBooks' event handlers and Ember state
- Trade-off: All elements still in memory (acceptable for 100-1000 items)

### UI Injection
Pagination controls are appended to the dropdown:
- Custom styled `<div>` with prev/next buttons and page info
- Uses FreshBooks brand color (#0075dd) for buttons
- Styled with inline CSS to avoid conflicts with page styles
- Removed and re-created on page change to update state

## Development Guidelines

### CRITICAL: Always Check Context7 Documentation First

**Before writing or editing ANY code, you MUST use Context7 via MCP to check current documentation and best practices.**

This project uses modern web APIs and Chrome Extension APIs that may have updated syntax, patterns, or security requirements. Always verify current standards before making changes.

**Required workflow for ANY code modification:**

1. **Identify the APIs/libraries involved** in the change
   - Chrome Extension APIs (manifest v3, content scripts, permissions)
   - Web APIs (MutationObserver, DOM manipulation, events)
   - JavaScript language features (ES6+, async/await, etc.)

2. **Query Context7 for each relevant API** using the MCP tools:
   ```
   First: mcp__context7__resolve-library-id
   Then: mcp__context7__query-docs
   ```

3. **Verify current best practices** from the documentation:
   - Chrome Manifest V3 requirements and patterns
   - Content script security and CSP considerations
   - Modern DOM API usage patterns
   - Event handling best practices

4. **Apply documented patterns** to your code changes
   - Use examples from Context7 as reference
   - Follow security guidelines from official docs
   - Implement error handling as recommended

**Example queries for this project:**
- "Chrome Extension manifest v3 content scripts best practices"
- "MutationObserver performance optimization patterns"
- "Chrome Extension CSP inline styles best practices"
- "JavaScript IIFE module pattern modern alternatives"
- "DOM event handler memory leak prevention"

**Why this is critical:**
- Chrome Extension APIs evolve rapidly (V2 → V3 migration)
- Security requirements change (CSP, permissions model)
- Modern JavaScript patterns improve performance and reliability
- Official documentation prevents deprecated API usage
- Context7 provides up-to-date, accurate code examples

**Never skip this step.** Even for "simple" changes, API details matter. A single deprecated API or security oversight can break the entire extension or create vulnerabilities.

### Making Changes

**When modifying selectors:**
1. Open FreshBooks in Chrome DevTools
2. Inspect the merchant dropdown structure
3. Look for stable attributes (`role`, `data-*` attributes preferred over classes)
4. Test with multiple merchants (create test accounts if needed)
5. Update both the input selector and dropdown selector

**When adjusting performance:**
1. Change `CONFIG.pageSize` to tune items per page
2. Adjust `CONFIG.checkInterval` if initialization is too slow/aggressive
3. Consider memory usage for large merchant lists (1000+ items)

**When adding features:**
- Keep vanilla JavaScript pattern (no dependencies)
- Use IIFE pattern to avoid polluting global scope
- Add configuration to `CONFIG` object
- Maintain existing code style (ES6+, descriptive function names)

### Styling Guidelines

All styles are inline CSS to avoid:
- Conflicts with FreshBooks' stylesheets
- CSP (Content Security Policy) issues
- External file dependencies

**Color Palette:**
- Primary: `#0075dd` (FreshBooks blue)
- Text: `#666` (muted gray)
- Background: `#f9f9f9` (light gray)
- Border: `#ddd` (light border)

### Debugging

**Console logging:**
- Extension uses `[FreshBooks Speed Boost]` prefix for all logs
- Enable verbose logging in `content.js` if needed
- Check Chrome DevTools Console on FreshBooks pages

**Common issues:**
1. **Dropdown not detected**: Ember selectors changed (check DevTools)
2. **Pagination appears but doesn't work**: Event handlers not attaching (check timing)
3. **Items flicker**: Timing issue with `setTimeout` delays (adjust delays)
4. **Extension doesn't load**: Check manifest.json syntax and permissions

**Testing:**
1. Load unpacked extension in Chrome: `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked" and select extension directory
4. Navigate to FreshBooks and test merchant dropdown
5. Check Console for initialization messages

## FreshBooks-Specific Considerations

### Ember.js Integration
FreshBooks uses Ember.js, which:
- Generates dynamic element IDs (may change between releases)
- Uses Ember Power Select component for dropdowns
- Manages its own event handlers and state

**Best practices:**
- Use semantic HTML attributes (`role`, `aria-*`) over Ember-generated classes
- Don't remove or modify Ember's DOM elements, only hide/show them
- Wait for Ember rendering with `setTimeout` before DOM manipulation

### Performance Characteristics
- Merchant lists can range from 10 to 1000+ items
- Original dropdown renders all items, causing 2-5 second delays
- Pagination reduces visible items, improving render time to <200ms
- MutationObserver has minimal overhead when dropdown is closed

### Update Strategy
FreshBooks updates may break the extension:
1. Monitor for console errors on FreshBooks pages
2. Inspect dropdown structure for selector changes
3. Update selectors in `content.js`
4. Increment version in `manifest.json`
5. Reload extension in Chrome

## Installation and Distribution

**Local Development:**
```bash
# No build step required - load directly in Chrome
chrome://extensions/ → Load unpacked → Select this directory
```

**Distribution:**
- Package as .zip for Chrome Web Store
- Include manifest.json, content.js, and icon*.svg files
- No external resources or build artifacts needed

**Chrome Web Store Requirements:**
- Manifest V3 compliant (already using)
- Clear description of functionality
- Privacy policy (extension doesn't collect data)
- Screenshots showing before/after performance

## Future Enhancements

**Potential improvements:**
- Virtual scrolling instead of hide/show pagination
- Configurable page size via extension options page
- Keyboard shortcuts for page navigation (Ctrl+Left/Right)
- Performance metrics tracking (load time improvements)
- Support for other slow FreshBooks dropdowns
- IndexedDB caching of merchant list

**Not recommended:**
- External dependencies (keeps extension lightweight)
- Complex state management (vanilla JS is sufficient)
- Background service worker (not needed for current functionality)

## Technical Constraints

**Chrome Extension Limitations:**
- Cannot modify FreshBooks' original code
- Must work with dynamically generated Ember DOM
- Limited to content script permissions (no direct API access)
- Must respect FreshBooks' CSP policies

**Performance Targets:**
- Dropdown should open in <200ms after optimization
- Pagination UI should render in <50ms
- Memory overhead should be <5MB for 1000 merchants
- No noticeable impact on FreshBooks' other functionality

## Code Style

- ES6+ JavaScript (arrow functions, const/let, template literals)
- 2-space indentation
- Single quotes for strings
- Descriptive function names (`initializePagination`, not `init`)
- JSDoc-style comments for functions
- Console logging with extension prefix
- Avoid abbreviations in variable names (except standard ones like `idx`, `btn`)

## Questions and Support

When working on this extension:
- **ALWAYS use Context7 MCP tools first** to verify API documentation and best practices
- Check FreshBooks UI first (it may have changed)
- Test with varying merchant counts (10, 50, 100, 500+ items)
- Verify pagination UI doesn't break FreshBooks' styling
- Ensure search/filter functionality still works
- Test on multiple screen sizes (pagination UI responsive)

**Remember:** Documentation lookup via Context7 is not optional. It ensures code quality, security, and compatibility with current web standards.
