# ATM Mobile v0.19.5 — original mixtape baselines

Recovered the original 17 September assistant suggestions from conversation history: Euroshock 36 tracks; Soft Focus 36; Dancing to Disco 30; Dancing to Funk 30. User confirms the final playlists have only minor tweaks and authorises these originals as the baseline. The full 132 artist/title entries are preserved in MIXTAPE_BASELINES_v0.19.5.json, including the Röyksopp remix credit. They are not verified live playlist contents.

Runtime artist references now come from those baseline artists, with punctuation/diacritic normalisation. Song titles inform editorial interpretation, not measured audio features: Disco and Funk receive soft checks for their own style tags; Soft Focus gently penalises aggression above 4 and energy above 7; Euroshock favours its electro/house/techno/synth-pop territory. These thresholds are editorial choices, not extracted song measurements. Scenario score stays 72%, editorial score 28%. No direct membership bonus or exclusions exemption.

Whole-artist profiles still approximate the specific tracks; reference artists missing from ATM are retained in the saved baseline but cannot contribute numeric similarity. Resolved references: Euroshock 21/36; Soft Focus 20/36; Disco 12/30; Funk 26/30. None are silently added to the catalogue. This remains an editorial approximation pending optional final tracklist exports or track-level profiles.

The top twelve recommendations for all four lists remain unchanged in this test. The new soft checks adjust scores outside those leading lists, rather than claiming a large ranking improvement. Full before/after top-twelve lists are included in MIXTAPE_COMPARISON_v0.19.5.json.

Validation: all scenario scores finite/in range; disliked-artist exclusions; style keyword boundaries; positive/negative examples; Soft Focus aggression check; preserved catalogue rows, engine, styling, playlist URLs and atm-mobile-v01. Catalogue remains 3,014; no mobile/browser acceptance test or deployment performed.
