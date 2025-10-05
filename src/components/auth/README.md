# Auth Split View

A combined authentication view that unifies Login and Register with a diagonal interactive slash toggle. Designed for accessibility, theming, and responsiveness.

Components:
- AuthSplitView.vue — layout + diagonal slash + toggle + state/persistence
- LoginForm.vue — login fields, client-side validation, loading, and events
- RegisterForm.vue — register fields, client-side validation, loading, and events
- AuthBrand.vue — small brand/identity area
- FormError.vue, SubmitButton.vue — small helpers

Routing:
- New route: `/auth` (and `/auth-preview` as a simple preview). Existing `/login` and `/register` remain untouched.

Props (AuthSplitView):
- brandName?: string — app/brand name (default: "Cloud")
- initialMode?: 'login'|'register' — default state (default: 'login')
- persistKey?: string — localStorage key (default: 'auth_mode')
- urlSync?: boolean — sync `?mode=login|register` in URL (default: true)

Events:
- loginSuccess, registerSuccess — emitted on successful submit
- authError(message: string) — emitted on API failure

Theming:
- Uses CSS variables with sensible defaults:
  - --auth-accent (defaults to var(--color-brand-600))
  - --auth-accent-weak (defaults to var(--color-brand-400))
  - --auth-surface (defaults to var(--color-surface-muted))
  - --auth-muted (defaults to rgb(var(--color-text-secondary)))
- In dark mode, colors inherit from the global tokens defined in `src/assets/main.css`.

Accessibility:
- Proper labels and role/aria attributes
- Toggle button on the slash is keyboard focusable, `role="button"`, `aria-pressed`, and responds to Enter/Space
- Forms expose inline validation and an ARIA live region for errors
- Reduced motion honored via `prefers-reduced-motion`

Responsive behavior:
- ≥1024px: two panels visible; diagonal slash sits closer to the right in Login mode and animates left in Register mode; active side highlighted, inactive side muted (slight blur + lower brightness)
- 768–1023px: diagonal remains; layout compresses
- <768px: collapses to stacked view; slash becomes a horizontal divider with centered toggle; inactive form collapses

Integration:
- Import and use the view under `/auth` route or embed `<AuthSplitView />` where needed
- Success handlers typically redirect to `/drive` or a `redirect` query param

Tests:
- Basic unit tests for the state machine and validation in `tests/`
- Run with `pnpm test` (after installing dev deps)

Notes:
- This view reuses existing auth API handlers (userLogin, userRegister) and does not remove old routes/pages.
