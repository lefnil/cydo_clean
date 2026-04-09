# Responsive Design Guide - TCYDO

This guide documents all Flexbox, Grid, and responsive CSS techniques implemented in the TCYDO application.

## Breakpoints Used

- **Mobile (default)**: 0px - 639px
- **Small (sm)**: 640px+
- **Medium (md)**: 768px+
- **Large (lg)**: 1024px+
- **XL (xl)**: 1280px+

## Responsive CSS Utilities

### Grid Utilities

```tsx
// Auto-fit grid that adapts to screen size
<div className="grid-auto-fit">
  {/* 1 col on mobile, 2 on sm, 3 on lg, 4 on xl */}
</div>

// 2-column grid that becomes 3 on larger screens
<div className="grid-auto-fit-2">
  {/* 1 col on mobile, 2 on sm, 3 on lg */}
</div>

// Small auto-fit (1 col -> 1 col -> 2 cols on md -> 3 on lg)
<div className="grid-auto-fit-sm">
  {/* Perfect for moderate content */}
</div>

// Dynamic grid with responsive gap
<div className="grid-dynamic">
  {/* gap: 12px (sm) -> 16px (md) -> 24px (lg) */}
</div>
```

### Flexbox Utilities

```tsx
// Center content (flex with center alignment)
<div className="flex-center">
  {/* Horizontally and vertically centered */}
</div>

// Space-between (justify items)
<div className="flex-between">
  {/* Items at start and end */}
</div>

// Flex start (top-left alignment)
<div className="flex-start">
  {/* Items aligned to top-left */}
</div>

// Responsive flex direction
<div className="flex-row-md">
  {/* Column on mobile, row on md+ */}
</div>

<div className="flex-row-lg">
  {/* Column on mobile/sm/md, row on lg+ */}
</div>
```

### Spacing Utilities

```tsx
// Responsive padding (scales with screen size)
<div className="p-responsive-sm">
  {/* p-3 (sm) -> p-4 (md) -> p-5 (lg) -> p-6 (lg) */}
</div>

// Responsive horizontal padding
<div className="px-responsive-sm">
  {/* px-3 -> px-4 -> px-5 -> px-6 */}
</div>

// Responsive gap
<div className="gap-responsive-sm">
  {/* gap-2 -> gap-3 -> gap-4 -> gap-6 */}
</div>

// Safe mobile margins
<div className="safe-mobile-margin">
  {/* Avoids bottom navbar collision on mobile */}
</div>
```

### Text Utilities

```tsx
// Responsive text size
<p className="text-responsive">
  {/* text-sm -> text-base -> text-lg */}
</p>

// Responsive heading size
<h2 className="text-responsive-heading">
  {/* text-lg -> text-xl -> text-2xl -> text-3xl */}
</h2>
```

### Card Utilities

```tsx
// Responsive card padding
<div className="card-padding">
  {/* p-4 (sm) -> p-5 (md) -> p-6 (lg) -> p-8 (xl) */}
</div>

// Scrollable with safe height
<div className="scrollable-responsive">
  {/* Automatically adjusts max-height based on viewport */}
</div>
```

### Button Utilities

```tsx
// Responsive button sizing
<button className="btn-responsive btn-jewel">
  {/* px-3 py-2 text-sm -> px-4 -> px-6 py-3 text-base */}
</button>
```

## Component-Level Responsive Patterns

### Layout Component (src/components/Layout.tsx)

**Mobile-First Approach:**
- Header hidden on md+ screens (replaced by sidebar)
- Sidebar fixed on mobile, relative on md+
- Main content has responsive padding and max-width
- All text has truncation/ellipsis for overflow

**Key Classes:**
```tsx
// Responsive header sizing
<span className="text-sm sm:text-base">Text</span>

// Responsive spacing
<div className="p-3 sm:p-4 md:p-5 lg:p-6">

// Safe flex wrapping
<div className="flex flex-col sm:flex-row">
```

### DataTable Component (src/components/meal/ui/DataTable.tsx)

**Dual-View Strategy:**
- **Desktop (md+)**: Full horizontal table with overflow scroll
- **Mobile**: Card-based layout with grid columns

**Mobile Card Design:**
```tsx
// Primary information at top
<div className="mb-3 pb-3 border-b">
  {primaryField}
</div>

// Secondary fields in 2-column grid
<div className="grid grid-cols-2 gap-3">
  {secondaryFields}
</div>

// Action buttons below
<div className="pt-3 border-t">
  {actionButtons}
</div>
```

### Dashboard Component (src/components/meal/DashboardTab.tsx)

**Stat Cards Grid:**
```tsx
// Auto-fit 4 columns, collapses to 1 on mobile
<div className="grid-auto-fit">
  <StatCard />
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

**Chart Layout:**
```tsx
// Stacked on mobile, 3-column grid on lg
<div className="grid grid-cols-1 lg:grid-cols-3 gap-responsive-sm">
  <Chart />    {/* Takes 1 col on mobile, 1 on lg */}
  <Table />    {/* Takes 1 col on mobile, 2 on lg */}
</div>
```

## Implementation Examples

### Example 1: Responsive Feature Section

```tsx
// Before: Fixed 4-column layout
<div className="grid grid-cols-4 gap-6">
  {items.map(item => <Card key={item} />)}
</div>

// After: Responsive auto-fit
<div className="grid-auto-fit gap-responsive-sm">
  {items.map(item => <Card key={item} />)}
</div>
```

### Example 2: Mobile-Friendly Table

```tsx
// Before: Horizontal scroll only
<table className="w-full">
  <tr>{columns}</tr>
</table>

// After: Desktop table + mobile cards
<div>
  <div className="hidden md:block">
    {/* Desktop table */}
  </div>
  <div className="md:hidden space-y-3">
    {/* Mobile card view */}
  </div>
</div>
```

### Example 3: Responsive Form Layout

```tsx
// Flex direction changes at md breakpoint
<form className="flex-col md:flex-row gap-responsive-sm">
  <input /> {/* Full width on mobile, auto on md+ */}
  <button /> {/* Full width on mobile, auto on md+ */}
</form>
```

## Best Practices

### 1. **Mobile-First Approach**
Always start with mobile styles, then add responsive classes:
```tsx
// ✅ Good: Mobile default, enhanced on larger screens
<div className="text-sm md:text-lg p-4 md:p-6">

// ❌ Avoid: Desktop default
<div className="text-lg md:text-sm">
```

### 2. **Flexible Widths**
Use flex and grid instead of fixed widths:
```tsx
// ✅ Good: Flexible
<div className="flex flex-col md:flex-row gap-4">

// ❌ Avoid: Fixed
<div style={{ display: 'flex', gap: '24px' }}>
```

### 3. **Responsive Text**
Scale text appropriately:
```tsx
// ✅ Good: Responsive text sizes
<h1 className="text-responsive-heading">Title</h1>

// ❌ Avoid: Fixed text
<h1 className="text-3xl">Title</h1>
```

### 4. **Container Constraints**
Add max-width and center content:
```tsx
// ✅ Good: Constrained and centered
<main className="w-full max-w-6xl mx-auto px-4">

// ❌ Avoid: No constraint
<main className="w-full px-4">
```

### 5. **Overflow Handling**
Use truncation and ellipsis for long text:
```tsx
// ✅ Good: Graceful overflow
<p className="truncate">Long text...</p>
<p className="line-clamp-2">Multi-line text...</p>

// ❌ Avoid: Breaking layout
<p>{veryLongText}</p>
```

## Testing Responsive Design

### Recommended Screen Sizes to Test
- 320px (small mobile)
- 375px (iPhone SE)
- 540px (small tablet)
- 768px (iPad)
- 1024px (iPad Pro)
- 1440px (Desktop)

### Chrome DevTools
1. Press F12
2. Click device toggle icon (Ctrl+Shift+M)
3. Test at different breakpoints
4. Use responsive preset devices

## Performance Notes

- Classes use Tailwind's responsive prefix system
- No additional CSS bundles needed
- breakpoints are compile-time only
- Zero runtime overhead

## Future Enhancements

- [ ] Add container query support
- [ ] Implement aspect-ratio utilities
- [ ] Add scroll snap utilities
- [ ] Create print-friendly styles
- [ ] Add touch-friendly spacing for mobile

---

**Last Updated:** April 2026
**Framework:** Tailwind CSS 4.1.14 + React 19
