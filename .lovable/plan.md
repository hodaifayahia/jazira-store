

# New "Liquid" Premium Homepage Template

## Overview
Add a new "Liquid" (سائل) template to the existing template system. This template brings a modern, immersive design with glassmorphism effects, fluid animations, organic shapes, and interactive category cards -- all using the existing tech stack (React, Tailwind CSS, React Three Fiber, Framer Motion is NOT installed so we use CSS animations and the existing AnimatedSection).

## What Gets Built

### 1. Hero Section
- Full-viewport immersive hero with animated SVG liquid background blobs
- Gradient text headline with shimmer animation
- Glassmorphism search bar with frosted glass effect
- Animated CTA button with glow/ripple on hover
- Floating product showcase using existing 3D scene (React Three Fiber)

### 2. Category Cards (Showstopper)
- Glassmorphism cards with backdrop-blur and gradient borders
- CSS 3D tilt effect on mouse move (using onMouseMove + CSS transforms)
- Animated gradient overlays that shift on hover
- Staggered fade-in on scroll using existing AnimatedSection
- Asymmetric grid layout with varying card sizes (first 2 cards span larger)
- Subtle glow shadow effect on hover

### 3. Products Section
- Stagger-reveal grid using existing ProductCard component
- Glassmorphism section headers
- Floating decorative blob shapes in background

### 4. Trust/Social Proof Section
- Glassmorphism cards with icon animations
- Stats counter with animated numbers (existing AnimatedCounter)

### 5. Accessibility and Performance
- `prefers-reduced-motion` media query to disable animations
- Lazy loading images (already in ProductCard)
- Semantic HTML structure
- All animations are CSS-only (no heavy JS animation libraries needed)

## Layout

```text
+------------------------------------------+
|  HERO (100vh)                            |
|  - SVG liquid blobs (animated)           |
|  - Gradient text headline                |
|  - Glassmorphism search bar              |
|  - CTA buttons with glow                 |
+------------------------------------------+
|  CATEGORIES (asymmetric grid)            |
|  +--------+  +--------+                 |
|  | Large  |  | Large  |                 |
|  | Card   |  | Card   |                 |
|  +--------+  +--------+                 |
|  +------+ +------+ +------+             |
|  | Sm   | | Sm   | | Sm   |             |
|  +------+ +------+ +------+             |
+------------------------------------------+
|  PRODUCTS (stagger grid)                 |
|  Existing ProductCard x 8                |
+------------------------------------------+
|  TRUST BAR (glassmorphism cards)         |
+------------------------------------------+
```

## Technical Details

### Files Created
- `src/components/templates/LiquidTemplate.tsx` -- Main template component with:
  - `LiquidBlobs` -- SVG animated background blobs
  - `TiltCard` -- Category card with CSS 3D tilt on mouse move
  - Glassmorphism utility classes via inline Tailwind

### Files Modified
- `src/pages/Index.tsx` -- Add `liquid` template routing (3 lines)
- `src/components/admin/AppearanceTab.tsx` -- Add "Liquid" option to TEMPLATES array
- `src/index.css` -- Add ~30 lines of CSS for liquid animations (blob morph, gradient shimmer, glow pulse, reduced-motion support)
- `tailwind.config.ts` -- Add new keyframes for blob-morph and gradient-shimmer animations

### No New Dependencies
Everything is built with existing packages: React, Tailwind CSS, Lucide icons, and the existing AnimatedSection/FloatingParticles components.

### Template Registration
The new template ID will be `liquid` and it will appear in the admin Appearance tab alongside Classic, Minimal, and Bold.

