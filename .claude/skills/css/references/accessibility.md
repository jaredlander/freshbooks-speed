# CSS Accessibility Best Practices

Making web content accessible through CSS following WCAG guidelines.

## Color and Contrast

### Minimum Contrast Requirements

**WCAG 2.1 Level AA:**
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+/14pt+ bold): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**WCAG 2.1 Level AAA:**
- Normal text: 7:1 contrast ratio
- Large text: 4.5:1 contrast ratio

```css
/* Good contrast examples */
.text-dark {
  color: #1a1a1a; /* Dark gray */
  background: #ffffff; /* White - 16.1:1 ratio */
}

.text-light {
  color: #ffffff; /* White */
  background: #0066cc; /* Blue - 4.6:1 ratio */
}

/* Bad contrast ❌ */
.poor-contrast {
  color: #999999; /* Gray */
  background: #cccccc; /* Light gray - 2.8:1 ratio */
}
```

### Using color-contrast() (Experimental)

```css
.auto-contrast {
  --bg: #0066cc;
  background: var(--bg);
  
  /* Automatically choose black or white for best contrast */
  color: color-contrast(var(--bg) vs black, white);
}
```

### Never Rely on Color Alone

```css
/* ❌ Bad: Only uses color */
.error {
  color: red;
}

/* ✅ Good: Uses color + icon + text */
.error {
  color: #c00;
  padding-left: 2rem;
  position: relative;
}

.error::before {
  content: '⚠️'; /* Icon indicator */
  position: absolute;
  left: 0.5rem;
}

/* ✅ Good: Uses color + border + pattern */
.required {
  border-left: 3px solid red;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 0, 0, 0.1) 10px,
    rgba(255, 0, 0, 0.1) 20px
  );
}
```

## Focus Indicators

### Visible Focus States

```css
/* ❌ Never do this */
button:focus {
  outline: none;
}

/* ✅ Custom focus indicator */
button {
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ✅ Enhanced focus for better visibility */
.button:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px rgba(0, 102, 204, 0.2);
}
```

### Focus-Visible Pattern

```css
/* Remove focus ring for mouse/touch */
button:focus {
  outline: none;
}

/* Show focus ring for keyboard only */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Ensure focus is always visible on interactive elements */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--focus-ring-color, #0066cc);
  outline-offset: 2px;
}
```

### Skip Links

```css
/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Text Readability

### Optimal Line Length

```css
/* Aim for 50-75 characters per line */
.readable-text {
  max-width: 65ch; /* ch = width of '0' character */
}

.narrow-column {
  max-width: 50ch;
}

.wide-column {
  max-width: 75ch;
}
```

### Line Height

```css
/* Minimum 1.5 for body text (WCAG 2.1) */
body {
  line-height: 1.5;
}

h1, h2, h3 {
  line-height: 1.2; /* Headings can be tighter */
}

.small-text {
  font-size: 0.875rem;
  line-height: 1.6; /* Smaller text needs more line height */
}
```

### Text Spacing

```css
/* WCAG 2.1 SC 1.4.12 */
.readable {
  line-height: 1.5;
  letter-spacing: 0.12em;
  word-spacing: 0.16em;
}

p {
  margin-bottom: 1.5em; /* Space between paragraphs */
}
```

### Responsive Text Sizing

```css
/* Never less than 16px */
body {
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
}

/* Respect user's browser font size settings */
html {
  font-size: 100%; /* Don't set fixed pixel size */
}
```

## Reduced Motion

### Respecting User Preferences

```css
/* Default animations */
.animated {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Disable for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Alternative: Subtle motion instead of none */
@media (prefers-reduced-motion: reduce) {
  .animated {
    transition: opacity 0.1s ease; /* Keep opacity, remove movement */
  }
}
```

### Safe Animations

```css
/* Avoid rapid flashing (seizure risk) */
.safe-animation {
  /* Never flash more than 3 times per second */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; } /* Subtle change */
}

/* ❌ Dangerous: Could trigger seizures */
@keyframes dangerous-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
  animation: dangerous-flash 0.2s infinite; /* Too fast */
}
```

## High Contrast Mode

### Windows High Contrast

```css
/* Ensure borders are visible */
.card {
  border: 1px solid transparent; /* Visible in high contrast */
  outline: 1px solid transparent;
}

/* Use system colors */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid currentColor;
  }
  
  /* Enhance focus indicators */
  :focus-visible {
    outline: 3px solid;
    outline-offset: 3px;
  }
}

/* Forced colors mode */
@media (forced-colors: active) {
  .custom-checkbox {
    /* Use system colors instead of custom colors */
    border: 1px solid CanvasText;
    background: Canvas;
  }
  
  .custom-checkbox:checked {
    background: Highlight;
    border-color: Highlight;
  }
}
```

## Screen Reader Considerations

### Visually Hidden but Screen Reader Accessible

```css
.sr-only,
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Show on focus for keyboard users */
.sr-only:focus,
.visually-hidden:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Decorative Images

```css
/* Hide decorative content from screen readers */
.decorative {
  /* Use aria-hidden="true" in HTML */
  /* No CSS needed, but ensure it's truly decorative */
}

/* Background images are already hidden from screen readers */
.hero {
  background-image: url('decorative.jpg');
}
```

## Touch Target Size

### Minimum Touch Targets

```css
/* WCAG 2.1 SC 2.5.5: Minimum 44x44 CSS pixels */
.button,
.link {
  min-height: 44px;
  min-width: 44px;
  
  /* Or use padding to achieve size */
  padding: 12px 16px;
}

/* Increase hit area without visible size */
.small-button {
  position: relative;
}

.small-button::before {
  content: '';
  position: absolute;
  top: -8px;
  right: -8px;
  bottom: -8px;
  left: -8px;
}

/* Ensure spacing between targets */
.button-group {
  display: flex;
  gap: 8px; /* Minimum 8px spacing */
}
```

## Form Accessibility

### Focus Styling for Inputs

```css
input,
textarea,
select {
  border: 2px solid #ccc;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Error states */
input:invalid,
input[aria-invalid="true"] {
  border-color: #c00;
}

input:invalid:focus,
input[aria-invalid="true"]:focus {
  outline-color: #c00;
}
```

### Label Visibility

```css
/* ✅ Always visible labels */
label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* ❌ Don't rely on placeholder alone */
input::placeholder {
  opacity: 0.6; /* Placeholders should be hints, not labels */
}
```

### Disabled States

```css
/* Clear visual indication */
button:disabled,
input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Ensure sufficient contrast even when disabled */
button:disabled {
  color: #666;
  background: #e5e5e5;
  border-color: #999;
}
```

## Tables

### Accessible Table Styling

```css
/* Clear table structure */
table {
  border-collapse: collapse;
  width: 100%;
}

th {
  text-align: left;
  font-weight: 600;
  background: #f5f5f5;
  padding: 12px;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

/* Zebra striping for easier scanning */
tbody tr:nth-child(even) {
  background: #f9f9f9;
}

/* Hover state for rows */
tbody tr:hover {
  background: #f0f0f0;
}

/* Responsive tables */
@media (max-width: 768px) {
  table {
    display: block;
    overflow-x: auto;
  }
}
```

## Dark Mode Accessibility

### Maintaining Contrast in Dark Mode

```css
:root {
  --text: #1a1a1a;
  --background: #ffffff;
  --border: #e0e0e0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #e5e5e5; /* Light text */
    --background: #1a1a1a; /* Dark background */
    --border: #404040; /* Lighter border for visibility */
  }
  
  /* Adjust images in dark mode */
  img {
    opacity: 0.9;
  }
}

/* Manual dark mode toggle */
[data-theme="dark"] {
  --text: #e5e5e5;
  --background: #1a1a1a;
  --border: #404040;
}
```

## Print Accessibility

```css
@media print {
  /* High contrast for printing */
  body {
    color: #000;
    background: #fff;
  }
  
  /* Show link URLs */
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
  }
  
  /* Avoid breaking inside elements */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
  
  /* Expand abbreviated content */
  abbr[title]::after {
    content: " (" attr(title) ")";
  }
}
```

## Testing Checklist

- [ ] Minimum 4.5:1 contrast for text
- [ ] Visible focus indicators on all interactive elements
- [ ] No reliance on color alone for information
- [ ] Respect prefers-reduced-motion
- [ ] Respect prefers-contrast
- [ ] Touch targets minimum 44x44px
- [ ] Line height minimum 1.5 for body text
- [ ] Text can resize up to 200% without loss of content
- [ ] Content readable without horizontal scrolling
- [ ] Skip links for keyboard navigation
- [ ] Form labels always visible
- [ ] Error messages have sufficient contrast
- [ ] Works with screen reader (test with actual screen reader)
- [ ] Works with Windows High Contrast mode
- [ ] Works with browser zoom at 200%

## Accessibility Testing Tools

- **Browser DevTools**: Lighthouse accessibility audit
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Screen readers**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- **Color contrast checkers**: WebAIM Contrast Checker, Color Oracle
- **context7**: Search for "WCAG [criteria]" for specific guidelines

## Resources

- WCAG 2.1 Guidelines (via context7)
- MDN Accessibility (via context7)
- WebAIM articles (via context7)
- A11y Project
- Inclusive Components patterns
