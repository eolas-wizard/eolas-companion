# Eolas Companion — Palworld Alpha 0.5

A mobile-first, installable GitHub Pages playtest build.

## What is new

- Rich Pal profiles with acquisition methods including wild/world encounters, fishing, Alpha bosses, dungeons or boss realms, eggs, and breeding.
- Practical “Why capture this Pal?” guidance, work suitability, partner skills, drops, companion notes, and detailed progress tracking.
- Optional Alpha Notebook on the Journey page.
- Notebook entries remain in the browser's local storage and are included in full app backups.
- Notebook can also be exported separately as Markdown.

## Alpha Notebook privacy

This is a static GitHub Pages app. The notebook is hidden by default and stored only on the current device, but it is not an authenticated secure account. Anyone using the same browser profile/device could open it after it is enabled. True private access would require authentication and a backend in a later release.

## Upload to GitHub Pages

Extract this ZIP and upload all files and folders from the extracted root to the root of the GitHub repository, replacing the existing app files. Keep `.nojekyll` and the `icons` folder.

After deployment, close old tabs and reopen the site. If the previous PWA remains cached, refresh twice or remove and reinstall the PWA.


## Alpha 0.5.1 layout fix
- Removed the intentional card overlap between Choose Your Adventure and Current Journey.
- Added a consistent 24px separation so both modules remain visually distinct on mobile.
- Bumped the service-worker cache to force the corrected layout to load.
