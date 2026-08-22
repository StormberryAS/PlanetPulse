# PlanetPulse

Sovereign, offline-first planetary tracker. PlanetPulse computes the real-time geocentric position of all eight classical planets plus five dwarf planets, entirely inside the browser, with zero external API calls.

**Live:** [planet.stormberry.as](https://planet.stormberry.as)

## Features
- **Keplerian orbital engine**: pure-JavaScript solver using J2000 mean orbital elements to compute heliocentric ecliptic longitudes, geocentric Right Ascension and Declination, and local Altitude and Azimuth for every planet in real time.
- **Interactive 2D orrery**: live top-down heliocentric map showing the six inner planets on their concentric orbit rings. Hover any planet dot to reveal its name.
- **Night-sky visibility filter**: three ways to set observer location (city search, GPS coordinates, device geolocation), then see which planets are above the local horizon right now.
- **Full coverage**: classical planets (Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune) plus dwarf planets (Ceres, Pluto, Haumea, Makemake, Eris) listed separately.
- **2,000+ city database**: shared with the rest of the Stormberry ecosystem (SunApp, MoonApp).
- **Auto-refresh**: orbital positions update every 60 seconds without any user action.

## Architecture
- **Vanilla HTML/CSS/JS**, no frameworks, no build step, no runtime dependencies.
- **Privacy first**, zero external API calls, zero tracking, zero cookies, fully offline-capable once loaded.
- Stormberry dark-mode glassmorphism design system, Inter typography.
- Keplerian two-body approximation (Newton iteration for eccentric anomaly, VSOP-87 mean elements, J2000 epoch). Accuracy roughly 1 degree, sufficient for observing and planning.
- **Sovereign AI**, built and maintained using high-speed agentic workflows.

## Credits
Built by [Stormberry AS](https://stormberry.as). Proudly powered by sovereign AI agents.

## Disclaimer

Supplied free of charge, **as is**, with no warranty of any kind. Using it creates no client or advisory relationship with Stormberry AS, and nothing it produces is professional advice.


This is a **functioning prototype**, not a certified instrument and not a professional service. Values are computed or modelled, not measured. Check anything that matters against an authoritative source before you act on it. Stormberry AS reimburses no cost or loss arising from use of this application.

Full terms: [DISCLAIMER.md](DISCLAIMER.md).
