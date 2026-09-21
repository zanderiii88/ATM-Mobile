# ATM Mobile v0.19.2

## Mixtape matching

Euroshock, Soft Focus, Disco and Funk now compare candidates against their three nearest saved editorial reference artists, alongside style, family and sonic targets. Scenario fit remains 72% of the score; the editorial component remains 28%. Within the editorial component, reference similarity supplies 40% when at least three other references resolve. This preserves multiple musical strands rather than averaging a varied playlist into one profile.

Reference membership no longer earns a direct bonus or exempts an artist from avoidance rules. Self-comparisons are excluded. Text matching normalises punctuation/accents and uses word boundaries: electro no longer matches electroacoustic. Broad genre headings no longer supply specific style keyword evidence. Scores and resolved reference lists are cached for repeated rendering; replacing the catalogue invalidates the cache.

These four sets use the editorial anchors already in v0.19.1, NOT verified live tracklists. Attempts to retrieve the supplied YouTube Music pages failed. Other scenarios retain their current ranking and Aotearoa Calling remains playlist-only. Actual tracklist exports are needed to create verified track-based fingerprints for every mixtape, including artists outside ATM. No new playlist membership or audio features have been invented.

## Artist profile review

Scanned all 3,014 profiles for missing/thin tags, absent families, invalid/missing numeric traits, confidence-field differences and broad legacy era labels. No numeric-range, missing-family or thin-tag failures were found by these checks. 282 unique profiles were flagged: 161 have differing confidence fields and 146 use the broad 1970s–2020s era label (25 have both). These are review prompts, not confirmed errors. Confidence fields may represent different historical assessments; no automatic confidence changes or ranking penalties were applied.

Three targeted corrections: The Beatles now use a 1966 reference era and pop-rock/psychedelic/art-rock families; James Brown uses a 1970 reference era; Darkthrone gains raw black metal, blackened punk and heavy metal coverage instead of being framed as atmospheric black metal. These are editorial classifications; numeric traits remain unchanged. Darkthrone's stylistic range is supported by [Peaceville's band history](https://peaceville.com/bands/darkthrone/). Other attempted artist sources were inaccessible, so era corrections are explicitly editorial reference choices, not claimed new source verification.

PROFILE_CHANGES_v0.19.2.json records exact edits. PROFILE_REVIEW_QUEUE_v0.19.2.json holds the full flagged list. MIXTAPE_COMPARISON_v0.19.2.json records before/after top twelve and resolved reference counts. This is a structural scan plus a focused editorial review, not a manual verification of every artist. Generic soul profiles and uncertain historical eras still need individual research.

## Validation and compatibility

JavaScript syntax, all scenario result score bounds, keyword boundaries, contrasting music examples, disliked-artist exclusion and a repeated 50-seed Artist Match check. No mobile/browser acceptance test was performed. Catalogue stays at 3,014. Preserves atm-mobile-v01, six-button navigation, appearance, playlist URLs, and artwork. No deployment performed.
