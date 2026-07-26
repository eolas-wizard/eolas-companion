# Contributing

## Working agreement

- Keep shared capabilities in `engine/`
- Keep game-specific content in `games/<game-id>/`
- Preserve mobile-first behavior
- Avoid breaking existing local progress without a migration path
- Record architectural changes in `DECISIONS.md`
- Update `RELEASE_NOTES.md` with every release

## Before release

1. Validate JavaScript syntax.
2. Test all bottom-navigation destinations.
3. Test at narrow widths, browser zoom, and large text.
4. Verify notebook enablement, saving, and export.
5. Verify progress survives reload.
6. Verify service-worker paths and offline startup.
7. Confirm the ZIP extracts directly into a GitHub repository root.
