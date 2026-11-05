// The page logic, run as the page runs it (tests/vm-page.ts): cities.js, then the compiled app.js,
// with the clock fixed at 5 November 2026 12:00 in Oslo. The expected values are what the
// JavaScript before the move to TypeScript (commit 7019baf) showed at that instant.

process.env.TZ = 'Europe/Oslo';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './vm-page.ts';

const NOW = Date.parse('2026-11-05T11:00:00Z');
const root = new URL('../', import.meta.url);
const PROMPT = 'Select your observation time and location above, then compute to see planetary visibility.';
const LAT_ERROR = 'Enter a latitude between -90 and 90, such as 60.39 or 60,39.';
const LON_ERROR = 'Enter a longitude between -180 and 180, such as 5.32 or 5,32.';
/** A city of the dropdown, as app.js writes it. */
const option = (name: string, country: string): string => `option|<span class="city-name">${name}</span><span class="city-country">${country}</span>`;

test('load: the year, the date and time of now, every body with no location, the orrery', () => {
  const s = loadPage(root, NOW).state();
  assert.deepEqual([s.year, s.date, s.time, s.status], ['2026', '2026-11-05', '12:00', PROMPT]);
  assert.deepEqual(s.planets.map((r) => [r.name, ...r.coords, r.status]), [
    ['Mercury', 'RA 14h 33m', "Dec -15° 06'", 'p-status p-hidden:No location'],
    ['Venus', 'RA 13h 23m', "Dec -12° 47'", 'p-status p-hidden:No location'],
    ['Mars', 'RA 09h 33m', "Dec +16° 16'", 'p-status p-hidden:No location'],
    ['Jupiter', 'RA 09h 48m', "Dec +14° 01'", 'p-status p-hidden:No location'],
    ['Saturn', 'RA 00h 36m', "Dec +00° 59'", 'p-status p-hidden:No location'],
    ['Uranus', 'RA 04h 08m', "Dec +20° 49'", 'p-status p-hidden:No location'],
    ['Neptune', 'RA 00h 08m', "Dec -00° 39'", 'p-status p-hidden:No location'],
  ]);
  assert.deepEqual(s.dwarfs.map((r) => [r.name, ...r.coords]), [
    ['Ceres', 'RA 07h 39m', "Dec +24° 12'"], ['Pluto', 'RA 20h 24m', "Dec -23° 40'"], ['Haumea', 'RA 14h 42m', "Dec +13° 21'"],
    ['Makemake', 'RA 13h 29m', "Dec +19° 34'"], ['Eris', 'RA 01h 47m', "Dec -00° 09'"],
  ]);
  assert.equal(s.planets[0]?.dot, 'p-dot|{"background":"#B3B3B3","boxShadow":"0 0 6px #B3B3B3"}');
  assert.equal(s.dwarfs[0]?.dot, 'p-dot|{"background":"#C8B9A2","boxShadow":"0 0 4px #C8B9A2","opacity":"0.8"}');
  assert.deepEqual(s.orbits, {
    mercury: 'rotate(-46.931181982707926deg)', venus: 'rotate(-50.07548785953992deg)', earth: 'rotate(-42.6678922594017deg)',
    mars: 'rotate(-102.53554629115439deg)', jupiter: 'rotate(-133.97457340352082deg)', saturn: 'rotate(-12.089622000681345deg)',
  });
  assert.deepEqual([s.hidden.planets, s.hidden.dwarfs, s.hidden.dwarfHeader], [false, false, false]);
});

test('the city search: prefix matches first, ten at most; a pick waits for Compute', () => {
  const page = loadPage(root, NOW);
  page.search('b');
  assert.deepEqual([page.state().dropdown, page.state().hidden.dropdown], [[], true]);
  page.search('erdal');
  assert.deepEqual(page.state().dropdown.slice(0, 3), [option('Erdal', 'Norway'), option('Cloverdale', 'Canada'), option('South Riverdale', 'Canada')]);
  page.search('gothenburg');
  assert.deepEqual(page.state().dropdown, [option('Göteborg', 'Sweden')]);
  page.search('berg');
  assert.equal(page.state().dropdown.length, 10);
  page.search('bergen');
  page.pick(0);
  let s = page.state();
  assert.deepEqual([s.selected, s.search, s.hidden.dropdown, s.hidden.selected, s.status], ['Bergen, Norway', '', true, false, PROMPT]);
  page.click('btn-compute');
  s = page.state();
  assert.equal(s.status, 'The Sun is 13.7° above the horizon. Planets count as visible once it is 6° below.');
  assert.deepEqual(s.planets.map((r) => [r.name, r.coords[2], r.status]), [
    ['Mercury', 'p-alt:Alt 14.3°', 'p-status p-hidden:Daylight'], ['Venus', 'p-alt:Alt 15.8°', 'p-status p-hidden:Daylight'],
    ['Mars', 'p-alt:Alt 23.2°', 'p-status p-hidden:Daylight'], ['Jupiter', 'p-alt:Alt 23.0°', 'p-status p-hidden:Daylight'],
    ['Saturn', 'p-alt:Alt -25.3°', 'p-status p-hidden:Below the horizon'], ['Uranus', 'p-alt:Alt -5.7°', 'p-status p-hidden:Below the horizon'],
    ['Neptune', 'p-alt:Alt -25.1°', 'p-status p-hidden:Below the horizon'],
  ]);
});

test('a chosen time: visible at night, twilight at dusk, and the clear button', () => {
  const page = loadPage(root, NOW);
  page.search('bergen');
  page.pick(0);
  page.type('date-input', '2026-12-21');
  page.type('time-input', '23:30');
  page.click('btn-compute');
  let s = page.state();
  assert.equal(s.status, 'The Sun is 51.2° below the horizon. Planets count as visible once it is 6° below.');
  assert.deepEqual(s.planets.map((r) => r.status.split(':')[1]), ['Below the horizon', 'Below the horizon', 'Visible', 'Visible', 'Visible', 'Visible', 'Visible']);
  assert.deepEqual(s.dwarfs.map((r) => [r.name, r.coords[2], r.status]), [
    ['Ceres', 'p-alt:Alt 47.9°', 'p-status p-visible:Visible'], ['Pluto', 'p-alt:Alt -37.6°', 'p-status p-hidden:Below the horizon'],
    ['Haumea', 'p-alt:Alt -12.3°', 'p-status p-hidden:Below the horizon'], ['Makemake', 'p-alt:Alt -0.6°', 'p-status p-hidden:Below the horizon'],
    ['Eris', 'p-alt:Alt 19.8°', 'p-status p-visible:Visible'],
  ]);
  page.type('time-input', '16:00');
  page.click('btn-compute');
  s = page.state();
  assert.equal(s.status, 'The Sun is 3.4° below the horizon. Planets count as visible once it is 6° below.');
  assert.deepEqual(s.planets.map((r) => r.status.split(':')[1]), ['Below the horizon', 'Below the horizon', 'Below the horizon', 'Below the horizon', 'Twilight', 'Twilight', 'Twilight']);
  page.click('city-clear-btn');
  page.click('btn-compute');
  s = page.state();
  assert.deepEqual([s.hidden.selected, s.status, s.planets[0]?.status], [true, PROMPT, 'p-status p-hidden:No location']);
});

test('typed coordinates: a decimal comma and a Unicode minus work; a bad value hides the results', () => {
  const page = loadPage(root, NOW);
  page.click('tab-gps');
  let s = page.state();
  assert.deepEqual([s.tab, s.panels], ['tab-city:tab:false tab-gps:tab active:true', ['panel-city:tab-panel:true', 'panel-gps:tab-panel active:false']]);
  page.click('btn-compute');
  s = page.state();
  assert.deepEqual([s.latError, s.lonError, s.invalid, s.focus, s.hidden.planets, s.hidden.dwarfs, s.hidden.dwarfHeader], [LAT_ERROR, LON_ERROR, ['true', 'true'], 'lat-input', true, true, true]);
  page.type('lat-input', '60,39');
  assert.deepEqual([page.state().latError, page.state().invalid], ['', [null, 'true']]);
  page.type('lon-input', '5,32');
  page.click('btn-compute');
  s = page.state();
  assert.deepEqual([s.echo, s.hidden.echo, s.hidden.planets], ['Using 60.39, 5.32', false, false]);
  assert.equal(s.status, 'The Sun is 13.7° above the horizon. Planets count as visible once it is 6° below.');
  page.type('lat-input', '\u221233,87');
  page.type('lon-input', '151.21');
  page.click('btn-compute');
  assert.equal(page.state().echo, 'Using -33.87, 151.21');
  page.type('lat-input', '45');
  page.type('lon-input', 'abc');
  page.click('btn-compute');
  s = page.state();
  assert.deepEqual([s.latError, s.lonError, s.invalid, s.focus, s.echo, s.hidden.planets, s.status], ['', LON_ERROR, [null, 'true'], 'lon-input', '', true, PROMPT]);
});

test('the dwarf planets only inside their years; the orrery tooltip', () => {
  const page = loadPage(root, NOW);
  page.type('date-input', '2040-06-01');
  page.click('btn-compute');
  assert.deepEqual(page.state().dwarfs.map((r) => [r.name, r.coords[0], r.status]), [
    ['Ceres', 'Shown for 2017 to 2036 only', 'p-status p-hidden:Out of range'], ['Pluto', 'RA 22h 09m', 'p-status p-hidden:No location'],
    ['Haumea', 'RA 15h 31m', 'p-status p-hidden:No location'], ['Makemake', 'RA 14h 04m', 'p-status p-hidden:No location'],
    ['Eris', 'RA 01h 56m', 'p-status p-hidden:No location'],
  ]);
  page.type('date-input', '1940-01-01');
  page.click('btn-compute');
  assert.deepEqual(page.state().dwarfs.map((r) => r.coords[0]), ['Shown for 2017 to 2036 only', ...Array<string>(4).fill('Shown for 1950 to 2099 only')]);
  assert.equal(page.hover('Mars'), 'orrery-tooltip visible|Mars|{"left":"62px","top":"32px"}');
  assert.equal(page.state().tooltip, 'orrery-tooltip|Mars|{"left":"62px","top":"32px"}');
});

test('the model: Julian dates, Kepler, positions, altitude, formats and the shared parser', () => {
  const page = loadPage(root, NOW);
  assert.equal(page.evaluate('julianDate(new Date("2026-11-05T11:00:00Z"))'), '2461349.9583333335');
  assert.equal(page.evaluate('eccentricAnomaly(1, 0.2056)'), '1.1909447672233229');
  assert.equal(page.evaluate('heliocentricPosition(PLANETS.Mars, 2451545)'), '{"x":1.3906677476780214,"y":-0.013391064158330135,"z":-0.03446125922330577}');
  assert.equal(page.evaluate('toAltAz(250.1, -22.3, 60.39, 5.32, new Date("2026-11-05T11:00:00Z"))'), '{"altitude":2.5311028740068826,"azimuth":147.83486802916957}');
  assert.deepEqual(['formatRA(359.999)', 'formatDec(-0.0001)', 'formatDec(45.9999)'].map((e) => page.evaluate(e)), ['"RA 23h 59m"', '"Dec -00° 00\'"', '"Dec +45° 59\'"']);
  assert.deepEqual(['visibilityStatus(0, -30)', 'visibilityStatus(1, 0.1)', 'visibilityStatus(1, -6)', 'visibilityStatus(1, -6.1)'].map((e) => JSON.parse(page.evaluate(e)).text),
    ['Below the horizon', 'Daylight', 'Visible', 'Visible']);
  const parse: [string, string][] = [['60,39', '60.39'], ['\u221233,87', '-33.87'], ['  7  ', '7'], ['.5', '0.5'], ['5.', '5'], ['9 0', '90'], ['1,2,3', 'null'], ['1e2', 'null'], ['90.0001', 'null'], ['abc', 'null']];
  for (const [text, want] of parse) assert.equal(page.call('parseDecimal', [text, -90, 90]), want, text);
});
