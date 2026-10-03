/**
 * PlanetPulse: where the planets are, computed in the browser
 * Stormberry AS | Sovereign, offline-first planetary tracker
 *
 * Planets: Keplerian elements and their rates per century from
 * E. M. Standish and J. G. Williams (JPL), "Keplerian Elements for
 * Approximate Positions of the Major Planets", Table 1, referred to the
 * mean ecliptic and equinox of J2000 and valid from 1800 to 2050
 * (https://ssd.jpl.nasa.gov/planets/approx_pos.html).
 *
 * For each body: mean anomaly M = L minus the longitude of perihelion,
 * Kepler's equation solved for the eccentric anomaly, the orbit rotated
 * into the ecliptic by its argument of perihelion, inclination and
 * ascending node, then made geocentric (with light-time) and equatorial.
 * Altitude uses those J2000 coordinates precessed to the date.
 *
 * Checked on 2026-10-02 against PyEphem (VSOP87) for 2020 to 2032 and
 * against JPL Horizons for the dwarf planets: see README for the figures.
 */

// ── Set current year in footer ───────────────────────────────
document.getElementById('current-year').textContent = new Date().getFullYear();

// ── Planet elements (Standish Table 1, J2000, 1800 to 2050) ──
// Each pair is [value at J2000.0, change per Julian century].
// a = semi-major axis (au), e = eccentricity, I = inclination (deg),
// L = mean longitude (deg), peri = longitude of perihelion (deg),
// node = longitude of the ascending node (deg).
// Earth is the Earth-Moon barycentre, as in the source table.
const PLANETS = {
  Mercury: { color: '#B3B3B3', a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], peri: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081] },
  Venus:   { color: '#FFD27D', a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], peri: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418] },
  Earth:   { color: '#4B90FF', a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0.0, 0.0] },
  Mars:    { color: '#FF5A36', a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343] },
  Jupiter: { color: '#FF9E6F', a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], peri: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106] },
  Saturn:  { color: '#FFEBB3', a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], peri: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794] },
  Uranus:  { color: '#7DE8E8', a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], peri: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589] },
  Neptune: { color: '#4B70FF', a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], peri: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664] },
};

// ── Dwarf planet elements ─────────────────────────────────────
// Heliocentric osculating elements from JPL Horizons (DE441 with SB441-N16
// perturbers), ecliptic and mean equinox of J2000, epoch 2028-Jan-01.0 TDB
// (JD 2461771.5), fetched 2026-10-02. a (au), e, I, Omega = ascending node,
// w = argument of perihelion, M0 = mean anomaly at the epoch (deg),
// n = mean motion (deg/day). A fixed ellipse drifts as the planets pull on
// it, so each body is only shown inside the years where it stayed within
// 1 degree of Horizons: Ceres, close to Jupiter, for 2017 to 2036; the
// others for 1950 to 2099 (largest error in that span 0.48 degrees, Pluto).
const DWARF_EPOCH = 2461771.5;
const DWARF_PLANETS = {
  Ceres:    { color: '#C8B9A2', years: [2017, 2036], a: 2.766832788966856, e: 0.07994741439834002, I: 10.58259682199891, Omega: 80.18775535660217, w: 72.53838139835237, M0: 37.46203412137074, n: 0.2141557321275452 },
  Pluto:    { color: '#D4B99A', years: [1950, 2099], a: 39.64360256546674, e: 0.2526802441705023, I: 17.37118531588926, Omega: 110.5323872561754, w: 113.9314077310577, M0: 54.78954246972154, n: 0.003948611489830684 },
  Haumea:   { color: '#E8E0D4', years: [1950, 2099], a: 43.20023613639894, e: 0.1917277535820945, I: 28.20785252932527, Omega: 121.8223661964471, w: 239.9187199985739, M0: 225.989383859187, n: 0.003471162080311415 },
  Makemake: { color: '#F5EBD7', years: [1950, 2099], a: 45.68179903084681, e: 0.1559331537367756, I: 29.00898148015426, Omega: 79.39971933951159, w: 296.7369188191528, M0: 172.1708004338928, n: 0.003192193989918451 },
  Eris:     { color: '#ECECEC', years: [1950, 2099], a: 67.78782786482374, e: 0.4405814704591751, I: 44.06492043811949, Omega: 35.95130764318868, w: 151.0614175355851, M0: 212.4199109342568, n: 0.001765942249194759 },
};

const DEG = Math.PI / 180; // degree → radians
const J2000 = 2451545.0;
const OBLIQUITY_J2000 = 23.4392911 * DEG;
const LIGHT_DAYS_PER_AU = 0.0057755183;

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
 * Solves Kepler's equation E - e sin E = M (radians) by Newton's method.
 */
function eccentricAnomaly(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 50; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * Heliocentric ecliptic J2000 position (au) of a body on an ellipse.
 * Angles in degrees: I inclination, node ascending node, w argument of
 * perihelion, M mean anomaly.
 */
function orbitPosition(a, e, I, node, w, M) {
  const E = eccentricAnomaly((norm360(M + 180) - 180) * DEG, e);
  // Position in the orbital plane, x towards perihelion
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  // Rotate by w, then I, then node
  const cw = Math.cos(w * DEG), sw = Math.sin(w * DEG);
  const cN = Math.cos(node * DEG), sN = Math.sin(node * DEG);
  const cI = Math.cos(I * DEG), sI = Math.sin(I * DEG);
  return {
    x: (cw * cN - sw * sN * cI) * xp + (-sw * cN - cw * sN * cI) * yp,
    y: (cw * sN + sw * cN * cI) * xp + (-sw * sN + cw * cN * cI) * yp,
    z: (sw * sI) * xp + (cw * sI) * yp,
  };
}

/**
 * Heliocentric ecliptic J2000 position (au) of a planet or dwarf planet.
 */
function heliocentricPosition(body, jd) {
  if ('M0' in body) {
    return orbitPosition(body.a, body.e, body.I, body.Omega, body.w, body.M0 + body.n * (jd - DWARF_EPOCH));
  }
  const T = (jd - J2000) / 36525;
  const at = k => body[k][0] + body[k][1] * T;
  const peri = at('peri');
  const node = at('node');
  // Mean anomaly is measured from perihelion: M = L - peri, where
  // peri = node + argument of perihelion.
  return orbitPosition(at('a'), at('e'), at('I'), node, peri - node, at('L') - peri);
}

/** Heliocentric ecliptic longitude (deg), for the orrery. */
function eclipticLongitude(p) {
  return norm360(Math.atan2(p.y, p.x) / DEG);
}

/**
 * Converts an ecliptic J2000 vector to equatorial J2000 RA/Dec.
 * @returns { ra, dec } in degrees
 */
function eclipticToRaDec(x, y, z) {
  const ce = Math.cos(OBLIQUITY_J2000), se = Math.sin(OBLIQUITY_J2000);
  const yq = y * ce - z * se;
  const zq = y * se + z * ce;
  return {
    ra: norm360(Math.atan2(yq, x) / DEG),
    dec: Math.atan2(zq, Math.hypot(x, yq)) / DEG,
  };
}

/**
 * Geocentric J2000 RA/Dec of a body, seen where it was when its light left
 * it (light-time), given the Earth's heliocentric position.
 */
function geocentricRaDec(body, jd, earth) {
  let p = heliocentricPosition(body, jd);
  const dist = Math.hypot(p.x - earth.x, p.y - earth.y, p.z - earth.z);
  p = heliocentricPosition(body, jd - dist * LIGHT_DAYS_PER_AU);
  return eclipticToRaDec(p.x - earth.x, p.y - earth.y, p.z - earth.z);
}

/**
 * Precesses J2000 RA/Dec to the mean equator and equinox of the date
 * (IAU 1976 angles, Meeus, Astronomical Algorithms, chapter 21).
 */
function precessFromJ2000(ra, dec, jd) {
  const T = (jd - J2000) / 36525;
  const zeta  = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) / 3600 * DEG;
  const z     = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) / 3600 * DEG;
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) / 3600 * DEG;
  const a = ra * DEG + zeta, d = dec * DEG;
  const A = Math.cos(d) * Math.sin(a);
  const B = Math.cos(theta) * Math.cos(d) * Math.cos(a) - Math.sin(theta) * Math.sin(d);
  const C = Math.sin(theta) * Math.cos(d) * Math.cos(a) + Math.cos(theta) * Math.sin(d);
  return {
    ra: norm360((Math.atan2(A, B) + z) / DEG),
    dec: Math.asin(Math.max(-1, Math.min(1, C))) / DEG,
  };
}

/**
 * Converts Right Ascension/Declination (of the date) to local Altitude and Azimuth.
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

/** Altitude (deg) of a J2000 RA/Dec for an observer at a moment. */
function altitudeOf(radec, lat, lon, date, jd) {
  const p = precessFromJ2000(radec.ra, radec.dec, jd);
  return toAltAz(p.ra, p.dec, lat, lon, date).altitude;
}

/**
 * Whether a body can be seen: above the horizon, and the Sun at least
 * 6 degrees below it (the end of civil twilight). Otherwise say why.
 */
function visibilityStatus(altitude, sunAltitude) {
  if (altitude <= 0) return { text: 'Below the horizon', visible: false };
  if (sunAltitude > 0) return { text: 'Daylight', visible: false };
  if (sunAltitude > -6) return { text: 'Twilight', visible: false };
  return { text: 'Visible', visible: true };
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
let activeTab = 'city';   // 'city' | 'gps'
let cityLat = null;       // from the selected city
let cityLon = null;
let gpsLat = null;        // from the typed coordinates, set on Compute
let gpsLon = null;

const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');

function initDateTime() {
  const now = new Date();
  if (dateInput) dateInput.value = now.toISOString().split('T')[0];
  if (timeInput) timeInput.value = now.toTimeString().split(' ')[0].slice(0, 5);
}

function getSelectedDate() {
  if (dateInput && timeInput && dateInput.value && timeInput.value) {
    return new Date(`${dateInput.value}T${timeInput.value}`);
  }
  return new Date();
}

/** The observer for the active tab, or null when none is set. */
function currentObserver() {
  if (activeTab === 'gps') return gpsLat === null ? null : { lat: gpsLat, lon: gpsLon };
  return cityLat === null ? null : { lat: cityLat, lon: cityLon };
}

initDateTime();

// ── Orrery Tooltip Logic ──────────────────────────────────────
const tooltip = document.getElementById('orrery-tooltip');
const orrerySection = document.querySelector('.orrery-card');

// Listen for mouse entering/leaving any element with data-planet
orrerySection.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-planet]');
  if (!target) return;
  tooltip.textContent = target.dataset.planet;
  tooltip.classList.add('visible');
});

orrerySection.addEventListener('mousemove', (e) => {
  // Position tooltip relative to the orrery section container
  const rect = orrerySection.getBoundingClientRect();
  tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
  tooltip.style.top  = (e.clientY - rect.top  - 28) + 'px';
});

orrerySection.addEventListener('mouseout', (e) => {
  if (!e.target.closest('[data-planet]')) return;
  tooltip.classList.remove('visible');
});

const planetGrid = document.getElementById('planet-grid');
const dwarfGrid  = document.getElementById('dwarf-grid');
const dwarfHead  = document.getElementById('dwarf-header');
const locStatus  = document.getElementById('loc-status');
const LOC_PROMPT = locStatus.textContent;

/** One result row: name, coordinate lines, status pill. dim is for the dwarf planets. */
function makeRow(name, color, coords, status, dim) {
  const row = document.createElement('div');
  row.className = 'planet-row glass-panel';

  const nameEl = document.createElement('div');
  nameEl.className = 'p-name';
  const dot = document.createElement('div');
  dot.className = 'p-dot';
  dot.style.background = color;
  dot.style.boxShadow = `0 0 ${dim ? 4 : 6}px ${color}`;
  if (dim) dot.style.opacity = '0.8';
  nameEl.append(dot, name);

  const coordsEl = document.createElement('div');
  coordsEl.className = 'p-coords';
  for (const line of coords) {
    const span = document.createElement('span');
    span.textContent = line.text;
    if (line.accent) span.className = 'p-alt';
    coordsEl.appendChild(span);
  }

  const statusEl = document.createElement('span');
  statusEl.className = `p-status ${status.visible ? 'p-visible' : 'p-hidden'}`;
  statusEl.textContent = status.text;

  row.append(nameEl, coordsEl, statusEl);
  return row;
}

/** Hide every result, so an earlier answer cannot be read as the new one. */
function hideResults() {
  planetGrid.hidden = true;
  dwarfGrid.hidden = true;
  dwarfHead.hidden = true;
  locStatus.textContent = LOC_PROMPT;
}

/**
 * Runs the full orbital calculation pipeline and updates the DOM.
 */
function compute() {
  const now = getSelectedDate();
  const jd  = julianDate(now);
  const observer = currentObserver();
  const year = now.getFullYear();

  // Earth's heliocentric position first; the Sun is seen from the opposite side
  const earth = heliocentricPosition(PLANETS.Earth, jd);
  let sunAlt = null;
  if (observer) {
    const sun = eclipticToRaDec(-earth.x, -earth.y, -earth.z);
    sunAlt = altitudeOf(sun, observer.lat, observer.lon, now, jd);
    const where = sunAlt >= 0 ? 'above' : 'below';
    locStatus.textContent = `The Sun is ${Math.abs(sunAlt).toFixed(1)}° ${where} the horizon. Planets count as visible once it is 6° below.`;
  } else {
    locStatus.textContent = LOC_PROMPT;
  }

  function describe(body) {
    const gc = geocentricRaDec(body, jd, earth);
    const coords = [{ text: formatRA(gc.ra) }, { text: formatDec(gc.dec) }];
    if (!observer) return { coords, status: { text: 'No location', visible: false } };
    const altitude = altitudeOf(gc, observer.lat, observer.lon, now, jd);
    coords.push({ text: `Alt ${altitude.toFixed(1)}°`, accent: true });
    return { coords, status: visibilityStatus(altitude, sunAlt) };
  }

  planetGrid.innerHTML = ''; // clear before redraw
  Object.entries(PLANETS).forEach(([name, data]) => {
    // Rotate the orbit container so the planet element (at 100% left) sits at
    // its heliocentric longitude, counter-clockwise as seen from above the
    // Sun's north pole, with the March equinox direction to the right.
    const orbitEl = document.getElementById(`orbit-${name.toLowerCase()}`);
    if (orbitEl) {
      orbitEl.style.transform = `rotate(${-eclipticLongitude(heliocentricPosition(data, jd))}deg)`;
    }
    if (name === 'Earth') return; // no row for Earth itself

    const { coords, status } = describe(data);
    planetGrid.appendChild(makeRow(name, data.color, coords, status));
  });

  // ── Dwarf Planets ─────────────────────────────────────────
  dwarfGrid.innerHTML = '';
  Object.entries(DWARF_PLANETS).forEach(([name, data]) => {
    const [from, to] = data.years;
    if (year < from || year > to) {
      dwarfGrid.appendChild(makeRow(name, data.color,
        [{ text: `Shown for ${from} to ${to} only` }], { text: 'Out of range', visible: false }, true));
      return;
    }
    const { coords, status } = describe(data);
    dwarfGrid.appendChild(makeRow(name, data.color, coords, status, true));
  });

  planetGrid.hidden = false;
  dwarfGrid.hidden = false;
  dwarfHead.hidden = false;
}

// ── Tab Switcher ──────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    // Deactivate all tabs and panels
    document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; p.classList.remove('active'); });
    // Activate clicked tab and matching panel
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    activeTab = btn.dataset.tab;
    const panel = document.getElementById('panel-' + btn.dataset.tab);
    if (panel) { panel.hidden = false; panel.classList.add('active'); }
  });
});

// ── City Search ───────────────────────────────────────────────
const citySearchInput  = document.getElementById('city-search');
const cityDropdown     = document.getElementById('city-dropdown');
const citySelectedDiv  = document.getElementById('city-selected');
const citySelectedText = document.getElementById('city-selected-text');
const cityClearBtn     = document.getElementById('city-clear-btn');

citySearchInput.addEventListener('input', () => {
  const query = citySearchInput.value.trim().toLowerCase();
  if (query.length < 2) { cityDropdown.hidden = true; return; }
  // Filter matching cities (max 10 results for performance)
  const qf = foldQuery(query);
  // Prefix matches first. With 25,000 cities a bare substring filter
  // buries the obvious answer: "erdal" returned Cloverdale, South
  // Riverdale and Terdal ahead of Erdal, and with only 10 rows shown the
  // city being typed could fall off the list entirely.
  const startsWith = [], contains = [];
  for (const c of CITIES) {
    // c.alt is the folded English exonym where GeoNames stores the local
    // name, so "gothenburg" finds Goteborg and "cologne" finds Koeln.
    if (c.fold.startsWith(qf) || c.alt.startsWith(qf)) startsWith.push(c);
    else if (c.fold.includes(qf) || c.alt.includes(qf) || c.cfold.includes(qf)) contains.push(c);
  }
  const matches = startsWith.concat(contains).slice(0, 10);
  cityDropdown.innerHTML = '';
  if (!matches.length) { cityDropdown.hidden = true; return; }
  matches.forEach(c => {
    const li = document.createElement('li');
    li.role = 'option';
    li.innerHTML = `<span class="city-name">${c.name}</span><span class="city-country">${c.country}</span>`;
    li.addEventListener('click', () => {
      cityLat = c.lat;
      cityLon = c.lon;
      citySelectedText.textContent = `${c.name}, ${c.country}`;
      citySelectedDiv.hidden = false;
      cityDropdown.hidden = true;
      citySearchInput.value = '';
      // Wait for user to press compute manually
    });
    cityDropdown.appendChild(li);
  });
  cityDropdown.hidden = false;
});

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) cityDropdown.hidden = true;
});

cityClearBtn.addEventListener('click', () => {
  cityLat = null; cityLon = null;
  citySelectedDiv.hidden = true;
  citySearchInput.value = '';
  // Wait for user to press compute manually
});

// ── Typed Coordinates ─────────────────────────────────────────
const latInput = document.getElementById('lat-input');
const lonInput = document.getElementById('lon-input');
const latError = document.getElementById('lat-error');
const lonError = document.getElementById('lon-error');
const gpsEcho  = document.getElementById('gps-echo');

// Shared Labs parser: accepts "60,39" and a Unicode minus, rejects anything else or out of range (null).
function parseDecimal(text, min, max) {
  if (text == null) return null;
  let s = String(text).trim().replace(/[\u2212\u2012\u2013\u2014\uFE63\uFF0D]/g, '-').replace(/\s+/g, '');
  if (/^[+-]?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Show (msg) or clear (null) the inline message under one coordinate field. */
function setFieldError(input, errorEl, msg) {
  if (msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errorEl.textContent = '';
    errorEl.hidden = true;
    input.removeAttribute('aria-invalid');
  }
}

/** Show (text) or clear (null) the "Using ..." line. Cleared text, not just
 *  hidden: aria-describedby still reads a hidden element it points at. */
function setEcho(text) {
  gpsEcho.textContent = text || '';
  gpsEcho.hidden = !text;
}

// Editing a coordinate clears its error and the "Using ..." line, which
// described the previous value, until the next Compute.
latInput.addEventListener('input', () => { setFieldError(latInput, latError, null); setEcho(null); });
lonInput.addEventListener('input', () => { setFieldError(lonInput, lonError, null); setEcho(null); });

/** Compute button: read the typed coordinates when that tab is active. */
function onCompute() {
  if (activeTab === 'gps') {
    const lat = parseDecimal(latInput.value, -90, 90);
    const lon = parseDecimal(lonInput.value, -180, 180);

    setFieldError(latInput, latError,
      lat === null ? 'Enter a latitude between -90 and 90, such as 60.39 or 60,39.' : null);
    setFieldError(lonInput, lonError,
      lon === null ? 'Enter a longitude between -180 and 180, such as 5.32 or 5,32.' : null);

    if (lat === null || lon === null) {
      // Do not compute, and do not leave an older result showing under the error.
      gpsLat = null; gpsLon = null;
      setEcho(null);
      hideResults();
      (lat === null ? latInput : lonInput).focus();
      return;
    }

    gpsLat = lat;
    gpsLon = lon;
    // Echo the numbers actually used, so "6,5" visibly became 6.5.
    setEcho(`Using ${lat}, ${lon}`);
  }
  compute();
}

// ── Compute Button Event Listener ────────────────────────────
const btnCompute = document.getElementById('btn-compute');
if (btnCompute) {
  btnCompute.addEventListener('click', onCompute);
}

// ── Initial render ───────────────────────────────────────────
compute();
