"use strict";
/*! PlanetPulse: app.js is compiled from ts/app.ts by tools/build-ts.sh, which leaves out every
    comment but this one: the explanations are in the source. Edit the .ts, never the .js: the build
    refuses to overwrite a hand edit, and its check mode fails on one. */
function byId(id, kind) {
    const el = document.getElementById(id);
    if (!(el instanceof kind))
        throw new Error(`PlanetPulse: #${id} is missing from the page`);
    return el;
}
function inputOrNull(id) {
    const el = document.getElementById(id);
    return el instanceof HTMLInputElement ? el : null;
}
byId('current-year', HTMLElement).textContent = String(new Date().getFullYear());
const PLANETS = {
    Mercury: { color: '#B3B3B3', a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], peri: [77.45779628, 0.16047689], node: [48.33076593, -0.12534081] },
    Venus: { color: '#FFD27D', a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], peri: [131.60246718, 0.00268329], node: [76.67984255, -0.27769418] },
    Earth: { color: '#4B90FF', a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364], node: [0.0, 0.0] },
    Mars: { color: '#FF5A36', a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088], node: [49.55953891, -0.29257343] },
    Jupiter: { color: '#FF9E6F', a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], peri: [14.72847983, 0.21252668], node: [100.47390909, 0.20469106] },
    Saturn: { color: '#FFEBB3', a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], peri: [92.59887831, -0.41897216], node: [113.66242448, -0.28867794] },
    Uranus: { color: '#7DE8E8', a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], peri: [170.95427630, 0.40805281], node: [74.01692503, 0.04240589] },
    Neptune: { color: '#4B70FF', a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], peri: [44.96476227, -0.32241464], node: [131.78422574, -0.00508664] },
};
const DWARF_EPOCH = 2461771.5;
const DWARF_PLANETS = {
    Ceres: { color: '#C8B9A2', years: [2017, 2036], a: 2.766832788966856, e: 0.07994741439834002, I: 10.58259682199891, Omega: 80.18775535660217, w: 72.53838139835237, M0: 37.46203412137074, n: 0.2141557321275452 },
    Pluto: { color: '#D4B99A', years: [1950, 2099], a: 39.64360256546674, e: 0.2526802441705023, I: 17.37118531588926, Omega: 110.5323872561754, w: 113.9314077310577, M0: 54.78954246972154, n: 0.003948611489830684 },
    Haumea: { color: '#E8E0D4', years: [1950, 2099], a: 43.20023613639894, e: 0.1917277535820945, I: 28.20785252932527, Omega: 121.8223661964471, w: 239.9187199985739, M0: 225.989383859187, n: 0.003471162080311415 },
    Makemake: { color: '#F5EBD7', years: [1950, 2099], a: 45.68179903084681, e: 0.1559331537367756, I: 29.00898148015426, Omega: 79.39971933951159, w: 296.7369188191528, M0: 172.1708004338928, n: 0.003192193989918451 },
    Eris: { color: '#ECECEC', years: [1950, 2099], a: 67.78782786482374, e: 0.4405814704591751, I: 44.06492043811949, Omega: 35.95130764318868, w: 151.0614175355851, M0: 212.4199109342568, n: 0.001765942249194759 },
};
const DEG = Math.PI / 180;
const J2000 = 2451545.0;
const OBLIQUITY_J2000 = 23.4392911 * DEG;
const LIGHT_DAYS_PER_AU = 0.0057755183;
function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
}
function norm360(a) {
    return ((a % 360) + 360) % 360;
}
function eccentricAnomaly(M, e) {
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < 50; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < 1e-12)
            break;
    }
    return E;
}
function orbitPosition(a, e, I, node, w, M) {
    const E = eccentricAnomaly((norm360(M + 180) - 180) * DEG, e);
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w * DEG), sw = Math.sin(w * DEG);
    const cN = Math.cos(node * DEG), sN = Math.sin(node * DEG);
    const cI = Math.cos(I * DEG), sI = Math.sin(I * DEG);
    return {
        x: (cw * cN - sw * sN * cI) * xp + (-sw * cN - cw * sN * cI) * yp,
        y: (cw * sN + sw * cN * cI) * xp + (-sw * sN + cw * cN * cI) * yp,
        z: (sw * sI) * xp + (cw * sI) * yp,
    };
}
function heliocentricPosition(body, jd) {
    if ('M0' in body) {
        return orbitPosition(body.a, body.e, body.I, body.Omega, body.w, body.M0 + body.n * (jd - DWARF_EPOCH));
    }
    const T = (jd - J2000) / 36525;
    const at = (k) => body[k][0] + body[k][1] * T;
    const peri = at('peri');
    const node = at('node');
    return orbitPosition(at('a'), at('e'), at('I'), node, peri - node, at('L') - peri);
}
function eclipticLongitude(p) {
    return norm360(Math.atan2(p.y, p.x) / DEG);
}
function eclipticToRaDec(x, y, z) {
    const ce = Math.cos(OBLIQUITY_J2000), se = Math.sin(OBLIQUITY_J2000);
    const yq = y * ce - z * se;
    const zq = y * se + z * ce;
    return {
        ra: norm360(Math.atan2(yq, x) / DEG),
        dec: Math.atan2(zq, Math.hypot(x, yq)) / DEG,
    };
}
function geocentricRaDec(body, jd, earth) {
    let p = heliocentricPosition(body, jd);
    const dist = Math.hypot(p.x - earth.x, p.y - earth.y, p.z - earth.z);
    p = heliocentricPosition(body, jd - dist * LIGHT_DAYS_PER_AU);
    return eclipticToRaDec(p.x - earth.x, p.y - earth.y, p.z - earth.z);
}
function precessFromJ2000(ra, dec, jd) {
    const T = (jd - J2000) / 36525;
    const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) / 3600 * DEG;
    const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) / 3600 * DEG;
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
function toAltAz(ra, dec, lat, lon, date) {
    const jd = julianDate(date);
    const T = (jd - 2451545.0) / 36525;
    let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    GMST = norm360(GMST);
    const LST = norm360(GMST + lon);
    const HA = norm360(LST - ra);
    const latR = lat * DEG;
    const decR = dec * DEG;
    const HAr = HA * DEG;
    const sinAlt = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(HAr);
    const altitude = Math.asin(sinAlt) / DEG;
    const cosAz = (Math.sin(decR) - Math.sin(latR) * sinAlt) / (Math.cos(latR) * Math.cos(altitude * DEG));
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) / DEG;
    if (Math.sin(HAr) > 0)
        azimuth = 360 - azimuth;
    return { altitude, azimuth };
}
function altitudeOf(radec, lat, lon, date, jd) {
    const p = precessFromJ2000(radec.ra, radec.dec, jd);
    return toAltAz(p.ra, p.dec, lat, lon, date).altitude;
}
function visibilityStatus(altitude, sunAltitude) {
    if (altitude <= 0)
        return { text: 'Below the horizon', visible: false };
    if (sunAltitude > 0)
        return { text: 'Daylight', visible: false };
    if (sunAltitude > -6)
        return { text: 'Twilight', visible: false };
    return { text: 'Visible', visible: true };
}
function formatRA(deg) {
    const h = deg / 15;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `RA ${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m`;
}
function formatDec(deg) {
    const sign = deg >= 0 ? '+' : '-';
    const abs = Math.abs(deg);
    const dd = Math.floor(abs);
    const mm = Math.floor((abs - dd) * 60);
    return `Dec ${sign}${String(dd).padStart(2, '0')}° ${String(mm).padStart(2, '0')}'`;
}
let activeTab = 'city';
let cityLat = null;
let cityLon = null;
let gpsLat = null;
let gpsLon = null;
const dateInput = inputOrNull('date-input');
const timeInput = inputOrNull('time-input');
function initDateTime() {
    const now = new Date();
    if (dateInput)
        dateInput.value = now.toISOString().split('T')[0] ?? '';
    if (timeInput)
        timeInput.value = (now.toTimeString().split(' ')[0] ?? '').slice(0, 5);
}
function getSelectedDate() {
    if (dateInput && timeInput && dateInput.value && timeInput.value) {
        return new Date(`${dateInput.value}T${timeInput.value}`);
    }
    return new Date();
}
function currentObserver() {
    if (activeTab === 'gps')
        return gpsLat === null || gpsLon === null ? null : { lat: gpsLat, lon: gpsLon };
    return cityLat === null || cityLon === null ? null : { lat: cityLat, lon: cityLon };
}
initDateTime();
const tooltip = byId('orrery-tooltip', HTMLElement);
const orrerySection = document.querySelector('.orrery-card');
if (!(orrerySection instanceof HTMLElement))
    throw new Error('PlanetPulse: .orrery-card is missing from the page');
orrerySection.addEventListener('mouseover', (e) => {
    if (!(e.target instanceof Element))
        return;
    const target = e.target.closest('[data-planet]');
    if (!target)
        return;
    tooltip.textContent = target.getAttribute('data-planet');
    tooltip.classList.add('visible');
});
orrerySection.addEventListener('mousemove', (e) => {
    const rect = orrerySection.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
    tooltip.style.top = (e.clientY - rect.top - 28) + 'px';
});
orrerySection.addEventListener('mouseout', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('[data-planet]'))
        return;
    tooltip.classList.remove('visible');
});
const planetGrid = byId('planet-grid', HTMLElement);
const dwarfGrid = byId('dwarf-grid', HTMLElement);
const dwarfHead = byId('dwarf-header', HTMLElement);
const locStatus = byId('loc-status', HTMLElement);
const LOC_PROMPT = locStatus.textContent;
function makeRow(name, color, coords, status, dim) {
    const row = document.createElement('div');
    row.className = 'planet-row glass-panel';
    const nameEl = document.createElement('div');
    nameEl.className = 'p-name';
    const dot = document.createElement('div');
    dot.className = 'p-dot';
    dot.style.background = color;
    dot.style.boxShadow = `0 0 ${dim ? 4 : 6}px ${color}`;
    if (dim)
        dot.style.opacity = '0.8';
    nameEl.append(dot, name);
    const coordsEl = document.createElement('div');
    coordsEl.className = 'p-coords';
    for (const line of coords) {
        const span = document.createElement('span');
        span.textContent = line.text;
        if (line.accent)
            span.className = 'p-alt';
        coordsEl.appendChild(span);
    }
    const statusEl = document.createElement('span');
    statusEl.className = `p-status ${status.visible ? 'p-visible' : 'p-hidden'}`;
    statusEl.textContent = status.text;
    row.append(nameEl, coordsEl, statusEl);
    return row;
}
function hideResults() {
    planetGrid.hidden = true;
    dwarfGrid.hidden = true;
    dwarfHead.hidden = true;
    locStatus.textContent = LOC_PROMPT;
}
function compute() {
    const now = getSelectedDate();
    const jd = julianDate(now);
    const observer = currentObserver();
    const year = now.getFullYear();
    const earth = heliocentricPosition(PLANETS.Earth, jd);
    let sunAlt = null;
    if (observer) {
        const sun = eclipticToRaDec(-earth.x, -earth.y, -earth.z);
        sunAlt = altitudeOf(sun, observer.lat, observer.lon, now, jd);
        const where = sunAlt >= 0 ? 'above' : 'below';
        locStatus.textContent = `The Sun is ${Math.abs(sunAlt).toFixed(1)}° ${where} the horizon. Planets count as visible once it is 6° below.`;
    }
    else {
        locStatus.textContent = LOC_PROMPT;
    }
    function describe(body) {
        const gc = geocentricRaDec(body, jd, earth);
        const coords = [{ text: formatRA(gc.ra) }, { text: formatDec(gc.dec) }];
        if (!observer || sunAlt === null)
            return { coords, status: { text: 'No location', visible: false } };
        const altitude = altitudeOf(gc, observer.lat, observer.lon, now, jd);
        coords.push({ text: `Alt ${altitude.toFixed(1)}°`, accent: true });
        return { coords, status: visibilityStatus(altitude, sunAlt) };
    }
    planetGrid.innerHTML = '';
    Object.entries(PLANETS).forEach(([name, data]) => {
        const orbitEl = document.getElementById(`orbit-${name.toLowerCase()}`);
        if (orbitEl) {
            orbitEl.style.transform = `rotate(${-eclipticLongitude(heliocentricPosition(data, jd))}deg)`;
        }
        if (name === 'Earth')
            return;
        const { coords, status } = describe(data);
        planetGrid.appendChild(makeRow(name, data.color, coords, status));
    });
    dwarfGrid.innerHTML = '';
    Object.entries(DWARF_PLANETS).forEach(([name, data]) => {
        const [from, to] = data.years;
        if (year < from || year > to) {
            dwarfGrid.appendChild(makeRow(name, data.color, [{ text: `Shown for ${from} to ${to} only` }], { text: 'Out of range', visible: false }, true));
            return;
        }
        const { coords, status } = describe(data);
        dwarfGrid.appendChild(makeRow(name, data.color, coords, status, true));
    });
    planetGrid.hidden = false;
    dwarfGrid.hidden = false;
    dwarfHead.hidden = false;
}
document.querySelectorAll('.tab').forEach(btn => {
    if (!(btn instanceof HTMLElement))
        return;
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-panel').forEach(p => { if (!(p instanceof HTMLElement))
            return; p.hidden = true; p.classList.remove('active'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        activeTab = btn.dataset.tab;
        const panel = document.getElementById('panel-' + btn.dataset.tab);
        if (panel) {
            panel.hidden = false;
            panel.classList.add('active');
        }
    });
});
const citySearchInput = byId('city-search', HTMLInputElement);
const cityDropdown = byId('city-dropdown', HTMLElement);
const citySelectedDiv = byId('city-selected', HTMLElement);
const citySelectedText = byId('city-selected-text', HTMLElement);
const cityClearBtn = byId('city-clear-btn', HTMLElement);
citySearchInput.addEventListener('input', () => {
    const query = citySearchInput.value.trim().toLowerCase();
    if (query.length < 2) {
        cityDropdown.hidden = true;
        return;
    }
    const qf = foldQuery(query);
    const startsWith = [], contains = [];
    for (const c of CITIES) {
        if (c.fold.startsWith(qf) || c.alt.startsWith(qf))
            startsWith.push(c);
        else if (c.fold.includes(qf) || c.alt.includes(qf) || c.cfold.includes(qf))
            contains.push(c);
    }
    const matches = startsWith.concat(contains).slice(0, 10);
    cityDropdown.innerHTML = '';
    if (!matches.length) {
        cityDropdown.hidden = true;
        return;
    }
    matches.forEach(c => {
        const li = document.createElement('li');
        li.role = 'option';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'city-name';
        nameSpan.textContent = c.name;
        const countrySpan = document.createElement('span');
        countrySpan.className = 'city-country';
        countrySpan.textContent = c.country;
        li.append(nameSpan, countrySpan);
        li.addEventListener('click', () => {
            cityLat = c.lat;
            cityLon = c.lon;
            citySelectedText.textContent = `${c.name}, ${c.country}`;
            citySelectedDiv.hidden = false;
            cityDropdown.hidden = true;
            citySearchInput.value = '';
        });
        cityDropdown.appendChild(li);
    });
    cityDropdown.hidden = false;
});
document.addEventListener('click', e => {
    if (!(e.target instanceof Element) || !e.target.closest('.search-wrapper'))
        cityDropdown.hidden = true;
});
cityClearBtn.addEventListener('click', () => {
    cityLat = null;
    cityLon = null;
    citySelectedDiv.hidden = true;
    citySearchInput.value = '';
});
const latInput = byId('lat-input', HTMLInputElement);
const lonInput = byId('lon-input', HTMLInputElement);
const latError = byId('lat-error', HTMLElement);
const lonError = byId('lon-error', HTMLElement);
const gpsEcho = byId('gps-echo', HTMLElement);
function parseDecimal(text, min, max) {
    if (text == null)
        return null;
    let s = String(text).trim().replace(/[\u2212\u2012\u2013\u2014\uFE63\uFF0D]/g, '-').replace(/\s+/g, '');
    if (/^[+-]?\d+,\d+$/.test(s))
        s = s.replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s))
        return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function setFieldError(input, errorEl, msg) {
    if (msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
    }
    else {
        errorEl.textContent = '';
        errorEl.hidden = true;
        input.removeAttribute('aria-invalid');
    }
}
function setEcho(text) {
    gpsEcho.textContent = text || '';
    gpsEcho.hidden = !text;
}
latInput.addEventListener('input', () => { setFieldError(latInput, latError, null); setEcho(null); });
lonInput.addEventListener('input', () => { setFieldError(lonInput, lonError, null); setEcho(null); });
function onCompute() {
    if (activeTab === 'gps') {
        const lat = parseDecimal(latInput.value, -90, 90);
        const lon = parseDecimal(lonInput.value, -180, 180);
        setFieldError(latInput, latError, lat === null ? 'Enter a latitude between -90 and 90, such as 60.39 or 60,39.' : null);
        setFieldError(lonInput, lonError, lon === null ? 'Enter a longitude between -180 and 180, such as 5.32 or 5,32.' : null);
        if (lat === null || lon === null) {
            gpsLat = null;
            gpsLon = null;
            setEcho(null);
            hideResults();
            (lat === null ? latInput : lonInput).focus();
            return;
        }
        gpsLat = lat;
        gpsLon = lon;
        setEcho(`Using ${lat}, ${lon}`);
    }
    compute();
}
const btnCompute = document.getElementById('btn-compute');
if (btnCompute) {
    btnCompute.addEventListener('click', onCompute);
}
compute();
