# ATM Mobile v0.20.0

- 3,018 artists. Added Stone Temple Pilots, Porcupine Tree, A Perfect Circle and Puscifer.
- Added Deep Focus, It Got Weird and Neon & Noodles with supplied YouTube Music and Spotify links.
- Renamed 3AM to After Hours and Heartbreak to Heavy Heart, retaining their existing playlist URLs.
- Removed Sunday Morning, After the Party and Moping. Saved selections redirect to First Coffee, After Hours and Heavy Heart respectively.
- Sounds & Scenes replaces the ATM Mixtapes group and includes Pop Rocks and the new scene playlists.
- Existing playlist reference artists now come from the 21 September 2026 YouTube Music CSV. Folded source playlists are excluded, since destination lists already contain their merged selections. New playlists use agreed curation until a final track export is supplied.
- Scenario scoring remains 72%; editorial fit remains 28%. No membership bonus or automatic catalogue additions from playlist artists.
- Closest Match overlap and profile-quality adjustments now operate symmetrically. Equal pair scores do not guarantee equal rank in different candidate lists.
- Refined TOOL, Sleep Token, ELO and thrash-family profiles. TOOL now leads with A Perfect Circle; ELO with The Beatles. Metallica and Power Trip appear in each other's top 12 at 72%.
- Stable localStorage key atm-mobile-v01, six-button navigation, visual assets and styles preserved.

## Validation
Passed JavaScript syntax checks, catalogue uniqueness/count, all preset score bounds, dislikes, saved-state migration, reciprocal scoring across adjacent catalogue pairs and targeted ranking regressions.
Browser smoke testing could not run: Chromium is not installed in the build environment. Outbound playlist destinations were copied from user-provided links, not independently playback-tested.

## Deployment
Upload the contents of this ZIP to the existing GitHub Pages repository root, replacing matching runtime files. The ZIP has no enclosing directory. Includes the updated service worker and version metadata. No deployment has been performed.
Historical audit and release files retain their original versions. MIXTAPE_AUDIT_v0.20.0.json and MIXTAPE_BASELINES_v0.20.0.json describe this release.
