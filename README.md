# The Lantern

The Lantern is a public-facing visual archive site.

## Site structure

- Home
- Archive
- Artist References

## Data flow

The Google Sheet is the source of truth for reviewed and approved records.

GitHub is responsible for:

1. Reading approved JSON payload rows from the spreadsheet.
2. Validating the payloads.
3. Assembling valid JSON arrays.
4. Writing:
   - `data/archive-data.json`
   - `data/references-data.json`
5. Publishing the Lantern site.

Hunter is not the publisher. Hunter discovers sources, reviews images, and writes queue/status/suggestion data to the spreadsheet.

## Planned branches

- `90s-lantern`: darker, mysterious, early-web, rabbit-hole oriented.
- `monty-lantern`: storybook, illustrated, Lantern banner, Monty character.
