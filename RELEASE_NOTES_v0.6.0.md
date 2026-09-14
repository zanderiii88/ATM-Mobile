# Artists That Matter (ATM) Mobile v0.6.0

## Verified release counts

- Final app catalogue: **2,266 artists**
- Final Excel master: **2,266 artists**
- Removed: **10** exact unwanted entries
- Added to both app and workbook: **123** genuinely absent approved artists
- Reconciled: **Phoenix** was already in the v0.5.2 app and has now been restored to the workbook
- Existing profiles materially audited/improved: **55**
- Requested/approved names already present in the complete v0.5.2 catalogue: **106**
- Approved Stage 4 expansion candidates now present: **216 / 216**
- Unresolved requested additions/identities: **0**
- Duplicate normalised artist names: **0**
- Exact duplicated substantive profile groups: **0**

The count arithmetic reconciles cleanly: app `2,153 - 10 + 123 = 2,266`; workbook `2,152 - 10 + 123 + Phoenix = 2,266`.

## Cleanup and catalogue work

Removed: Airfric, Back Talk, BACKSLASH, Golden Cats, Monarch, Ozimov, Pearlene, Road Rage, The Milky Way and The Northern Lights.

Alias/punctuation checks were performed against the complete catalogue before adding artists. Existing entries such as Tatsuro Yamashita, Prince, Underworld and Jane's Addiction were retained rather than duplicated. Evelyn “Champagne” King, YĪN YĪN, N.W.A., Nick Cave & The Bad Seeds, and full-name classical entries such as Johann Sebastian Bach / Wolfgang Amadeus Mozart / Ludwig van Beethoven were reconciled with variant naming in the request.

## Profile-quality highlights

- Brian Wilson: rebuilt around baroque pop, psychedelic pop, sunshine pop and progressive pop; unrelated metal/prog recommendations removed.
- Casiopea: corrected to Japanese jazz fusion/jazz-funk rather than generic rock.
- De La Soul: corrected to alternative hip-hop/jazz rap rather than Experimental / Avant-Garde.
- Young Fathers: recast as alternative hip-hop/art-pop/indietronica/noise pop.
- AJJ: folk-punk/anti-folk identity restored and related-artist context tightened.
- 2Pac and Backxwash: separated into distinct West Coast/G-funk and industrial/horrorcore/trap-metal profiles rather than sharing generic recommendation logic.
- Art Blakey and Art Blakey & The Jazz Messengers: retained as separate but explicitly related credits.
- Diana Ross and Barry White received high-confidence soul/disco profiles as priorities.

## App changes and compatibility

- Version references updated to **v0.6.0**.
- Service-worker cache bumped to `atm-mobile-v060`.
- Home labels remain **Vibes** and **Music For...**; the Guide wording now matches.
- YouTube Music remains the primary music link and Spotify secondary.
- Existing local personal data remains compatible because the storage key is unchanged (`atm-mobile-v01`), preserving favourites, Want to Explore/dislikes, notes and recent listening/history data across the update.
- No deployment or live-site overwrite was performed. The ZIP is intended for the existing GitHub Pages repository root.

## Remaining weak profiles / coverage gaps

There are **812 High** and **1,454 Medium** profile-confidence rows, with **0 Needs Review** rows. “Medium” is not a claim that an artist is wrong; it means the profile still merits a more source-specific pass. Recognisable Medium examples that would be good future priorities include **David Bowie, Kendrick Lamar, Radiohead, Nirvana, Led Zeppelin, Fleetwood Mac, The Cure, Eminem, Gorillaz and Iron Maiden**.

The catalogue is still weighted heavily toward Rock (570) and Electronic (396). By primary genre, **Classical / Instrumental has 34 artists and Blues 25**, so both remain comparatively shallow despite this expansion. Tag-level coverage is also thin in several global traditions: roughly **7 salsa**, **8 reggaeton**, **4 Afrobeat**, **3 highlife** and **3 mbalax** matches; South Asian classical representation remains essentially centred on Ravi Shankar. These are sensible areas for a future depth pass rather than padding v0.6.0 with low-confidence additions.
