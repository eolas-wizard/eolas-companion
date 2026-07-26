# Design System

## Principles

- Mobile first, touch first
- No intentional module overlap
- Content must reflow under browser zoom and large-text settings
- Persistent primary navigation
- Clear purpose for every card
- Minimum practical touch target: 44 × 44 CSS pixels
- Do not communicate status through color alone

## Layout

- Use a single-column base layout
- Add columns only when enough width exists
- Cards must use fluid widths and safe text wrapping
- Respect device safe-area insets
- Avoid fixed heights for content modules

## Components

Shared components belong in the engine. Game-specific content belongs in a Companion Pack.

Core components include cards, progress tracks, status chips, bottom sheets, forms, toggles, navigation, and notebook entries.
