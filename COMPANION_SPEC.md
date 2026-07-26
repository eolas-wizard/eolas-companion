# Companion Pack Specification

Each Companion Pack lives in `games/<game-id>/` and should provide a manifest plus its game-specific data and optional assets.

## Minimum manifest

```json
{
  "id": "example-game",
  "title": "Example Game",
  "packVersion": "0.1.0",
  "status": "alpha",
  "defaultRegion": "Starting Area",
  "modules": ["regions", "progress", "notebook"]
}
```

## Core boundaries

The platform owns navigation, accessibility, themes, persistence, exports, notebook behavior, shared components, and offline support.

The Companion Pack owns terminology, entities, regions, mechanics, state dependencies, objectives, recommendations, and game-specific content.

## State dependencies

A pack may define relationships such as:

- Captured implies Seen
- Boss defeated implies Encountered
- Crafted implies Recipe learned

Dependencies must be explicit because they differ by game.

## Future loading model

Alpha 0.6 establishes the directory contract. A later platform release will load manifests dynamically and support selecting among installed Companion Packs.
