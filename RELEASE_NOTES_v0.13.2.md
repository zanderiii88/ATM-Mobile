# ATM Mobile v0.13.2

Released: 2026-09-16

## What changed
- Retained the new **cassette tape** bottom-nav icon for **Music For...**.
- Alphabetised the playlist cards within each Music For... heading.
- Reordered the Music For... headings so that **playlist-enabled headings appear first**, with headings alphabetised within that tier.
- Non-playlist headings are then shown afterwards, also alphabetised.
- Bumped app metadata, version references and service-worker cache to v0.13.2.

## Ordering rule now used
1. Headings that contain real ATM playlists come first, sorted A–Z.
2. Headings without configured playlists come afterwards, also sorted A–Z.
3. Inside each heading, playlist/moment cards are sorted A–Z by label.

## Scope
This is a UI / organisation patch. The catalogue remains at **2,500 artists** and no recommendation logic, playlist URLs or user data storage keys were changed.

## Compatibility
- Existing favourites, Want To Explore, dislikes, notes and listening history remain compatible.
- No workbook update is required for this release.
