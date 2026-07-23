# LexiGo Design System

## Назначение

LexiGo использует code-first design system: production CSS variables, React components, browser tests and visual regression snapshots form the source of truth. Figma remains an optional representation layer and must not introduce values that cannot be mapped back to production tokens.

Visual documentation is available at `/design-system`. The route is intentionally excluded from the primary product navigation and marked `noindex`.

## Source of truth

- Foundations and semantic tokens: `frontend/app/design-tokens.css`.
- Existing product implementation during migration: `frontend/app/premium-ui.css`.
- Visual documentation: `frontend/app/design-system/page.tsx`.
- Route-specific presentation: `frontend/app/design-system/design-system.module.css`.
- Contract tests: `frontend/app/design-tokens.test.ts` and `frontend/e2e/design-system.spec.ts`.

`design-tokens.css` is imported after `premium-ui.css`. This ordering is deliberate: legacy `--lx-*` variables are redefined as compatibility aliases to semantic roles without requiring a risky full-file rewrite. New components must consume semantic tokens directly.

## Token architecture

### Primitive tokens

Primitive tokens contain stable palette values and must not be consumed directly by product components unless the value represents a brand identity primitive.

Examples:

- `--lx-primitive-neutral-1000`
- `--lx-primitive-violet-500`
- `--lx-primitive-blue-500`
- `--lx-primitive-red-500`

### Semantic tokens

Semantic tokens describe purpose rather than appearance. They are the public contract for components and future themes.

Examples:

- `--lx-color-bg-canvas`
- `--lx-color-surface-default`
- `--lx-color-border-focus`
- `--lx-color-text-primary`
- `--lx-color-feedback-danger`

Future light mode must override semantic values. Components must not require structural changes when another theme is introduced.

### Typography

The scale ranges from `--lx-text-xs` to `--lx-text-display-lg`. Interface copy uses the system sans stack; code, SQL and API examples use `--lx-font-family-mono`.

Typography rules:

1. Do not introduce ad-hoc font sizes when a scale token matches the intended hierarchy.
2. Body text should use `--lx-leading-body` or `--lx-leading-relaxed`.
3. Display typography is reserved for one primary page heading or learning prompt.
4. Uppercase labels must remain short and must not carry essential meaning alone.

### Spacing

The base grid is 4 px. Use `--lx-space-1` through `--lx-space-24`.

Component-specific exceptions may temporarily preserve legacy geometry during migration, but new components should use the base scale. Mobile layouts use 16 px horizontal page padding unless a safe-area requirement is larger.

### Shape and touch targets

- Minimum interactive target: `--lx-size-touch-min` = 44 px.
- Comfortable touch target: `--lx-size-touch-comfortable` = 48 px.
- Reusable radii: `--lx-radius-sm` through `--lx-radius-4xl`.
- Pill controls use `--lx-radius-pill`.

Visible control dimensions may be smaller only when invisible padding provides the required hit area without overlap.

### Elevation

Use `--lx-shadow-sm`, `--lx-shadow-md`, `--lx-shadow-lg` and `--lx-shadow-xl`. Elevation communicates hierarchy; it must not be added only for decoration.

### Motion

Use `--lx-duration-fast`, `--lx-duration-normal`, `--lx-duration-slow` and the shared easing tokens. `prefers-reduced-motion: reduce` resolves all duration and movement-distance tokens to zero.

Functional state changes must remain understandable without animation.

## Component policy

1. One primary action per local task.
2. Loading, empty, success, warning, error and disabled states are part of the component contract.
3. Color is never the only state indicator.
4. Components must support keyboard navigation and visible focus.
5. Responsive behavior is specified for mobile, tablet and desktop before a component is considered complete.
6. PWA safe areas and virtual-keyboard behavior are validated on mobile routes.

## Migration strategy

The migration is incremental:

1. Define foundations and compatibility aliases.
2. Replace legacy values in shared controls and surfaces without visual changes.
3. Extract reusable React components and component-scoped styles.
4. Add documented variants and states to `/design-system`.
5. Rebuild product screens using the shared components.
6. Remove compatibility aliases only after repository search confirms that no production selector depends on them.

Each migration slice requires typecheck, unit tests, relevant Playwright tests and visual regression validation.
