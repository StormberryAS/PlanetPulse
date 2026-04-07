# PlanetPulse | Real-Time Planetary Positions

**PlanetPulse** is a sovereign, offline-first planetary tracker created by **Stormberry**. It computes the real-time geocentric position of all eight classical planets plus five dwarf planets — entirely inside your browser, with zero external API calls.

Live at **[planet.stormberry.as](https://planet.stormberry.as)**

---

## Features

- **Keplerian Orbital Mechanics Engine** — A lightweight, pure-JavaScript solver using J2000 mean orbital elements to compute heliocentric ecliptic longitudes, geocentric Right Ascension/Declination, and local Altitude/Azimuth for every planet in real-time.
- **Interactive 2D Orrery** — A live top-down heliocentric map showing all six inner planets on their concentric orbit rings. Hover any planet dot to reveal its name.
- **Night Sky Visibility Filter** — Three ways to set your observer location (City Search, GPS Coordinates, or Device Geolocation), then see which planets are currently above your local horizon.
- **Full Solar System Coverage** — Classical planets: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune. Dwarf planets listed separately: Ceres, Pluto, Haumea, Makemake, Eris.
- **2,000+ City Database** — Shared with the rest of the Stormberry ecosystem (SunApp, MoonApp).
- **Auto-Refresh** — Orbital positions update every 60 seconds without any user action.

## Technology Stack

- Pure **HTML5 / CSS3 / JavaScript** — no build step, no frameworks, no runtime dependencies.
- Stormberry dark-mode glassmorphism design system with Inter typography.
- Keplerian two-body approximation (Newton iteration for eccentric anomaly, VSOP-87 mean elements, J2000 epoch). Accuracy: ~1° — sufficient for observing and planning purposes.

## Sovereignty Principles

PlanetPulse follows Stormberry's core principles:

- **No tracking** — zero analytics, cookies, or fingerprinting.
- **No external API calls** — all mathematics runs locally in the browser.
- **Offline-capable** — works without an internet connection once loaded.

---

*Developed and maintained by [Stormberry A.S.](https://stormberry.as)*
