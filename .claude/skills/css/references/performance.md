# CSS Performance Optimization

Comprehensive guide to writing performant CSS that renders quickly and smoothly.

## Understanding the Rendering Pipeline

1. **Parse HTML** → DOM tree
2. **Parse CSS** → CSSOM tree
3. **Combine** → Render tree
4. **Layout** (reflow) → Calculate positions and sizes
5. **Paint** → Fill in pixels
6. **Composite** → Combine layers

## Critical Rendering Path

### Minimize Render-Blocking CSS

```html
<!-- Inline critical CSS -->
<style>
  /* Above-the-fold styles only */
  body { font-family: system-ui; margin: 0; }
  .header { /* ... */ }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>

<!-- Load print styles without blocking -->
<link rel="stylesheet" href="print.css" media="print">

<!-- Progressive loading -->
<link rel="stylesheet" href="mobile.css" media="(max-width: 767px)">
<link rel="stylesheet" href="desktop.css" media="(min-width: 768px)">
```

## Selector Performance

### Fast Selectors

```css
/* Class selectors - fastest ✅ */
.button { }
.nav-item { }

/* ID selectors - fast ✅ */
#header { }

/* Type selectors - fast ✅ */
div { }
p { }
```

### Slow Selectors

```css
/* Universal selector - slow ❌ */
* { }

/* Deep descendant selectors - slow ❌ */
body div ul li a { }

/* Child combinators - slower than simple ⚠️ */
.parent > .child { }

/* Attribute selectors with wildcards - slow ❌ */
[class*="icon-"] { }
[href^="http"] { }

/* :not() with complex selectors - slow ❌ */
div:not(.class1):not(.class2) { }
```

### Selector Best Practices

```css
/* ❌ Too specific and slow */
html body .container div.content ul.list li.item a.link { }

/* ✅ Simple and fast */
.list-link { }

/* ❌ Inefficient nesting */
.nav ul li a { }

/* ✅ Direct class */
.nav-link { }
```

## Layout Performance

### Triggers: Reflow (Layout) vs Repaint vs Composite

#### Properties That Trigger Reflow (Most Expensive)

```css
/* These trigger reflow - avoid animating ❌ */
width, height, margin, padding, border
top, right, bottom, left
font-size, font-weight, line-height
display, position, float, clear
```

#### Properties That Trigger Repaint (Expensive)

```css
/* These trigger repaint - use cautiously ⚠️ */
color, background, background-color
visibility, outline, box-shadow
border-style, border-radius
```

#### Properties That Only Composite (Cheap)

```css
/* These only composite - safe to animate ✅ */
transform, opacity
filter (GPU-accelerated)
```

### Optimize for 60fps Animations

```css
/* ✅ Only animate transform and opacity */
.smooth {
  transition: transform 0.3s, opacity 0.3s;
}

.smooth:hover {
  transform: scale(1.1);
  opacity: 0.8;
}

/* ❌ Don't animate layout properties */
.janky {
  transition: width 0.3s, margin-left 0.3s;
}

.janky:hover {
  width: 200px;
  margin-left: 20px;
}
```

### Use will-change Judiciously

```css
/* ✅ Good: Apply before animation */
.element:hover {
  will-change: transform;
}

.element {
  transition: transform 0.3s;
}

/* ❌ Bad: Always applied */
.element {
  will-change: transform; /* Creates layer, uses memory */
}

/* ✅ Best: Add and remove as needed */
.element {
  /* No will-change by default */
}

.element:hover,
.element:focus {
  will-change: transform;
}

.element:not(:hover):not(:focus) {
  will-change: auto; /* Remove hint */
}
```

### GPU Acceleration

```css
/* Force GPU acceleration */
.accelerated {
  transform: translateZ(0); /* Create compositing layer */
  /* or */
  will-change: transform;
}

/* Use 3D transforms for hardware acceleration */
.hardware-accelerated {
  transform: translate3d(0, 0, 0);
  /* Better than translate(0, 0) */
}
```

## CSS Containment

### Contain Property

```css
/* Layout containment - element's layout doesn't affect outside */
.card {
  contain: layout;
}

/* Style containment - counters and quotes don't affect outside */
.isolated {
  contain: style;
}

/* Paint containment - element's painting doesn't affect outside */
.painted {
  contain: paint;
}

/* Size containment - element's size doesn't depend on descendants */
.sized {
  contain: size;
}

/* Strict containment - all containment types */
.strict {
  contain: strict; /* layout + style + paint + size */
}

/* Content containment - most common */
.content {
  contain: content; /* layout + style + paint */
}
```

### Content Visibility

```css
/* Skip rendering off-screen content */
.lazy-section {
  content-visibility: auto;
  
  /* Prevent layout shift */
  contain-intrinsic-size: 0 500px; /* width height */
}

/* Use for long lists */
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 100px;
}
```

## Optimize Loading

### Critical CSS Strategy

```css
/* critical.css - inline in <head> */
/* Only above-the-fold, minimal styles */
body { margin: 0; font: 16px/1.5 system-ui; }
.header { height: 60px; }
.hero { min-height: 400px; }

/* main.css - load async */
/* Everything else */
```

### Font Loading Optimization

```css
/* Preload critical fonts */
/* <link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin> */

/* Use font-display for better UX */
@font-face {
  font-family: 'Custom';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  /* Options: auto, block, swap, fallback, optional */
}

/* Subset fonts to reduce size */
@font-face {
  font-family: 'Custom';
  src: url('font-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* Latin characters only */
}
```

### Image Optimization

```css
/* Use object-fit instead of background-image when possible */
img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

/* Lazy load background images */
.hero {
  background-color: #f0f0f0; /* Placeholder */
}

.hero.loaded {
  background-image: url('hero.jpg');
}
```

## Reduce CSS Size

### Remove Unused CSS

```javascript
// Use PurgeCSS or similar tools
module.exports = {
  content: ['./src/**/*.html', './src/**/*.js'],
  css: ['./src/**/*.css']
}
```

### Minification

```css
/* Before minification */
.button {
  padding: 10px 20px;
  background-color: #0066cc;
  border-radius: 4px;
}

/* After minification */
.button{padding:10px 20px;background-color:#06c;border-radius:4px}
```

### Compression

```
# Enable gzip/brotli on server
# Brotli achieves ~17% better compression than gzip for CSS

Original: 100 KB
Gzip: ~25 KB (75% reduction)
Brotli: ~20 KB (80% reduction)
```

## Avoid Layout Thrashing

### Bad: Reading then Writing in Loop

```javascript
// ❌ Causes multiple reflows
elements.forEach(el => {
  const height = el.offsetHeight; // Read (triggers reflow)
  el.style.height = height + 10 + 'px'; // Write
});
```

### Good: Batch Reads then Batch Writes

```javascript
// ✅ Single reflow
const heights = elements.map(el => el.offsetHeight); // Batch reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px'; // Batch writes
});
```

### Use requestAnimationFrame

```javascript
// ✅ Sync with browser's repaint cycle
function updateLayout() {
  requestAnimationFrame(() => {
    element.style.transform = 'translateX(100px)';
  });
}
```

## Reduce Specificity Wars

```css
/* ❌ High specificity makes overrides difficult */
html body div.container div.content p.text { }

/* ✅ Low specificity is easier to override */
.content-text { }

/* Use BEM or similar methodology to avoid specificity issues */
.block { }
.block__element { }
.block--modifier { }
```

## Optimize Custom Properties

### Inheritance Performance

```css
/* ✅ Define at appropriate scope */
:root {
  --color-primary: #0066cc; /* Global */
}

.component {
  --component-spacing: 1rem; /* Component-scoped */
}

/* ❌ Don't define everything at :root */
:root {
  --button-padding: 10px;
  --card-margin: 20px;
  --nav-height: 60px;
  /* Hundreds of component-specific variables */
}
```

### Dynamic Custom Properties

```css
/* Use calc() for derived values instead of multiple variables */
:root {
  --space-base: 1rem;
}

.element {
  padding: var(--space-base);
  margin: calc(var(--space-base) * 2);
  gap: calc(var(--space-base) / 2);
}
```

## Monitoring Performance

### Performance Metrics to Watch

1. **First Contentful Paint (FCP)** - Time to first content
2. **Largest Contentful Paint (LCP)** - Time to largest content (aim for <2.5s)
3. **Cumulative Layout Shift (CLS)** - Visual stability (aim for <0.1)
4. **First Input Delay (FID)** - Interactivity (aim for <100ms)

### Chrome DevTools

```javascript
// Measure CSS performance
performance.mark('css-start');
// ... CSS operations
performance.mark('css-end');
performance.measure('css-time', 'css-start', 'css-end');

// View rendering performance
// DevTools > Performance > Record
// Look for: Paint, Layout, Composite
```

### CSS Stats to Monitor

- Total CSS size (aim for <100 KB compressed)
- Number of rules (lower is better)
- Selector complexity (avoid deep nesting)
- Number of @media queries
- Number of unique colors/fonts

## Quick Wins Checklist

- [ ] Inline critical CSS (<14 KB)
- [ ] Defer non-critical CSS
- [ ] Minify and compress CSS
- [ ] Remove unused CSS
- [ ] Use simple selectors (classes)
- [ ] Avoid expensive properties in animations
- [ ] Use `transform` and `opacity` for animations
- [ ] Apply `contain` to isolated components
- [ ] Use `content-visibility: auto` for long pages
- [ ] Optimize font loading with `font-display`
- [ ] Preload critical resources
- [ ] Use `will-change` sparingly
- [ ] Batch DOM reads and writes
- [ ] Avoid layout thrashing
- [ ] Test on real devices

## Performance Budget Example

```
CSS Size Budget:
- Critical CSS: <14 KB
- Total CSS: <50 KB (compressed)
- Unique selectors: <3000
- Max selector depth: 4
- Max specificity: 0,2,0

Performance Budget:
- LCP: <2.5s
- CLS: <0.1
- FID: <100ms
```

## Resources

- [CSS Triggers](https://csstriggers.com) - See what properties trigger reflow/repaint
- Chrome DevTools Performance tab
- Lighthouse audits
- WebPageTest for real-world performance
