---
description: Conventions for the Taskettle Vue 3 frontend & cozy design system.
applyTo: "apps/web/**/*.{vue,ts}"
---

# Frontend instructions

## Components
- Vue 3 `<script setup lang="ts">`. Type props/emit with `defineProps`/`defineEmits`.
- Components are presentational. Data fetching & mutations live in Pinia stores.
- All HTTP goes through `src/lib/api.ts`. Never call `axios`/`fetch` directly
  in a component.

## State (Pinia)
- `auth` — user, token, login/register/logout, `isAuthenticated`.
- `board` — current circle, tasks grouped by status, optimistic move/assign.
- `notifications` — list, unread count, polling.
- Module stores — `inventory` (incl. shopping list), `wallet`, `assets`,
  `recurring-expenses`, `vehicles`, `maintenance`, `business`. Each owns its
  module's API calls and state.
- Optimistic updates must roll back on API error.

## Design system (cozy "Family Hearth")
Use Tailwind token classes only — never hardcode hex:
- Colour: `bg-primary` (sage), `bg-secondary` (dusty rose), `bg-tertiary`
  (lavender), surfaces `bg-surface`, `bg-surface-container[-low/-high]`,
  text `text-on-surface`, `text-on-surface-variant`, `text-primary`.
- Type: headings `font-headline-xl/lg` (Plus Jakarta Sans), body
  `font-body-md/lg` (Be Vietnam Pro), labels `font-label-md`.
- Radius: `rounded-lg` inputs/buttons, `rounded-xl` cards/modals,
  `rounded-full` chips/avatars. No sharp corners.
- Spacing: use cozy tokens `gap-stack-sm/md/lg`, `p-stack-md`.
- Icons: `<span class="material-symbols-outlined">icon_name</span>`.
- Status chips: tinted background + darker text, pill-shaped.
- Buttons: primary = solid sage; secondary = dusty-rose ghost/outline;
  add a subtle `active:scale-95` "squish".

## Responsiveness
- Mobile first. Board columns scroll horizontally or stack; keep a prominent
  "Fast Add" entry point. Generous tap targets (≥44px).

## Accessibility
- Label every input. Buttons have discernible text or `aria-label`.
- Maintain AA contrast (the warm-brown `on-surface` on cream passes).
