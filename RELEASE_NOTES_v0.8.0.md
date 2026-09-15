# Artists That Matter / ATM Mobile v0.8.0

Released: 2026-09-15

## Summary
Feature release focused on Music For..., artwork reliability, icon consistency and a small catalogue update.

## Catalogue
- Final count: **2,299 artists**.
- Added: **Frost Children** and **Water from Your Eyes**.
- **Laurie Anderson** was already present; her profile was re-researched and materially improved rather than duplicated.
- No artists removed.

## Music For...
- Added **Drifting Off** for very quiet ambient / minimal / low-energy listening when falling asleep.
- Added **"Bedtime" 😉** for sensual, intimate, low-lit recommendations. The quotation marks are intentional.
- Added **Ranked** mode (podium icon), which restores the original relevance ordering.
- Added **Randomiser** mode (dice icon), which reshuffles the qualifying recommendation pool each time it is pressed.
- Existing **Pick one** behaviour is retained and chooses from the current shortlist.

## UI / icons
- Match in the bottom navigation now uses the same **person → person** visual language as Artist Match on the home page.
- Vibes continues to use the waveform icon in both home and bottom navigation.
- Favourites uses the star language already used by ATM artist favourites.
- Music For... now uses a clearer **steaming pot + car + bed** icon rather than the ambiguous frying-pan symbol.
- Guide / Help feature headings reuse the same icons as the live app.

## Artwork reliability
Lookup order is now:
1. lightweight local `artwork.json` known-artwork/override map;
2. TheAudioDB artist search, accepting only an exact normalised artist-name match;
3. existing ATM secure YouTube artwork Worker as fallback.

Successful provider resolutions are cached locally to reduce repeat lookups. The artwork cache was moved to `atm-mobile-artwork-v2` so old unlabelled results do not inherit the wrong retention period.

- TheAudioDB / known artwork metadata: cached for up to 180 days.
- YouTube-derived metadata: refreshed within 29 days to stay inside YouTube's 30-day storage rule for non-authorised API data.
- Failed lookups: cached for 24 hours to avoid repeatedly burning provider requests.
- ATM does **not** bundle or permanently copy thousands of image files into the app. Image files remain provider-hosted and normal browser HTTP caching applies.

The Guide includes TheAudioDB attribution and a source link.

### TheAudioDB availability caveat
TheAudioDB's current v1 documentation still publishes the public `123` key and documents artist-name search, while its pricing page currently presents name search as a Single Developer feature. ATM therefore treats TheAudioDB search as **best effort** and fails cleanly to the existing YouTube artwork service if it is unavailable. A private/premium AudioDB key would be required if the provider enforces paid artist-name search for this use case.

Official references:
- https://www.theaudiodb.com/free_music_api
- https://www.theaudiodb.com/docs_terms_of_use.php
- https://www.theaudiodb.com/pricing
- https://developers.google.com/youtube/terms/developer-policies

## Compatibility
- Personal-data key remains `atm-mobile-v01`, preserving favourites, dislikes, notes, Want to Explore and listening history.
- Service-worker cache bumped to `atm-mobile-v080`.
- `artwork.json` is intentionally tiny and contains URLs/IDs only when overrides are later added; it does not contain image files.

## Deployment
Nothing has been deployed to the live GitHub Pages site or Cloudflare Worker by ChatGPT.
