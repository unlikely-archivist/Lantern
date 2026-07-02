# The Lantern reset notes

This branch resets The Lantern back to its bones.

## Kept

- Static `index.html` site
- `data/` folder
- `data/archive-data.json` as the active gallery data source
- `data/references-data.json` as a reserved supporting data file
- `lantern-data.json` as an empty legacy placeholder so old references cannot repopulate the site
- `package.json` with validation only
- `scripts/validate-data.mjs`
- `scripts/build-data.mjs`, now reduced to a scaffold-only script and no longer exposed as an npm script

## Wiped / simplified

- Existing accumulated gallery records
- Root-level legacy image records in `lantern-data.json`
- Complex filter set
- Pagination
- Local liked/hidden state
- Lightbox/modal behavior
- Smithsonian auto-harvesting logic
- The `build:data` package script
- Any intentional GitHub Actions automation for the reset branch

## Current behavior

The site loads `data/archive-data.json` and renders any records in that array. If the array is empty, it shows a reset message.

The currently expected empty data files are:

```text
data/archive-data.json
data/references-data.json
lantern-data.json
```

Each should contain only:

```json
[]
```

## Next decision

Decide whether the next Lantern should be:

1. a manually curated gallery,
2. a Google Sheet-driven gallery,
3. an automated hunter/review/publish system,
4. or a hybrid where automation gathers candidates but only approved rows publish.
