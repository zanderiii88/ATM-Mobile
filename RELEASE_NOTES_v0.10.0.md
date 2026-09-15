# Artists That Matter / ATM Mobile v0.10.0

Released: 2026-09-15

## Summary

- Catalogue: **2,498 artists** (**+88** from v0.9.0).
- Expansion focus: major **1980s and 1990s commercial/reference-point artists**, broadening recognisable starting points for Artist Match.
- **R. Kelly is explicitly excluded** from this release.
- Alanis Morissette was already present in the catalogue and was not duplicated.

## App changes

- **Artist Match:** keeps Closest Match / Broaden It / Wildcard and adds **Ranked / Randomiser** ordering for the returned recommendations.
- **Artist Match:** adds **Clear recent searches**, which clears only Artist Match search history and leaves favourites, Want To Explore, dislikes and notes untouched.
- **Vibes:** adds **Ranked / Randomiser** controls to both Quick Vibes and filtered results, while retaining **Pick one**.
- **Home:** Want To Explore now uses the magnifying-glass icon and Favourites uses the established star icon.
- **Artists in ATM:** the catalogue count is now a button opening a searchable full-catalogue browser, alphabetically grouped into collapsible letter sections.
- **Guide/Help:** updated for the new controls and uses the same icon language as the main app, including the list icons.
- Existing **Music For...**, artwork fallback, YouTube Music-first links and personal-data compatibility are retained.

## New artists

Ace of Base, Adam and the Ants, Aerosmith, Air Supply, Alan Jackson, Amy Grant, Anita Baker, Babyface, Bananarama, Billy Ocean, Bobby Brown, Bob Seger, Bon Jovi, Boyz II Men, Brandy, Brian McKnight, Brooks & Dunn, Bryan Adams, Bucks Fizz, Chicago, Cliff Richard, Color Me Badd.

Culture Club, Cyndi Lauper, Dave Matthews Band, Def Leppard, Dru Hill, Enrique Iglesias, En Vogue, Faith Evans, Foreigner, Frankie Goes to Hollywood, Garth Brooks, George Strait, Gerald Levert, Gloria Estefan, Goo Goo Dolls, Guns N' Roses, Hall & Oates, Hootie & the Blowfish, Huey Lewis & The News, Jodeci, John Mellencamp, Journey.

Keith Sweat, Kenny Loggins, Kenny Rogers, Kim Carnes, LeAnn Rimes, Lionel Richie, Madness, Matchbox Twenty, MC Hammer, Michael Bolton, Monica, New Kids on the Block, Olivia Newton-John, Pat Benatar, Paula Abdul, Phil Collins, Puff Daddy, Reba McEntire, REO Speedwagon, Rick Springfield, Ricky Martin, Rod Stewart.

Roxette, Selena, Shakin' Stevens, Sheena Easton, Sheryl Crow, Spandau Ballet, Starship, Status Quo, Steve Winwood, Survivor, SWV, Tevin Campbell, The Chicks, The Jam, The Pointer Sisters, Tina Turner, Toni Braxton, Tony! Toni! Toné!, UB40, Vanessa Williams, Wham!, Wilson Phillips.

## Integrity / compatibility

- App and workbook both contain **2,498 artists**.
- **0 normalised-name duplicates** found.
- The new artist recommendation references were checked against the live catalogue; no missing related-artist references remain in the added batch.
- Catalogue is sorted accent- and punctuation-insensitively.
- Personal data continues to use the stable `atm-mobile-v01` local-storage key.
- Service-worker cache updated to `atm-mobile-v0100`.
- Artwork resolver remains: known artwork map → TheAudioDB → secure YouTube fallback, with local caching.

## Research basis

The expansion was selected from 1980s/1990s high-selling and high-charting reference artists using Billboard decade/year-end material, Nielsen/SoundScan-era sales context and Official Charts material, then checked against the complete v0.9.0 catalogue before addition.
