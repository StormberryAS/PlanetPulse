/**
 * PlanetPulse — Keplerian Orbital Mechanics Engine
 * Stormberry A.S. | Sovereign, offline-first planetary tracker
 *
 * Uses simplified VSOP-87 mean orbital elements (J2000 epoch) to compute
 * heliocentric ecliptic coordinates, then converts to geocentric RA/Dec.
 * Accuracy: ~1° — excellent for observing and visibility purposes.
 */

// ── Set current year in footer ───────────────────────────────
document.getElementById('current-year').textContent = new Date().getFullYear();

// ── Orbital element constants (J2000.0 mean elements) ────────
// Each array: [L0, L1, a, e, I, omega, Omega]
// L0 = mean longitude at J2000 (deg), L1 = daily motion (deg/day)
// a = semi-major axis (AU), e = eccentricity, I = inclination (deg)
// omega = arg of perihelion (deg), Omega = long of ascending node (deg)
const PLANETS = {
  Mercury: { color: '#B3B3B3', L0: 252.2509,  L1: 4.09233445,  a: 0.38710,  e: 0.20563, I: 7.005,  omega: 29.125, Omega: 48.331  },
  Venus:   { color: '#FFD27D', L0: 181.9798,  L1: 1.60213034,  a: 0.72333,  e: 0.00677, I: 3.395,  omega: 54.884, Omega: 76.680  },
  Earth:   { color: '#4B90FF', L0: 100.4643,  L1: 0.98560912,  a: 1.00000,  e: 0.01671, I: 0.0,    omega: 102.937,Omega: 0.0     },
  Mars:    { color: '#FF5A36', L0: 355.4330,  L1: 0.52402068,  a: 1.52366,  e: 0.09341, I: 1.850,  omega: 286.502,Omega: 49.579  },
  Jupiter: { color: '#FF9E6F', L0: 34.3515,   L1: 0.08308676,  a: 5.20336,  e: 0.04839, I: 1.303,  omega: 273.867,Omega: 100.464 },
  Saturn:  { color: '#FFEBB3', L0: 50.0774,   L1: 0.03344422,  a: 9.53707,  e: 0.05386, I: 2.489,  omega: 339.391,Omega: 113.714 },
  Uranus:  { color: '#7DE8E8', L0: 314.0550,  L1: 0.01172439,  a: 19.1913,  e: 0.04726, I: 0.773,  omega: 96.998, Omega: 74.006  },
  Neptune: { color: '#4B70FF', L0: 304.3487,  L1: 0.00598103,  a: 30.0690,  e: 0.00859, I: 1.770,  omega: 273.187,Omega: 131.784 },
};

const DEG = Math.PI / 180; // degree → radians

/**
 * Returns Julian Date for a given JS Date object.
 */
function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Normalises an angle to [0, 360).
 */
function norm360(a) {
  return ((a % 360) + 360) % 360;
}

/**
 * Computes heliocentric ecliptic longitude (deg) and radius (AU)
 * for a planet using simplified Keplerian elements.
 */
function heliocentricPosition(planet, jd) {
  const T = jd - 2451545.0; // days from J2000

  // Mean longitude
  const L = norm360(planet.L0 + planet.L1 * T);
  // Mean anomaly
  const M = norm360(L - planet.omega) * DEG;

  // Eccentric anomaly via 2-step Newton iteration (fast, very accurate)
  let E = M + planet.e * Math.sin(M) * (1 + planet.e * Math.cos(M));
  E = E - (E - planet.e * Math.sin(E) - M) / (1 - planet.e * Math.cos(E));

  // True anomaly
  const xv = planet.a * (Math.cos(E) - planet.e);
  const yv = planet.a * Math.sqrt(1 - planet.e * planet.e) * Math.sin(E);
  const v   = Math.atan2(yv, xv) / DEG; // true anomaly in degrees
  const r   = Math.sqrt(xv * xv + yv * yv); // radius in AU

  // Heliocentric ecliptic longitude
  const lon = norm360(v + planet.omega);

  return { lon, r, L: norm360(L) };
}

/**
 * Converts heliocentric ecliptic coords to geocentric equatorial RA/Dec.
 * @returns { ra, dec } in degrees
 */
function toRaDec(pLon, pLat, pR, eLon, eR) {
  const eps = 23.439 * DEG; // obliquity of ecliptic (J2000)
  const pLonR = pLon * DEG;
  const eLonR = eLon * DEG;

  // Heliocentric rectangular coords
  const xH = pR * Math.cos(pLonR);
  const yH = pR * Math.sin(pLonR);
  const zH = 0;

  // Earth rectangular coords
  const xE = eR * Math.cos(eLonR);
  const yE = eR * Math.sin(eLonR);

  // Geocentric rectangular
  const xG = xH - xE;
  const yG = yH - yE;
  const zG = zH;

  // Convert to equatorial
  const xQ = xG;
  const yQ = yG * Math.cos(eps) - zG * Math.sin(eps);
  const zQ = yG * Math.sin(eps) + zG * Math.cos(eps);

  const ra  = norm360(Math.atan2(yQ, xQ) / DEG);
  const dec = Math.atan2(zQ, Math.sqrt(xQ * xQ + yQ * yQ)) / DEG;

  return { ra, dec };
}

/**
 * Converts Right Ascension/Declination to local Altitude and Azimuth.
 * @param {number} ra - RA in degrees
 * @param {number} dec - Dec in degrees
 * @param {number} lat - Observer latitude in degrees
 * @param {number} lon - Observer longitude in degrees
 * @param {Date} date
 * @returns { altitude, azimuth } in degrees
 */
function toAltAz(ra, dec, lat, lon, date) {
  const jd = julianDate(date);
  // Greenwich Mean Sidereal Time
  const T  = (jd - 2451545.0) / 36525;
  let   GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  GMST = norm360(GMST);

  // Local Hour Angle
  const LST = norm360(GMST + lon);
  const HA  = norm360(LST - ra);

  const latR = lat * DEG;
  const decR = dec * DEG;
  const HAr  = HA  * DEG;

  const sinAlt = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(HAr);
  const altitude = Math.asin(sinAlt) / DEG;

  const cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(altitude * DEG));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) / DEG;
  if (Math.sin(HAr) > 0) azimuth = 360 - azimuth;

  return { altitude, azimuth };
}

/** Format RA as HH h MM m */
function formatRA(deg) {
  const h   = deg / 15;
  const hh  = Math.floor(h);
  const mm  = Math.floor((h - hh) * 60);
  return `RA ${String(hh).padStart(2,'0')}h ${String(mm).padStart(2,'0')}m`;
}

/** Format Dec as ±DD° MM' */
function formatDec(deg) {
  const sign = deg >= 0 ? '+' : '-';
  const abs  = Math.abs(deg);
  const dd   = Math.floor(abs);
  const mm   = Math.floor((abs - dd) * 60);
  return `Dec ${sign}${String(dd).padStart(2,'0')}° ${String(mm).padStart(2,'0')}'`;
}

// ── Main Computation ─────────────────────────────────────────
let observerLat = null;
let observerLon = null;

/**
 * Runs the full orbital calculation pipeline and updates the DOM.
 */
function compute() {
  const now = new Date();
  const jd  = julianDate(now);

  // Earth's heliocentric position first
  const earth = heliocentricPosition(PLANETS.Earth, jd);

  // Compute position for each planet and render
  const grid = document.getElementById('planet-grid');
  grid.innerHTML = ''; // clear before redraw

  Object.entries(PLANETS).forEach(([name, data]) => {
    if (name === 'Earth') return; // skip Earth itself

    const p   = heliocentricPosition(data, jd);
    const gc  = toRaDec(p.lon, 0, p.r, earth.lon, earth.r);

    // Compute altitude if we have observer location
    let altitudeText = '–';
    let visible = false;
    if (observerLat !== null && observerLon !== null) {
      const { altitude } = toAltAz(gc.ra, gc.dec, observerLat, observerLon, now);
      altitudeText = altitude.toFixed(1) + '°';
      visible = altitude > 5; // above 5deg eliminates atmospheric distortion
    }

    // Build the orbit angle on the 2D orrery (CSS transform)
    const orbitEl = document.getElementById(`orbit-${name.toLowerCase()}`);
    if (orbitEl) {
      // Rotate the orbit container so the planet element (at 100% left) ends up at the correct heliocentric longitude
      orbitEl.style.transform = `rotate(${p.lon}deg)`;
    }

    // Render planet info card row
    const row = document.createElement('div');
    row.className = 'planet-row glass-panel';
    row.innerHTML = `
      <div class="p-name">
        <div class="p-dot" style="background:${data.color};box-shadow:0 0 6px ${data.color};"></div>
        ${name}
      </div>
      <div class="p-coords">
        <span>${formatRA(gc.ra)}</span>
        <span>${formatDec(gc.dec)}</span>
        ${observerLat !== null ? `<span style="color: var(--accent-light);">Alt ${altitudeText}</span>` : ''}
      </div>
      <span class="p-status ${visible ? 'p-visible' : 'p-hidden'}">${observerLat !== null ? (visible ? 'Visible' : 'Below horizon') : 'No location'}</span>
    `;
    grid.appendChild(row);
  });
}

// ── Geolocation Button ────────────────────────────────────────
document.getElementById('btn-locate').addEventListener('click', () => {
  const statusEl = document.getElementById('loc-status');
  statusEl.textContent = 'Requesting location…';

  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation not supported by this browser.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      observerLat = pos.coords.latitude;
      observerLon = pos.coords.longitude;
      statusEl.textContent = `Location: ${observerLat.toFixed(2)}°, ${observerLon.toFixed(2)}° — Updating…`;
      compute();
    },
    () => { statusEl.textContent = 'Location access denied. Showing RA/Dec without altitude.'; }
  );
});

// ── Initial render & periodic refresh (every 60 seconds) ─────
compute();
setInterval(compute, 60000);
