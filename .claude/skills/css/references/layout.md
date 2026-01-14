# Modern CSS Layout Techniques

Comprehensive guide to modern layout approaches in CSS.

## Flexbox Deep Dive

### Flex Container Properties

```css
.flex-container {
  display: flex; /* or inline-flex */
  
  /* Direction */
  flex-direction: row; /* row, row-reverse, column, column-reverse */
  
  /* Wrapping */
  flex-wrap: nowrap; /* nowrap, wrap, wrap-reverse */
  
  /* Shorthand for direction and wrap */
  flex-flow: row wrap;
  
  /* Main axis alignment */
  justify-content: flex-start; /* flex-start, flex-end, center, space-between, space-around, space-evenly */
  
  /* Cross axis alignment */
  align-items: stretch; /* stretch, flex-start, flex-end, center, baseline */
  
  /* Multi-line alignment */
  align-content: flex-start; /* Same values as justify-content */
  
  /* Spacing between items */
  gap: 1rem; /* Preferred over margins */
  row-gap: 1rem;
  column-gap: 1rem;
}
```

### Flex Item Properties

```css
.flex-item {
  /* Growth factor */
  flex-grow: 0; /* Default, don't grow */
  
  /* Shrink factor */
  flex-shrink: 1; /* Default, can shrink */
  
  /* Base size before growing/shrinking */
  flex-basis: auto; /* auto, content, or specific size */
  
  /* Shorthand */
  flex: 1 1 auto; /* grow, shrink, basis */
  flex: 1; /* Expands to 1 1 0 */
  flex: auto; /* Expands to 1 1 auto */
  flex: none; /* Expands to 0 0 auto */
  
  /* Individual alignment */
  align-self: auto; /* auto, flex-start, flex-end, center, baseline, stretch */
  
  /* Order */
  order: 0; /* Integer, default 0 */
}
```

### Common Flexbox Patterns

#### Holy Grail Layout

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header { flex: 0 0 auto; }
.main-content {
  flex: 1;
  display: flex;
}
.sidebar { flex: 0 0 250px; }
.content { flex: 1; }
.footer { flex: 0 0 auto; }
```

#### Equal Height Cards

```css
.card-container {
  display: flex;
  gap: 1rem;
}

.card {
  flex: 1 1 300px;
  display: flex;
  flex-direction: column;
}

.card-footer {
  margin-top: auto; /* Push to bottom */
}
```

#### Responsive Navigation

```css
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-item { flex: 0 1 auto; }

.nav-item:last-child {
  margin-left: auto; /* Push to end */
}
```

## CSS Grid Deep Dive

### Grid Container Properties

```css
.grid-container {
  display: grid; /* or inline-grid */
  
  /* Define columns */
  grid-template-columns: 200px 1fr 2fr;
  grid-template-columns: repeat(3, 1fr);
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  
  /* Define rows */
  grid-template-rows: 100px auto 200px;
  grid-template-rows: repeat(3, minmax(100px, auto));
  
  /* Named areas */
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  
  /* Shorthand */
  grid-template: 
    "header header" auto
    "sidebar main" 1fr
    "footer footer" auto
    / 250px 1fr;
  
  /* Gap between cells */
  gap: 1rem;
  row-gap: 1rem;
  column-gap: 1rem;
  
  /* Implicit grid behavior */
  grid-auto-rows: minmax(100px, auto);
  grid-auto-columns: 1fr;
  grid-auto-flow: row; /* row, column, dense, row dense, column dense */
  
  /* Alignment */
  justify-items: start; /* start, end, center, stretch */
  align-items: start;
  justify-content: start; /* start, end, center, stretch, space-between, space-around, space-evenly */
  align-content: start;
  place-items: center; /* Shorthand for justify-items and align-items */
  place-content: center; /* Shorthand for justify-content and align-content */
}
```

### Grid Item Properties

```css
.grid-item {
  /* Column placement */
  grid-column-start: 1;
  grid-column-end: 3;
  grid-column: 1 / 3; /* Shorthand */
  grid-column: 1 / span 2; /* Start at 1, span 2 columns */
  
  /* Row placement */
  grid-row-start: 1;
  grid-row-end: 3;
  grid-row: 1 / 3; /* Shorthand */
  
  /* Area placement */
  grid-area: header;
  grid-area: 1 / 1 / 3 / 3; /* row-start / column-start / row-end / column-end */
  
  /* Self alignment */
  justify-self: center;
  align-self: center;
  place-self: center; /* Shorthand */
}
```

### Advanced Grid Patterns

#### Responsive Grid with auto-fit/auto-fill

```css
/* auto-fit collapses empty tracks */
.grid-auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

/* auto-fill keeps empty tracks */
.grid-auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}
```

#### Responsive Typography Grid

```css
.article {
  display: grid;
  grid-template-columns:
    [full-start] 1fr
    [content-start] minmax(0, 65ch)
    [content-end] 1fr
    [full-end];
}

.article > * {
  grid-column: content;
}

.article > .full-width {
  grid-column: full;
}
```

#### Masonry-like Layout

```css
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 10px;
  gap: 10px;
}

/* Items span multiple rows based on content */
.masonry-item {
  grid-row-end: span 20; /* Adjust based on content height */
}
```

#### Subgrid (Modern)

```css
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.child {
  display: grid;
  grid-column: span 3;
  grid-template-columns: subgrid; /* Inherits parent's column tracks */
}
```

## Container Queries

### Container Types

```css
/* Size queries */
.container {
  container-type: size; /* Both dimensions */
  container-type: inline-size; /* Inline dimension only (usually width) */
}

/* Named containers */
.card-container {
  container-name: card;
  container-type: inline-size;
}

/* Shorthand */
.container {
  container: card / inline-size; /* name / type */
}
```

### Container Query Syntax

```css
/* Query unnamed container */
@container (min-width: 400px) {
  .element {
    font-size: 1.2rem;
  }
}

/* Query named container */
@container card (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}

/* Multiple conditions */
@container (min-width: 400px) and (max-width: 800px) {
  /* Styles */
}

/* Container query units */
.element {
  font-size: clamp(1rem, 5cqi, 2rem); /* cqi = 1% of container inline size */
  padding: 2cqb; /* cqb = 1% of container block size */
}
```

### Container Query Units

- `cqw` - 1% of container width
- `cqh` - 1% of container height
- `cqi` - 1% of container inline size
- `cqb` - 1% of container block size
- `cqmin` - Smaller of `cqi` or `cqb`
- `cqmax` - Larger of `cqi` or `cqb`

### Practical Container Query Patterns

```css
/* Responsive card */
.card-wrapper {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
  
  .card-image {
    width: 40%;
  }
}

@container (min-width: 600px) {
  .card-image {
    width: 50%;
  }
  
  .card-title {
    font-size: 2rem;
  }
}
```

## Logical Properties

Modern approach for internationalization supporting LTR and RTL layouts.

### Block and Inline

```css
/* Old way */
.element {
  margin-top: 1rem;
  margin-right: 2rem;
  margin-bottom: 1rem;
  margin-left: 2rem;
}

/* Modern logical properties */
.element {
  margin-block-start: 1rem;    /* top in LTR */
  margin-inline-end: 2rem;     /* right in LTR, left in RTL */
  margin-block-end: 1rem;      /* bottom in LTR */
  margin-inline-start: 2rem;   /* left in LTR, right in RTL */
  
  /* Shorthands */
  margin-block: 1rem;          /* block-start and block-end */
  margin-inline: 2rem;         /* inline-start and inline-end */
}
```

### Common Logical Properties

| Physical | Logical |
|----------|---------|
| width | inline-size |
| height | block-size |
| left | inset-inline-start |
| right | inset-inline-end |
| top | inset-block-start |
| bottom | inset-block-end |
| border-left | border-inline-start |
| text-align: left | text-align: start |

## Multi-Column Layout

```css
.article {
  columns: 3; /* Number of columns */
  columns: 300px; /* Column width */
  columns: 3 300px; /* Count and width */
  
  column-gap: 2rem;
  column-rule: 1px solid #ccc; /* Divider between columns */
  column-fill: balance; /* balance, auto */
}

/* Prevent breaking inside elements */
.no-break {
  break-inside: avoid;
  page-break-inside: avoid; /* Older browsers */
}

/* Span across all columns */
.full-width {
  column-span: all;
}
```

## Layout Comparison

| Feature | Flexbox | Grid | Container Queries |
|---------|---------|------|-------------------|
| Dimension | 1D (row or column) | 2D (rows and columns) | Component-aware |
| Content flow | Sequential | Grid-based | Depends on container |
| Best for | Navigation, toolbars, components | Page layouts, complex structures | Reusable components |
| Browser support | Excellent | Excellent | Modern browsers |
| Complexity | Simple | Moderate | Moderate |

## When to Use What

- **Flexbox**: Navigation bars, button groups, form controls, centering content, equal height columns
- **Grid**: Page layouts, galleries, dashboards, card layouts, magazine-style layouts
- **Container Queries**: Reusable components that adapt to their container, design systems, component libraries
- **Multi-column**: Articles, text-heavy content, newspaper-style layouts
