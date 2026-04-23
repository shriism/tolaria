---
type: ADR
id: "0076"
title: "Built-in light/dark appearance toggle with system-following default"
status: active
date: 2026-04-22
---

## Context

ADR-0013 removed Tolaria's vault-based theming system and intentionally simplified the app to one hardcoded light appearance. That decision reduced maintenance cost, but it also removed a basic light/dark affordance that users now expect on desktop apps. The current request is narrower than the old theming system: restore a polished built-in dark mode without reviving vault theme documents, custom theme editing, or arbitrary token authoring.

## Decision

**Tolaria now supports two built-in app appearances, `light` and `dark`, with a system-following default only until the user explicitly chooses a mode.** Appearance remains an installation-local app setting (`appearance_mode` in `settings.json`), is exposed in Settings plus the status bar, and is implemented by swapping CSS tokens and editor surface modes rather than reintroducing vault-based theming.

## Options considered

- **Option A** (chosen): Add a built-in light/dark toggle with CSS-token overrides and installation-local persistence — restores dark mode with limited implementation surface and no vault complexity.
- **Option B**: Restore the old vault-based theme system — maximum customization, but too much maintenance cost and too many moving parts for this need.
- **Option C**: Keep light-only styling and add only a placeholder toggle — lowest effort, but misleading and does not satisfy the user need.

## Consequences

- Tolaria still has no user-authored themes, no `theme/` vault documents, and no live token editing UI.
- `src/index.css` becomes the single source of truth for both built-in appearances.
- App settings now persist `appearance_mode: "light" | "dark" | null`, where `null` means "follow the system on startup until the user chooses".
- The status bar and Settings panel both expose the same appearance control, keeping the feature discoverable without expanding the command surface much.
- Re-evaluation trigger: if users need more than two curated appearances, revisit a constrained preset system before reconsidering full theme authoring.
