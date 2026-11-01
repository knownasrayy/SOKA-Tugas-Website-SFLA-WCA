---
name: ITS Metaheuristic Cloud Computing Interface
projectId: '11288588710972324877'
designSystemAsset: 'assets/66814ab3c1ab4a94ab1c9fd0737ecce8'
colors:
  background: '#03132b'
  on-background: '#d6e3ff'
  surface: '#0b1b34'
  surface-dim: '#03132b'
  surface-bright: '#26354e'
  surface-container-lowest: '#000e25'
  surface-container-low: '#0b1b34'
  surface-container: '#102038'
  surface-container-navy: '#192841'
  surface-container-high: '#1b2a43'
  surface-container-highest: '#26354e'
  surface-variant: '#233f7c'
  on-surface: '#d6e3ff'
  on-surface-variant: '#b8c5d9'
  outline: '#243f81'
  outline-variant: '#1b3163'
  primary: '#127bbe'
  on-primary: '#03132b'
  primary-container: '#233f7c'
  on-primary-container: '#d6e3ff'
  secondary: '#26aee4'
  on-secondary: '#03132b'
  secondary-container: '#103454'
  on-secondary-container: '#cee5ff'
  tertiary: '#fdbb16'
  on-tertiary: '#261900'
  tertiary-container: '#3d2c05'
  on-tertiary-container: '#ffdf9e'
  sfla-tosca: '#12b0a2'
  wca-sky: '#26aee4'
  its-light-blue: '#75bde0'
  its-crusta: '#f47d52'
  error: '#e05a5f'
  error-brick: '#b31e23'
  on-error: '#2b0608'
typography:
  page-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
    letterSpacing: -0.02em
  section-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
    letterSpacing: -0.015em
  card-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
    letterSpacing: -0.01em
  body:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 23px
    letterSpacing: '0'
  kpi-value:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 28px
    letterSpacing: -0.02em
    fontVariantNumeric: tabular-nums
  code-formula:
    fontFamily: Ubuntu Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: '0'
rounded:
  sm: 6px
  DEFAULT: 8px
  md: 10px
  lg: 12px
spacing:
  unit: 8px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
---

# Design System: ITS Metaheuristic Cloud Computing Interface

## 1. Visual Theme & Institutional Direction

Built for **Strategi Optimasi Komputasi Awan (SOKA) – Institut Teknologi Sepuluh Nopember (ITS)**, this system replaces generic slide-deck templates with a **4-Tab Scientific Engineering Workbench**. Rather than mimicking PowerPoint slides (`1 / 18` counters, Prev/Next footers, centered cover splash pages, or glowing neon blobs), the application behaves like a disciplined numerical laboratory where every tab opens a scrollable workspace of live 2D contour simulations, algorithmic state machines, mathematical formulations, and real-time telemetry.

All color tokens derive directly from the **Official ITS Brand Guidelines** (Palet Warna Primer Lambang & Logo ITS, Hal. 22; Palet Warna Sekunder Fakultas & Sekolah ITS, Hal. 23) paired with Stitch project `projects/11288588710972324877` (`assets/66814ab3c1ab4a94ab1c9fd0737ecce8`), calibrated against `design-taste-frontend` (`app-screens.md`) anti-slop rules: flat dark surfaces, crisp `1px` structural borders, zero decorative gradients, zero backdrop blur, zero Unicode emojis, and strict `tabular-nums` alignment on every live figure.

## 2. Official ITS Color Palette & Semantic Roles

### Institutional Primary Colors (Hal. 22 Panduan Identitas ITS)
- **Biru Tua Lambang (`#127BBE`)**: Primary institutional interactive fill, primary action buttons (`Mulai`), active parameter controls, and ITS emblem core.
- **Biru Tua Logo (`#233F7C`)**: Active control containers, elevated interactive states, and selected sub-workbench tabs.
- **Biru Cover (`#243F81`)**: Technical `1px` structural borders, divided KPI strip hairlines, and flat ruled table borders.
- **Biru Muda Lambang (`#75BDE0`)**: Secondary hydrological stream vectors, subtle diagram strokes, and calm chart annotations.
- **Kuning Tua Logo (`#FDBB16`)**: Strictly reserved for highest-priority semantic markers: active top-tab underline indicator (`2px solid #FDBB16`), Global Optimum (`X_g` / `Laut`), minimum fitness achievement, and keyboard `:focus-visible` outlines.

### Faculty Secondary Accents & Dark Telemetry Surfaces (Hal. 23 + Stitch Dark Canvas)
- **Abyssal ITS Ground (`#03132B`)**: Root workspace background, preventing projector glare while maximizing 2D contour contrast.
- **Workspace Header & Low Surface (`#0B1B34` / `#102038`)**: Top institutional navigation shell, simulation docks, and flat workspace cards.
- **SIMT Biru Navy (`#192841` / `#1B2A43`)**: Raised interactive panels, formula callout wells, and hover states.
- **FKK Medical Tosca (`#12B0A2`)**: Primary **SFLA** algorithmic signature (lotus pond habitat, Memeplex M1, SFLA convergence line, and SFLA VM schedule bars).
- **FTK Summer Sky (`#26AEE4`)**: Primary **WCA** algorithmic signature (river flow vectors, hydrological runoff, WCA convergence line, and WCA VM schedule bars).
- **FV Crusta (`#F47D52`)**: Auxiliary memeplex differentiation (`M4`) and distinct task-block coding.
- **FTIRS Fire Bricks (`#B31E23` / lifted `#E05A5F`)**: Worst-frog random reset indicator (`Reset Acak`), local-minimum trap highlight, and unoptimized Round-Robin Makespan baseline.

### Accessible Text Hierarchy
- **Primary Ink (`#D6E3FF` / `#ECF3FF`)**: Page headings, body copy, and primary KPI numerals (`> 12.8:1` contrast on `#03132B`).
- **Secondary Ink (`#B8C5D9`)**: Descriptions, axis labels, and table cells (`> 7.8:1` contrast on `#102038`).
- **Muted Metadata (`#8A99B2`)**: Units, parameter bounds, and secondary captions (`>= 4.8:1` contrast on `#102038`).

## 3. Typography & Numeric Discipline

- **UI & Editorial Face (`Plus Jakarta Sans`, local variable TTF)**: Sentence-case headings, clean Indonesian engineering prose, and `font-variant-numeric: tabular-nums` across all live counters, coordinates, and tables so figures never jitter at `60 FPS`.
- **Literal Formulas & Code (`Ubuntu Mono`, local TTF)**: Scoped strictly to `<code>`, `<pre>`, `<kbd>`, and `<samp>` elements for mathematical equations (`D_i = rand() * (X_b - X_w)`, `NS_n`, `d_max` decay, `Makespan`).

## 4. Navigation & 4-Tab Information Architecture

Instead of linear slide pagination, the application uses a sticky institutional top bar (`header.workspace-header`) housing:
1. **Left**: Inline geometric ITS Gear-Crest SVG + course identity (`Strategi Optimasi Komputasi Awan · Institut Teknologi Sepuluh Nopember`).
2. **Center (`role="tablist"`)**: Four flat module tabs marked by a crisp `2px solid #FDBB16` bottom selection rule:
   - **Konsep & Lanskap** (`#konsep`) — Course/team identity, clickable 2D Benchmark Landscape Explorer (`Sphere`, `Rastrigin`, `Ackley`), interactive Exploration vs Exploitation Simulator, and SFLA/WCA conceptual taxonomy.
   - **Simulasi SFLA** (`#sfla`) — 7/5 live Kolam Teratai simulation laboratory (inline hyperparameters, divided KPI strip, real-time convergence chart) + interactive SFLA mechanism workbench (Round-Robin partitioning, 3-scenario leap sandbox, global shuffle, and 6-step formal table).
   - **Simulasi WCA** (`#wca`) — 7/5 live Siklus Air simulation laboratory (inline hyperparameters, `d_max` evaporation ring, role-swap telemetry, convergence chart) + interactive WCA hydrological workbench (`NS_n` proportional allocation, `C=2` flow & role swap, adaptive `d_max` evaporation/rain, and 6-step formal table).
   - **Komparasi & Cloud VM** (`#komparasi`) — Synchronized SFLA vs WCA head-to-head arena (identical seed & initial coordinates, dual canvases, combined convergence curve, flat ruled comparison matrix) + 16-Cloudlet / 4-VM Heterogeneous Cloud Scheduling Makespan simulator + academic synthesis & references.
3. **Right**: Utility actions (`Catatan`, `Pintasan`, `Layar Penuh`).

## 5. Anti-Slop House Rules (`design-taste-frontend` + `ponytail`)

- **No Slide Chrome**: Zero `1 / 18` counters, zero dot tracks, zero Next/Prev footers, zero locked `overflow: hidden` viewports.
- **No Decorative Gradients or Glass**: Zero `linear-gradient` / `radial-gradient` CSS fills, zero `backdrop-filter`, zero resting `box-shadow` glows.
- **No AI Clichés**: Zero stacked pill-badges above headings, zero two-color `<span class="accent">` split headlines, zero purple/indigo (`#4B0082`, `#6366F1`), zero Unicode emojis, and zero invented vanity stats—every displayed number comes live from the deterministic simulation engines.
