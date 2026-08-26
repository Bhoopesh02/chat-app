# Application Design Rules & UI Guidelines

## 1. Core Principles
- **Visual Hierarchy & Premium Aesthetics**: Maintain clean spacing (4px/8px grid system), backdrop glassmorphism, soft shadow elevations, and WCAG AA/AAA compliant contrast ratios.
- **Color Consistency**: Always use CSS Custom Properties (`var(--primary-color)`, `var(--text-primary)`, `var(--surface-color)`, etc.) rather than hardcoded HEX/RGB values.
- **Typography Rationale**: Standardize UI text on Inter font stack (`var(--sans)`), reserving monospace (`var(--mono)`) strictly for code snippets and system metrics.
- **Accessibility & Interaction**: Every interactive component must support ARIA attributes, focus outlines (`:focus-visible`), keyboard shortcuts (`Enter`, `Space`, `Escape`), and touch min-targets (44x44px).
- **Smooth Animations**: Micro-animations must use CSS transitions or Framer Motion springs (`type: "spring", stiffness: 300, damping: 30`).

---

## 2. Color System Matrix

| CSS Variable Token | Light Theme | Dark Theme | Role & Purpose | Usage Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `--primary-color` | `#18a999` | `#18a999` | Primary CTA, active tab, active state | High visual emphasis; vibrant teal brand identity. |
| `--primary-color-hover` | `#148f81` | `#148f81` | Primary hover state | Gives instant tactile feedback on interaction. |
| `--background-color` | `#f5f7fa` | `#16171d` | Canvas background | Off-white/slate dark canvas to reduce eye strain. |
| `--surface-color` | `#ffffff` | `#1f2028` | Cards, Modals, Panels | Elevated surface separating interactive elements from background. |
| `--text-primary` | `#1f2937` | `#f3f4f6` | Headings, main messages, inputs | High contrast for primary text readability. |
| `--text-secondary` | `#6b7280` | `#9ca3af` | Subtitles, timestamps, hints | Lower contrast for secondary metadata. |
| `--text-light` | `#9ca3af` | `#6b7280` | Placeholder text, disabled labels | Low contrast tertiary text. |
| `--border-color` | `#e5e7eb` | `#2e303a` | Panel borders, input outlines | Clean section demarcation. |
| `--danger-color` | `#ef4444` | `#ef4444` | Delete buttons, error states | High warning signal for destructive actions. |
| `--success-color` | `#10b981` | `#10b981` | Online indicators, success alerts | Clear visual feedback for positive outcomes. |
| `--warning-color` | `#f59e0b` | `#f59e0b` | Warnings, unread badges | Visual cue for pending attention. |

---

## 3. Typography Rules

| Level | Component | Size | Weight | Line Height | Reason & Context |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `h1` | `<Heading level={1}>` | `2.25rem` (36px) | 700 (Bold) | 1.2 | **Main Page / Welcome Headlines**: Establishes primary page anchor. |
| `h2` | `<Heading level={2}>` | `1.5rem` (24px) | 600 (SemiBold) | 1.3 | **Modal Titles & View Headers**: Top heading inside dialogs and sidebar headers. |
| `h3` | `<Heading level={3}>` | `1.25rem` (20px) | 600 (SemiBold) | 1.4 | **Card & User Names**: User profile names, group chat headers. |
| `h4` | `<Heading level={4}>` | `1.0rem` (16px) | 500 (Medium) | 1.4 | **Sub-section Labels**: Form group headers, dropdown titles. |
| `body` | `<Text variant="body">` | `0.9375rem` (15px) | 400 (Regular) | 1.5 | **Chat Messages & Body Text**: Standard conversational text. |
| `lead` | `<Text variant="lead">` | `1.0625rem` (17px) | 400 (Regular) | 1.6 | **Intro Subtitles**: Summary descriptions beneath main headings. |
| `caption` | `<Text variant="caption">` | `0.75rem` (12px) | 400 (Regular) | 1.4 | **Timestamps & Sub-labels**: Message timestamps, user email hints. |
| `code` | `<Text variant="code">` | `0.875rem` (14px) | 500 (Medium) | 1.4 | **Code Snippets**: Monospace code blocks and system metrics. |

---

## 4. Reusable Component Conventions
- Place core design system components in `src/components/ui/`.
- Export all components through `src/components/ui/index.js`.
- Always accept `className` and standard HTML props (`aria-*`, `style`, `onClick`, etc.).
