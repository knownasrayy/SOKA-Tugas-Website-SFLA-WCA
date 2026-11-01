---
name: SFLA & WCA Telemetry Deck
colors:
  background: '#09111a'
  on-background: '#edf3f8'
  surface: '#0e1824'
  surface-dim: '#070d15'
  surface-bright: '#1b2b3d'
  surface-container-lowest: '#060b12'
  surface-container-low: '#0c1520'
  surface-container: '#111e2d'
  surface-container-high: '#162638'
  surface-container-highest: '#1d3046'
  surface-variant: '#192a3d'
  on-surface: '#edf3f8'
  on-surface-variant: '#9fb2c7'
  inverse-surface: '#e4edf5'
  inverse-on-surface: '#0b141f'
  outline: '#354b63'
  outline-variant: '#1f3145'
  surface-tint: '#1f9d7a'
  primary: '#1f9d7a'
  on-primary: '#041a13'
  primary-container: '#0f382d'
  on-primary-container: '#9cead1'
  inverse-primary: '#146e55'
  secondary: '#2298c7'
  on-secondary: '#041923'
  secondary-container: '#0e3547'
  on-secondary-container: '#a4e3fc'
  tertiary: '#d8a33a'
  on-tertiary: '#231702'
  tertiary-container: '#3d2c09'
  on-tertiary-container: '#fae0a5'
  error: '#d95b5b'
  on-error: '#260606'
  error-container: '#421414'
  on-error-container: '#f9c2c2'
  primary-fixed: '#b5f2de'
  primary-fixed-dim: '#7cdbc0'
  on-primary-fixed: '#052119'
  on-primary-fixed-variant: '#0f523f'
  secondary-fixed: '#baeaff'
  secondary-fixed-dim: '#82d5f7'
  on-secondary-fixed: '#041f2b'
  on-secondary-fixed-variant: '#0e4c66'
  tertiary-fixed: '#ffebc2'
  tertiary-fixed-dim: '#ecc165'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#593f08'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 70px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 52px
    fontWeight: '800'
    lineHeight: 58px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: '0'
  body-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: '0'
  code-formula:
    fontFamily: Ubuntu Mono
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: '0'
  label-meta:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.01em
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.625rem
  lg: 0.875rem
  xl: 1.125rem
  full: 9999px
spacing:
  unit: 8px
  xs: 8px
  sm: 12px
  md: 20px
  lg: 28px
  xl: 44px
---

# Design System: SFLA & WCA — Cloud Optimization Interactive Deck

## 1. Visual Theme & Atmosphere

Designed as a **Projector-First Scientific Telemetry Deck**, this visual language bridges nature-inspired metaheuristics with rigorous cloud computing engineering (SOKA). Rather than decorative clip-art or generic startup SaaS glassmorphism, the interface behaves like a calibrated research instrument built for lecture halls at `1920x1080` (`16:9`). Every screen sits on a deep oceanic slate ground (`#09111a`) with flat, tactile card steps (`#0e1824` to `#162638`) separated by crisp tonal contrast and `1px` structural rules—keeping visual noise near zero so live `60 FPS` 2D contour landscapes, leaping trajectories, and hydrological streams command full attention from the back row.

Two disciplined botanical-and-hydrological accents anchor the pedagogical narrative without competing: **Lotus Viridian (`#1f9d7a`)** governs the Shuffled Frog-Leaping Algorithm (SFLA) module—evoking pond lily-pads, local memeplex evolution, and discrete Combinatorial leaps—while **Hydrological Cerulean (`#2298c7`)** governs the Water Cycle Algorithm (WCA) module—evoking downhill gravitational runoff from streams to rivers to the sea. **Solar Ochre (`#d8a33a`)** marks the global optimum (`X_g` / `Sea`) across both modules, creating an instant visual Rosetta Stone when students compare both metaheuristics side-by-side on Slides 16 and 17.

## 2. Color Palette & Roles

### Primary Foundation
- **Abyssal Slate Ground (`#09111a`)**: Root viewport canvas (`--bg-deep`). Chosen over pure `#000000` to prevent halation on classroom LCD projectors while maximizing luminous range for contour plots.
- **Telemetry Surface (`#0e1824`)**: Top chrome bar, presenter drawer, and simulation control docks (`--bg-panel`).
- **Architectural Card (`#111e2d`)**: Standard flat container surface (`--bg-card`) for concept definitions, taxonomy comparisons, and metric cells—rendered solid without backdrop blur or resting drop-shadows.
- **Elevated Interactive Surface (`#162638`)**: Hover/active container step and active formula callouts (`--bg-elevated`).
- **Subtle Structural Rule (`#1f3145` / `#354b63`)**: Hairline table dividers, control outlines, and inactive slider tracks.

### Accent & Interactive (Dual-Module Coding)
- **Lotus Viridian (`#1f9d7a`)**: Primary SFLA accent (`--sfla-primary`), active SFLA navigation indicator, memeplex A markers, and SFLA convergence curve. Tinted surface fill (`#0f382d`) supports SFLA status badges.
- **Hydrological Cerulean (`#2298c7`)**: Primary WCA accent (`--wca-primary`), active WCA navigation indicator, river vectors, and WCA convergence curve. Tinted surface fill (`#0e3547`) supports WCA status badges.
- **Solar Ochre (`#d8a33a`)**: Global optimum beacon (`X_g` in SFLA, `Sea` in WCA, and focus ring highlight). Reserved strictly for best-known solutions and keyboard focus rings (`2px solid #d8a33a`).

### Typography & Text Hierarchy
- **Chalk White (`#edf3f8`)**: Primary headings, body prose, and tabular KPI readouts (`> 14:1` contrast on `#09111a`, exceeding WCAG 2.2 AAA).
- ** Mist Slate (`#9fb2c7`)**: Secondary explanations, axis captions, and parameter descriptions (`~7.4:1` contrast on `#111e2d`, exceeding WCAG 2.2 AA).
- **Muted Cadet (`#6d849e`)**: Disabled button labels, non-essential keyboard hints, and gridline coordinates (`>= 4.6:1` on `#09111a`).

### Functional & Simulation States
- **Memeplex Palette (SFLA Canvas)**: Viridian (`#1f9d7a`), Cerulean (`#2298c7`), Ochre (`#d8a33a`), Terracotta Coral (`#d96b43`)—paired with distinct geometric polygon markers (`circle`, `square`, `triangle`, `diamond`) so color-blind viewers distinguish memeplexes without relying on hue alone.
- **Hydrological Hierarchy (WCA Canvas)**: Sea (`#d8a33a` concentric beacon), Rivers (`#2298c7` bold nodes + directional flow strokes), Streams (`#7ccce5` crisp droplets), Evaporation/Rain (`#e2eef8` dashed ring reset).
- **Semantic Alert / Penalty (`#d95b5b`)**: Worst frog (`X_w`), local-optima warning states, and SLA violation indicators.

## 3. Typography Rules

### Hierarchy & Weights
All typography loads 100% offline from local font binaries (`PlusJakartaSans-VariableFont_wght.ttf` and `UbuntuMono-R.ttf`):
- **Display Hero (`clamp(2.6rem, 4.4vw, 4.2rem)` / `800` / `-0.03em`)**: Reserved for Slide 1 cover title and Slide 18 closing summary. Tightly tracked, solid `#edf3f8` (never gradient-clipped text).
- **Slide Title H1 (`clamp(2.05rem, 3.2vw, 3.35rem)` / `800` / `>= 52px` at `1920x1080`)**: Anchors the top-left of every slide in a single decisive phrase.
- **Card / Section Heading H2 (`clamp(1.35rem, 2.0vw, 2.25rem)` / `700` / `>= 36px` at `1920x1080`)**: Names sub-panels, algorithm phases, and comparison columns.
- **Projector Body (`clamp(1.1rem, 1.5vw, 1.75rem)` / `400–600` / `>= 28px` at `1920x1080`)**: Concise 1–2 clause bullets; line-height `1.42` for effortless scanning across a lecture room.
- **Mathematical Formula & Code (`Ubuntu Mono`, `clamp(0.95rem, 1.2vw, 1.35rem)`)**: Strictly reserved for `<code>` / `<pre>` equations (`D_i = rand() * (X_b - X_w)`, `d_max` decay, Cloud VM cost objective) so notation never blurs with prose.
- **Numeric Telemetry (`Plus Jakarta Sans` with `font-variant-numeric: tabular-nums`)**: Iteration counters, `Best f(x)` readouts, NFE tallies, and slider values align vertically on every frame without layout jitter.

### Spacing Principles
- Never stack tiny uppercase tracked kickers above headings; use a clean sentence-case breadcrumb (`.slide-context`) with a solid `8px` module dot.
- Maintain generous internal card padding (`20px–28px`) and `20px` grid gutters so dense telemetry never feels cramped.

## 4. Component Stylings

### Buttons & Transport Controls
- **Shape & Fill**: `8px` corner radius (`--radius-sm`), flat `#162638` surface with `1px solid #294057`, `38px` minimum target height.
- **Primary Action (`.btn-primary`)**: Solid Lotus Viridian (`#1f9d7a`) with dark ink (`#041a13`, `700` weight) on SFLA/general slides, or Hydrological Cerulean (`#2298c7`) inside WCA controls.
- **States**: Explicit property transitions (`background-color 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out, transform 150ms ease-out`—never `transition: all`). `:focus-visible` renders a crisp `2px solid #d8a33a` outline at `2px` offset.

### Cards & Telemetry Containers
- **Flat Architectural Cards (`.card`)**: Solid `#111e2d` fill, `1px solid #1f3145`, `12px` radius, zero resting `box-shadow`, zero `backdrop-filter`. Module affinity is signaled by a clean `3px` left accent edge (`.card-sfla` in `#1f9d7a`, `.card-wca` in `#2298c7`, `.card-warn` in `#d8a33a`).
- **Metric Cells (`.stat-pill`)**: Divided dark cells (`#0c1520`) housing a short sentence-case label and a bold tabular figure with explicit units (`ms`, `NFE`, `iter`, `f(x)`).

### Navigation & Chrome
- **Top Bar (`54px` fixed)**: Brand mark on left, horizontal `18`-dot progress track in the center (active slide expands horizontally to `24px` in its module color), slide counter (`3 / 18` in tabular numerals) and tools (`P` Catatan, `?` Pintasan, Layar Penuh) on the right.
- **Bottom Bar (`46px` fixed)**: Module status indicator on left, keyboard legend in center, `Sebelumnya` / ` Berikutnya` transport buttons on right.

### Interactive Simulation Stage
- **Canvas Frame (`.canvas-wrap`)**: Deep `#060b12` ground with precomputed offscreen `ImageData` contour heatmap (`Sphere`, `Rastrigin`, `Rosenbrock`, `Ackley`), subtle contour isolines, crisp vector markers, and top-left HUD pill.
- **Convergence Chart**: Real-time Canvas 2D `log10(bestFitness)` curve with labeled Y-axis scale, NFE/iteration horizon, and legend markers.

## 5. Layout Principles

### Grid & Structure
- **Viewport Lock (`100dvh`)**: Full-viewport `16:9` deck shell (`height: 100dvh; overflow: hidden`) on desktop/projector (`> 1024px`), unlocking vertical scroll cleanly on smaller tablets/laptops (`<= 1024px`) so controls and canvases never clip.
- **Asymmetric Split (`.split-sim`, `1.38fr : 1fr`)**: All simulation sandboxes (Slides 6, 7, 8, 12, 13, 14, 17) dedicate `58%` width to the live 2D visualization stage and `42%` to stacked parameter controls, step telemetry, and convergence curves.

### Whitespace & Density Budget
- Maximum **3 cards** in a single row; maximum **4 concise items** per list.
- Every conceptual slide pairs concise Indonesian academic prose with a custom inline SVG schematic or live interactive widget—never walls of text.

## 6. Design System Notes for Stitch Generation & Anti-Patterns

### Language to Use
Describe screens as *"flat dark scientific telemetry deck with deep oceanic slate surfaces (`#09111a` / `#111e2d`), crisp 1px structural borders, high-contrast Plus Jakarta Sans projector typography, tabular numerals, and dual botanical-hydrological accents (`#1f9d7a` viridian and `#2298c7` cerulean)."*

### Component Prompts
- **Simulation Sandbox Screen**: *"16:9 dark telemetry slide (`#09111a`), sentence-case module header at top, 58/42 asymmetric two-column split: left side holds a framed 2D topographic contour plot with vector agent trajectories and play/pause/step transport bar; right side holds flat `#111e2d` parameter sliders with tabular readouts, a 4-cell KPI strip, and a log-scale convergence line chart."*
- **Algorithm Comparison Matrix**: *"16:9 dark academic presentation slide with a clean 7-row architectural table comparing SFLA (`#1f9d7a` viridian accent) vs WCA (`#2298c7` cerulean accent) across metaphor, hierarchy, exploration, exploitation, hyperparameters, and cloud scheduling workloads, zero gradients, zero emojis."*

### Explicit Anti-Patterns (Enforced by `taste-skill` & `taste-design`)
- **Zero Emojis as UI Icons**: Never use Unicode emojis (`🐸`, `🌊`, `⚡`, `☁️`, `👑`) in headings, buttons, badges, or canvas labels; use custom geometric SVGs, vector Canvas primitives, or clear text labels.
- **Zero Indigo/Purple AI Defaults**: Never use `#6366f1`, `#8b5cf6`, `#a78bfa`, or neon purple glows.
- **Zero Decorative Gradients or Glassmorphism**: No `linear-gradient` card fills, no gradient-clipped headings, no `backdrop-filter: blur()` cards, and no resting outer glows.
- **Zero Unlabeled Micro-Kickers or `01/02/03` Padding**: Avoid tiny uppercase letter-spaced eyebrows and decorative zero-padded index numbers.

