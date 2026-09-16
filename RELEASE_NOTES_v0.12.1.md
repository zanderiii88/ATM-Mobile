# ATM Mobile v0.12.1

## Mobile performance patch

This release focuses on smoother scrolling on Android/mobile screens while keeping the visual design and catalogue unchanged.

### Changes
- Changed the layered page background to normal scrolling on mobile instead of using `background-attachment: fixed`.
- Removed live backdrop blur from the fixed bottom navigation on mobile and replaced it with an almost-identical opaque/translucent treatment.
- Removed live backdrop blur from sticky action controls on mobile.
- Reduced the heaviest mobile card and hero shadows to lower repaint/compositing cost.
- Added conservative layout/style containment to the main Home card groups.
- Added **Music For** to the bottom navigation using a compact car icon.
- The Music For page now correctly highlights its new bottom-nav tab.
- Updated stale app metadata to v0.12.1 / 2,500 artists.

### Preserved
- Catalogue remains at **2,500 artists**.
- v0.12.0 similarity-integrity changes are unchanged.
- Existing Road Trip playlists and YouTube Music links are unchanged.
- Personal data continues to use the stable `atm-mobile-v01` storage key, so favourites, Want to Explore, dislikes, notes and history carry forward.
- No Cloudflare Worker or live-site deployment changes are included.

### Deferred
The additional playlist ideas discussed for **Head Nodding / Diff'rent Strokes**, **Pop Rocks**, **Air Guitar** and **Aotearoa Calling** remain deferred until the dedicated ATM YouTube Music / Spotify setup is ready.
