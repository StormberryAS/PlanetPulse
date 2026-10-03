# PlanetPulse

Sovereign, offline-first planetary tracker. PlanetPulse computes where the seven other planets and five dwarf planets are in the sky, and whether you can see them, entirely inside the browser, with zero external API calls.

**Live:** [planet.stormberry.as](https://planet.stormberry.as)

## Features
- **Keplerian orbital engine**: a pure-JavaScript solver using the JPL Keplerian elements of Standish and Williams (Table 1, mean ecliptic and equinox of J2000, with their rates per century). Each orbit is solved for the eccentric anomaly and rotated in three dimensions by its argument of perihelion, inclination and ascending node, then seen from the Earth (allowing for light-time) as right ascension and declination, which are precessed to the date for the local altitude.
- **Interactive 2D orrery**: a top-down map of Mercury to Saturn on their orbit rings, seen from above the Sun's north pole, so the planets go round anticlockwise. Hover any planet dot to reveal its name.
- **Night-sky visibility**: set the place by city search or by typed coordinates, then see which planets are up. A decimal comma works as well as a point (`60,39` or `60.39`), and so does a typographic minus; anything out of range is refused with a message rather than computed. "Visible" means above the horizon with the Sun at least 6 degrees below it; otherwise the row says why ("Below the horizon", "Daylight" or "Twilight").
- **Planets and dwarf planets**: Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune, plus Ceres, Pluto, Haumea, Makemake and Eris listed separately from JPL Horizons osculating elements (epoch 1 January 2028). A fixed ellipse drifts as the planets pull on it, so Ceres is shown for 2017 to 2036 and the others for 1950 to 2099, the years in which each stays within 1 degree of Horizons.
- **25,007-city database**: shared with the rest of the Stormberry ecosystem (SunApp, MoonApp and others).

## Accuracy

Measured on 2 October 2026. Largest angle between PlanetPulse and the reference position, weekly from 2020 to 2032 (PyEphem 4.2.1, which uses VSOP87), and every 15 days from 2016 to 2036 for the dwarf planets (JPL Horizons):

| Body | Largest error |
|:-|-:|
| Mercury | 0.011° |
| Venus | 0.024° |
| Mars | 0.024° |
| Jupiter | 0.085° |
| Saturn | 0.083° |
| Uranus | 0.032° |
| Neptune | 0.013° |
| Ceres | 0.75° |
| Pluto | 0.10° |
| Haumea, Makemake, Eris | under 0.03° |

Altitudes for Bergen and Sydney agree with PyEphem to within 0.09°. Over the whole 1800 to 2050 span of the source table, Jupiter stays within 0.18° and Saturn within 0.23°. Altitudes are geometric: atmospheric refraction, which lifts a body near the horizon by about half a degree, is not applied.

## Architecture
- **Vanilla HTML/CSS/JS**, no frameworks, no build step, no runtime dependencies.
- **Privacy first**, zero external API calls, zero tracking, zero cookies, fully offline-capable once loaded. The page never asks for the device's location: a place comes from city search or from typed coordinates.
- Stormberry dark-mode glassmorphism design system, Inter typography.
- **Sovereign AI**, built and maintained using high-speed agentic workflows.

## Credits
Built by [Stormberry AS](https://stormberry.as). Proudly powered by sovereign AI agents.

## Disclaimer

Supplied free of charge, **as is**, with no warranty of any kind. Using it creates no client or advisory relationship with Stormberry AS, and nothing it produces is professional advice.


This is a **functioning prototype**, not a certified instrument and not a professional service. Values are computed or modelled, not measured. Check anything that matters against an authoritative source before you act on it. Stormberry AS reimburses no cost or loss arising from use of this application.

Full terms: [DISCLAIMER.md](DISCLAIMER.md).
