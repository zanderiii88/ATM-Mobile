# Artists That Matter Mobile v0.12.0

## Similarity Integrity release

This release keeps the catalogue at **2,500 artists** and focuses on the quality of Artist Match rather than adding more names or playlist features.

### Numeric-profile audit
- Recalibrated **945 artist sonic profiles** where old template scores or major numeric outliers were distorting recommendations.
- **728** profiles were rebuilt from artist-specific style tags, style families, genre and mood anchors because they were still carrying broad/template numeric scores.
- A further **217** profiles received targeted correction where individual numeric values strongly contradicted the artist's own style profile.
- Exact 11-factor sonic-profile diversity increased from **1,743 to 2,410 unique vectors**.
- The largest identical sonic-profile cluster fell from **230 artists to 6**.
- Before the audit, **702 artists** sat in identical-profile groups of 10 or more; after the audit, **none do**.

### Artist Match engine
- Closest Match now weights detailed style, related style families and sonic identity more heavily than the broad Primary Genre bucket.
- Added a conservative **soft family affinity** layer for genuine crossover relationships such as industrial rock / industrial metal / darkwave, shoegaze / dream-pop, related metal/hardcore branches, adjacent electronic lineages, and rap subgenres.
- Exact profile group size is now populated and used as a weak anti-template penalty.
- Recalibrated profiles have refreshed **Related** artists so the profile page reflects the improved recommendation geometry.

### HEALTH / Nine Inch Nails check
- HEALTH's sonic profile has been specifically corrected to reflect its substantial industrial/electronic-production identity alongside noise rock.
- In Closest Match, **Nine Inch Nails now ranks #4 from HEALTH**, while **HEALTH ranks #2 from Nine Inch Nails** in the v0.12.0 catalogue.

### Regression checks
Representative relationships remain strong after the wider audit, including Deftones → Loathe, Slowdive ↔ my bloody valentine, Portishead ↔ Massive Attack and Metallica ↔ Megadeth.

## Unchanged in this release
- Catalogue count remains **2,500**.
- Existing Road Trip / YouTube Music playlist functionality is unchanged.
- No additional Music For... playlist categories or bottom-navigation changes have been added in this round.
- Personal data remains under the stable localStorage key `atm-mobile-v01`.
- Artwork resolution behaviour is unchanged.

## Technical
- App version: **0.12.0**
- Service-worker cache: `atm-mobile-v0120`
- Release date: **2026-09-16**
