
# Enhanced Homepage with 3D Elements and Animations

## Overview
Transform the homepage from a simple layout into a visually stunning experience with scroll-triggered animations, floating 3D objects in the hero section, and polished micro-interactions throughout.

## What You'll See

### 1. 3D Floating Shopping Bag in Hero Section
- A rotating, floating 3D shopping bag rendered with Three.js appears beside the hero text (desktop only, hidden on mobile for performance)
- The bag gently rotates and bobs up/down, giving a premium modern feel
- Uses `@react-three/fiber@^8.18` and `@react-three/drei@^9.122.0` (compatible with React 18)

### 2. Scroll-Triggered Section Animations
- Each section (categories, products, why us, CTA) fades and slides in as you scroll down
- A custom `useScrollAnimation` hook using IntersectionObserver triggers animations when elements enter the viewport
- Staggered delays on grid items (categories, product cards, trust items) for a cascade effect

### 3. Enhanced Trust Bar
- Icons pulse/bounce on hover
- Animated counter effect for the product count badge in the hero

### 4. Animated Category Cards
- Cards scale up slightly and glow on hover with a subtle gradient border effect
- Staggered entrance animation as they scroll into view

### 5. Floating Particles Background
- Subtle animated dots/circles float behind the "Why Choose Us" and CTA sections using CSS animations
- Gives depth without hurting performance

### 6. Enhanced CTA Banner
- Animated gradient background that slowly shifts colors
- Pulsing glow effect on the main CTA button

### 7. New Tailwind Keyframes
- `float` (gentle up/down bobbing)
- `slide-up` (scroll reveal from below)
- `glow-pulse` (button glow effect)
- `gradient-shift` (animated gradient background)

---

## Technical Details

### New Dependencies
- `@react-three/fiber@^8.18.0` -- React renderer for Three.js
- `three@^0.170.0` -- 3D rendering engine
- `@react-three/drei@^9.122.0` -- Helper components (Float, MeshDistortMaterial, etc.)

### New Files
1. **`src/components/HeroScene3D.tsx`** -- Three.js Canvas with a floating 3D shopping bag using `@react-three/drei`'s `Float`, `MeshDistortMaterial`, and basic geometric shapes. Wrapped in `Suspense` with a fallback. Only renders on `lg:` screens and above.

2. **`src/hooks/useScrollAnimation.ts`** -- Custom hook that returns a `ref` and `isVisible` boolean. Uses `IntersectionObserver` with a threshold of 0.1 to trigger CSS class changes for scroll-reveal animations.

3. **`src/components/AnimatedSection.tsx`** -- Wrapper component that applies scroll-triggered fade/slide animations to its children with configurable direction and delay.

4. **`src/components/FloatingParticles.tsx`** -- Lightweight CSS-only animated particles (8-10 circles) with randomized positions and animation durations for background decoration.

### Modified Files
1. **`src/pages/Index.tsx`** -- Major changes:
   - Import and place `HeroScene3D` in the fallback hero section (alongside existing text)
   - Wrap each section in `AnimatedSection` for scroll reveals
   - Add staggered `animation-delay` styles to grid children
   - Add `FloatingParticles` behind "Why Choose Us" and CTA sections
   - Add animated gradient class to CTA section
   - Add hover animations to trust bar items
   - Add animated counter for product count

2. **`tailwind.config.ts`** -- Add new keyframes:
   - `float`: translateY oscillation over 3s
   - `slide-up`: opacity 0 + translateY(30px) to visible
   - `slide-left`: opacity 0 + translateX(30px) to visible  
   - `glow-pulse`: box-shadow pulse effect
   - `gradient-shift`: background-position animation
   - Corresponding animation utilities

3. **`src/index.css`** -- Add utility classes:
   - `.animate-on-scroll` base class (opacity 0, transform, transition)
   - `.animate-on-scroll.visible` (opacity 1, transform none)
   - `.animated-gradient` for shifting gradient backgrounds
   - `.stagger-1` through `.stagger-8` for cascade delays

### Performance Considerations
- 3D scene only loads on desktop (lg: breakpoint) via a media query check
- Three.js canvas uses `frameloop="demand"` to avoid unnecessary renders
- IntersectionObserver disconnects after triggering (one-time animation)
- CSS animations used wherever possible instead of JS for particles
- `React.lazy` + `Suspense` for the 3D component to avoid blocking initial load
