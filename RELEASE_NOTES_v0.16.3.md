# ATM Mobile v0.16.3

## Updates and navigation

- Fixed the service-worker update path that could leave the app shell on an older version while reporting a newer release as available.
- New releases now activate automatically and refresh open ATM tabs onto the latest app shell.
- Core app files use a network-first strategy while retaining offline fallbacks.
- The update notice can now be tapped to request the latest version directly.

## Mixtapes

- Renamed the visible **Music For...** section to **Mixtapes** throughout the app.
- Replaced the combined pot, car and bed homepage graphic with a single cassette icon matching the bottom navigation.
- Internal routes and saved-state fields remain unchanged for compatibility.

## Preserved

- Catalogue remains at **2,496 artists**.
- Personal data continues to use the stable localStorage key `atm-mobile-v01`.
- The six-button bottom navigation remains in place.
