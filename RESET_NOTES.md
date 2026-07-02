# The Lantern reset notes

This branch resets The Lantern back to its bones.

## Kept

- Static `index.html` site
- `data/` folder
- `data/archive-data.json` as the gallery data source
- `data/references-data.json` as a reserved supporting data file
- `package.json` scripts
- `scripts/validate-data.mjs`
- `scripts/build-data.mjs`, now reduced to a scaffold-only script

## Wiped / simplified

- Existing accumulated gallery records
- Complex filter set
- Pagination
- Local liked/hidden state
- Lightbox/modal behavior
- Smithsonian auto-harvesting logic

## Current behavior

The site loads `data/archive-data.json` and renders any records in that array. If the array is empty, it shows a reset message.

The expected minimum record shape is:

```json
{
  "title": "Example title",
  "imgSrc": "https://example.com/image.jpg",
  "sourceUrl": "https://example.com/source",
  "caption": "Optional caption",
  "tags": ["#example"],
  "medium": "Photography",
  "time_period": "1900–1919",
  "collection_title": "Example Collection",
  "source_id": "SRC-EXAMPLE"
}
```

## Next decision

Decide whether the next Lantern should be:

1. a manually curated gallery,
2. a Google Sheet–driven gallery,
3. an automated hunter/review/publish system,
4. or a hybrid where automation gathers candidates but only approved rows publish.
