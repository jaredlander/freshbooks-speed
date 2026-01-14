# Modern CSS Features

Cutting-edge CSS features and techniques for modern browsers.

## Modern Color Spaces

### OKLCH Color Space

Perceptually uniform color space for better color manipulation.

```css
:root {
  /* OKLCH: Lightness (0-100%), Chroma (0-0.4), Hue (0-360deg) */
  --primary: oklch(60% 0.2 250);
  
  /* Better than HSL for lightness adjustments */
  --primary-light: oklch(70% 0.2 250); /* Perceptually 10% lighter */
  --primary-dark: oklch(50% 0.2 250);  /* Perceptually 10% darker */
  
  /* Full saturation colors */
  --red: oklch(60% 0.25 30);
  --green: oklch(60% 0.25 150);
  --blue: oklch(60% 0.25 250);
}
```

### Color-Mix Function

```css
:root {
  --primary: #0066cc;
  
  /* Mix colors in different color spaces */
  --tint: color-mix(in oklch, var(--primary) 80%, white);
  --shade: color-mix(in oklch, var(--primary) 80%, black);
  
  /* Create semi-transparent versions */
  --primary-alpha: color-mix(in srgb, var(--primary) 50%, transparent);
  
  /* Blend with specific amounts */
  --blend: color-mix(in oklch, red 30%, blue 70%);
}

/* Hover states without defining new colors */
.button {
  background: var(--primary);
}

.button:hover {
  background: color-mix(in oklch, var(--primary) 90%, white);
}
```

### Relative Colors

```css
:root {
  --primary: oklch(60% 0.2 250);
  
  /* Adjust components relative to base color */
  --lighter: oklch(from var(--primary) calc(l + 10%) c h);
  --darker: oklch(from var(--primary) calc(l - 10%) c h);
  --desaturated: oklch(from var(--primary) l calc(c * 0.5) h);
  --rotated: oklch(from var(--primary) l c calc(h + 180));
}

/* Manipulate RGB channels */
.element {
  --base: rgb(100 150 200);
  --transparent: rgb(from var(--base) r g b / 50%);
  --inverted: rgb(from var(--base) calc(255 - r) calc(255 - g) calc(255 - b));
}
```

## Advanced Selectors

### :has() - Parent Selector

```css
/* Style parent based on children */
.card:has(img) {
  display: grid;
  grid-template-columns: 200px 1fr;
}

.card:has(> .featured) {
  border: 2px solid gold;
}

/* Form validation styling */
.form:has(:invalid) .submit-button {
  opacity: 0.5;
  pointer-events: none;
}

/* Navigation with active item */
.nav:has(.nav-item.active) {
  background: var(--nav-active-bg);
}

/* Quantity queries */
/* Style parent when it has exactly 3 children */
.container:has(> :nth-child(3):last-child) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

### :is() and :where()

```css
/* :is() - matches any selector, inherits specificity */
:is(h1, h2, h3, h4, h5, h6) {
  font-weight: 700;
  line-height: 1.2;
}

/* Equivalent to writing out all combinations */
:is(.light, .dark) :is(.button, .link) {
  /* 4 combinations: .light .button, .light .link, .dark .button, .dark .link */
}

/* :where() - matches any selector, zero specificity */
:where(.card, .panel) > :where(h2, h3) {
  margin-top: 0; /* Easy to override */
}

/* Combined with :not() */
:is(h1, h2, h3):not(.no-margin) {
  margin-block-end: 1em;
}
```

### :focus-visible

```css
/* Remove focus for mouse users */
button:focus {
  outline: none;
}

/* Show focus for keyboard users */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Style parent when child has keyboard focus */
.card:has(:focus-visible) {
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

### ::backdrop

```css
/* Style modal/dialog backdrop */
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

/* Fullscreen element backdrop */
video:fullscreen::backdrop {
  background: black;
}
```

## Advanced Typography

### font-variant-* Properties

```css
.fancy-text {
  /* Ligatures */
  font-variant-ligatures: common-ligatures discretionary-ligatures;
  
  /* Numeric features */
  font-variant-numeric: tabular-nums slashed-zero;
  
  /* Capitalization */
  font-variant-caps: small-caps;
  
  /* Alternates */
  font-variant-alternates: stylistic(alt-a);
}
```

### text-wrap and text-balance

```css
/* Prevent orphans */
h1, h2, h3 {
  text-wrap: balance; /* Balance line lengths */
}

p {
  text-wrap: pretty; /* Prevent orphans and improve readability */
}

/* Control wrapping */
.nowrap {
  text-wrap: nowrap;
}
```

### Initial Letter (Drop Caps)

```css
p::first-letter {
  initial-letter: 3; /* 3 lines tall */
  font-weight: bold;
  margin-right: 0.5em;
}
```

## Scroll-Driven Animations

### View Timeline (Animate on Scroll)

```css
/* Fade in as element enters viewport */
.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Different animations for different scroll positions */
.slide-in {
  animation: slide-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

@keyframes slide-in {
  from { transform: translateX(-100px); }
  to { transform: translateX(0); }
}
```

### Scroll Timeline

```css
/* Animate based on scroll container */
.scroller {
  scroll-timeline: --scroller block;
}

.progress-bar {
  animation: grow-bar linear;
  animation-timeline: --scroller;
}

@keyframes grow-bar {
  from { width: 0%; }
  to { width: 100%; }
}
```

### Scroll Snap

```css
/* Smooth snapping for carousels */
.carousel {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  display: flex;
  gap: 1rem;
}

.carousel > * {
  scroll-snap-align: center;
  scroll-snap-stop: always;
  flex: 0 0 80%;
}

/* Vertical scroll snapping */
.sections {
  scroll-snap-type: y proximity;
  overflow-y: auto;
  height: 100vh;
}

.section {
  scroll-snap-align: start;
  min-height: 100vh;
}
```

## View Transitions API

### Basic Page Transitions

```css
/* Default transition */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: ease;
}

/* Customize transition */
::view-transition-old(root) {
  animation: fade-out 0.3s ease-out;
}

::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}

@keyframes fade-out {
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
}
```

### Named Transitions

```css
/* Identify element for morphing */
.hero-image {
  view-transition-name: hero;
}

/* Customize hero transition */
::view-transition-old(hero),
::view-transition-new(hero) {
  animation-duration: 0.5s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Different transitions for different elements */
.card {
  view-transition-name: card-1;
}

::view-transition-old(card-1) {
  animation: slide-out-left 0.3s;
}

::view-transition-new(card-1) {
  animation: slide-in-right 0.3s;
}
```

## Anchor Positioning

```css
/* Define anchor */
.tooltip-trigger {
  anchor-name: --trigger;
}

/* Position relative to anchor */
.tooltip {
  position: absolute;
  position-anchor: --trigger;
  
  /* Position below the anchor */
  top: anchor(bottom);
  left: anchor(center);
  transform: translateX(-50%);
  
  /* Alternative positions */
  /* bottom: anchor(top); /* Above */
  /* left: anchor(right); /* To the right */
}

/* Fallback positioning */
.tooltip {
  position-try-options: flip-block, flip-inline;
}
```

## Comparison Functions

### min(), max(), clamp()

```css
/* min() - use smallest value */
.element {
  width: min(100%, 800px); /* Never wider than 800px */
  padding: min(5vw, 3rem);
}

/* max() - use largest value */
.element {
  font-size: max(1rem, 2vw); /* Never smaller than 1rem */
  min-height: max(300px, 50vh);
}

/* clamp() - constrain between min and max */
.element {
  font-size: clamp(1rem, 2.5vw, 2rem);
  /*             min   ideal  max */
  
  width: clamp(300px, 50%, 1200px);
  padding: clamp(1rem, 5vw, 3rem);
}

/* Responsive without media queries */
.container {
  padding-inline: clamp(1rem, 5vw, 5rem);
}

h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}
```

## Nesting (Native CSS)

```css
/* Native CSS nesting */
.card {
  padding: 1rem;
  
  /* Nested selector */
  & .title {
    font-size: 1.5rem;
  }
  
  /* Pseudo-classes */
  &:hover {
    background: #f0f0f0;
  }
  
  /* Combined with other selectors */
  & + & {
    margin-top: 1rem;
  }
  
  /* Media queries */
  @media (min-width: 768px) {
    padding: 2rem;
  }
}

/* Direct nesting (no &) */
.nav {
  ul {
    list-style: none;
    
    li {
      display: inline-block;
      
      a {
        color: blue;
        
        &:hover {
          color: darkblue;
        }
      }
    }
  }
}
```

## @scope

```css
/* Scope styles to specific subtree */
@scope (.card) {
  /* Only affects elements inside .card */
  h2 {
    font-size: 1.5rem;
  }
  
  .button {
    padding: 0.5rem 1rem;
  }
}

/* Scope with lower bound */
@scope (.article) to (.comments) {
  /* Affects .article children, but not .comments */
  p {
    line-height: 1.6;
  }
}
```

## Logical Combinations

### Logical Properties Shorthand

```css
.element {
  /* Old: margin-top and margin-bottom */
  margin-block: 1rem;
  
  /* Old: margin-left and margin-right */
  margin-inline: 2rem;
  
  /* Old: padding on all sides */
  padding: 1rem; /* Still valid! */
  
  /* Border radius */
  border-start-start-radius: 8px; /* top-left in LTR */
  border-start-end-radius: 8px;   /* top-right in LTR */
}
```

## Cascade Layers Best Practices

```css
/* Define order at top of stylesheet */
@layer reset, base, theme, components, utilities;

/* Import with layer */
@import url('reset.css') layer(reset);

/* Anonymous layers */
@layer {
  .card {
    padding: 1rem;
  }
}

/* Nested layers */
@layer components {
  @layer buttons {
    .button { }
  }
  
  @layer cards {
    .card { }
  }
}

/* Unlayered styles have highest priority */
.important {
  color: red; /* Will override layered styles */
}
```

## Subgrid

```css
/* Parent grid */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

/* Child inherits parent's grid tracks */
.grid-item {
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid; /* Inherits 2 columns from parent */
  gap: 1rem; /* Can have different gap */
}

/* Useful for aligned card layouts */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid; /* Align all card internals */
  grid-row: span 3; /* title, body, footer */
}
```

## Browser Support Strategy

### Feature Detection with @supports

```css
/* Fallback */
.element {
  display: flex;
}

/* Enhanced for modern browsers */
@supports (display: grid) {
  .element {
    display: grid;
  }
}

/* Multiple features */
@supports (display: grid) and (gap: 1rem) {
  .grid {
    display: grid;
    gap: 1rem;
  }
}

/* OR conditions */
@supports (backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px)) {
  .glass {
    backdrop-filter: blur(10px);
  }
}

/* NOT conditions */
@supports not (display: grid) {
  .fallback {
    display: flex;
  }
}
```

### Progressive Enhancement Pattern

```css
/* Base styles - works everywhere */
.component {
  background: white;
  border: 1px solid gray;
}

/* Enhanced with custom properties */
@supports (--css: variables) {
  .component {
    background: var(--surface);
    border-color: var(--border);
  }
}

/* Further enhanced with modern features */
@supports (container-type: inline-size) {
  .component {
    container-type: inline-size;
  }
}
```

## Quick Reference Table

| Feature | Browser Support | Use Case |
|---------|----------------|----------|
| `:has()` | Modern (2023+) | Parent selection |
| Container Queries | Modern (2023+) | Component-based responsive |
| `:is()` / `:where()` | Modern (2021+) | Selector grouping |
| Cascade Layers | Modern (2022+) | Specificity management |
| OKLCH colors | Modern (2023+) | Perceptually uniform colors |
| View Transitions | Experimental | Page transitions |
| Nesting | Modern (2023+) | Cleaner code |
| Subgrid | Modern (2023+) | Aligned nested grids |
| `color-mix()` | Modern (2023+) | Dynamic color blending |
| Scroll-driven animations | Experimental | Scroll effects |

## Resources for Staying Current

- MDN Web Docs (via context7)
- Can I Use (via context7)
- Chrome Platform Status
- WebKit Feature Status
- MDN Browser Compatibility Data
