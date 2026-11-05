// Runs the page's two scripts, cities.js and then the compiled app.js, in a fresh node:vm context,
// one global scope as in a browser, with a stub of the page parts app.js touches and a clock fixed
// at a given instant. No browser and no DOM library: app.js is a classic script that reads the page
// as it loads, so it cannot be imported; this runs it as the page does (app.js has defer, so the
// page is complete when it runs), then lets a test search for a city, pick one, switch the tabs,
// type coordinates and press Compute through the same listeners the page uses.
// Adapted from WeatherWhisper's tests/vm-page.ts (5 November 2026).

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

type Child = StubElement | string;

/** A page element with only what app.js uses. */
class StubElement {
  readonly tag: string;
  id = '';
  className = '';
  hidden = false;
  role: string | null = null;
  parent: StubElement | null = null;
  #text = '';
  #html = '';
  readonly children: Child[] = [];
  readonly style: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, ((e: object) => void)[]>();
  constructor(tag: string, id = '', className = '') { this.tag = tag; this.id = id; this.className = className; }
  get textContent(): string { return this.children.length ? this.children.map((c) => typeof c === 'string' ? c : c.textContent).join('') : this.#text; }
  /** As in the DOM, the text of a value: null gives '', and the old app.js passed a number. */
  set textContent(v: string | null) { this.children.splice(0); this.#text = v === null ? '' : String(v); }
  /** Markup is only recorded; setting it to '' empties the element, as app.js expects. */
  get innerHTML(): string { return this.#html; }
  set innerHTML(html: string) { this.#html = html; this.#text = ''; this.children.splice(0); }
  readonly classList = {
    add: (c: string): void => { const l = this.className.split(' ').filter(Boolean); if (!l.includes(c)) l.push(c); this.className = l.join(' '); },
    remove: (c: string): void => { this.className = this.className.split(' ').filter((x) => x && x !== c).join(' '); },
    contains: (c: string): boolean => this.className.split(' ').includes(c),
  };
  setAttribute(name: string, value: string): void { this.attributes.set(name, String(value)); if (name.startsWith('data-')) this.dataset[name.slice(5)] = String(value); }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  appendChild(child: StubElement): StubElement { child.parent = this; this.children.push(child); return child; }
  append(...nodes: Child[]): void { for (const n of nodes) { if (typeof n !== 'string') n.parent = this; this.children.push(n); } }
  addEventListener(type: string, fn: (e: object) => void): void { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); }
  focus(): void { focused.id = this.id; }
  getBoundingClientRect(): { left: number; top: number } { return { left: 100, top: 200 }; }
  /** Matches '.class' and '[attr]' only, which is all app.js asks for. */
  matches(sel: string): boolean { return sel.startsWith('.') ? this.classList.contains(sel.slice(1)) : sel.startsWith('[') ? this.attributes.has(sel.slice(1, -1)) : false; }
  closest(sel: string): StubElement | null { for (let e: StubElement | null = this; e; e = e.parent) if (e.matches(sel)) return e; return null; }
  fire(type: string, event: object = {}): void { for (const fn of this.listeners.get(type) ?? []) fn({ target: this, ...event }); }
}
// The kinds app.js checks with instanceof.
class StubInput extends StubElement { value = ''; }
const focused = { id: '' };

/** A result row as the page shows it. */
export interface Row {
  name: string;
  dot: string;
  coords: string[];
  status: string;
}

/** What the page shows. */
export interface PageState {
  year: string;
  date: string;
  time: string;
  tab: string;
  panels: string[];
  status: string;
  hidden: { planets: boolean; dwarfs: boolean; dwarfHeader: boolean; dropdown: boolean; selected: boolean; latError: boolean; lonError: boolean; echo: boolean };
  orbits: Record<string, string>;
  planets: Row[];
  dwarfs: Row[];
  dropdown: string[];
  selected: string;
  search: string;
  latError: string;
  lonError: string;
  invalid: [string | null, string | null];
  echo: string;
  focus: string;
  tooltip: string;
}

export interface Page {
  state(): PageState;
  /** Types text into the city search, as the input event delivers it. */
  search(text: string): void;
  /** Clicks one city of the dropdown (its place in the list). */
  pick(index: number): void;
  /** Clicks an element by id (a tab, Compute, the clear button), then the document as a click bubbles. */
  click(id: string): void;
  /** Clicks somewhere outside the search. */
  clickOutside(): void;
  /** Types into a field (lat-input, lon-input, date-input, time-input), firing input. */
  type(id: string, text: string): void;
  /** Moves the mouse onto a planet of the orrery, then away. */
  hover(planet: string): string;
  /** Calls a global function of app.js with JSON arguments; Date arguments as { date: iso }. */
  call(name: string, args: (number | string | null | { date: string })[]): string;
  /** Evaluates an expression in the page's global scope and gives its JSON. */
  evaluate(expression: string): string;
}

const ORBITS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];

/** Loads cities.js and app.js from root (a directory URL) at the instant now. */
export function loadPage(root: URL, now: number): Page {
  focused.id = '';
  const all: StubElement[] = [];
  const make = (tag: string, id: string, className = '', parent?: StubElement): StubElement => {
    const e = tag === 'input' ? new StubInput(tag, id, className) : new StubElement(tag, id, className);
    if (parent) parent.appendChild(e);
    all.push(e);
    return e;
  };
  const orrery = make('section', '', 'orrery-card');
  make('div', 'orrery-tooltip', 'orrery-tooltip', orrery);
  const sun = make('div', 'sun', 'celestial-body sun', orrery);
  sun.setAttribute('data-planet', 'Sun');
  for (const o of ORBITS) {
    const orbit = make('div', `orbit-${o}`, `orbit orbit-${o}`, orrery);
    make('div', '', `celestial-body planet bg-${o}`, orbit).setAttribute('data-planet', o[0]?.toUpperCase() + o.slice(1));
  }
  const tabCity = make('button', 'tab-city', 'tab active');
  tabCity.setAttribute('data-tab', 'city');
  const tabGps = make('button', 'tab-gps', 'tab');
  tabGps.setAttribute('data-tab', 'gps');
  make('div', 'panel-city', 'tab-panel active');
  make('div', 'panel-gps', 'tab-panel').hidden = true;
  const wrapper = make('div', '', 'search-wrapper');
  make('input', 'city-search', 'search-input', wrapper);
  make('ul', 'city-dropdown', 'dropdown', wrapper).hidden = true;
  make('div', 'city-selected', 'selected-city').hidden = true;
  make('span', 'city-selected-text');
  make('button', 'city-clear-btn', 'clear-btn');
  make('input', 'lat-input', 'text-input');
  make('p', 'lat-error', 'field-error').hidden = true;
  make('input', 'lon-input', 'text-input');
  make('p', 'lon-error', 'field-error').hidden = true;
  make('p', 'gps-echo', 'field-note').hidden = true;
  make('input', 'date-input', 'text-input');
  make('input', 'time-input', 'text-input');
  make('button', 'btn-compute', 'btn btn-primary');
  make('p', 'loc-status', 'hero-desc').textContent = 'Select your observation time and location above, then compute to see planetary visibility.';
  make('section', 'planet-grid', 'planet-grid fade-in');
  make('div', 'dwarf-header', 'timeline-header');
  make('section', 'dwarf-grid', 'planet-grid fade-in');
  make('span', 'current-year').textContent = '2026';
  const byId = new Map(all.filter((e) => e.id).map((e) => [e.id, e]));
  const docListeners = new Map<string, ((e: object) => void)[]>();

  // The clock: new Date() and Date.now() give the fixed instant; every other use is the real Date.
  class FixedDate extends Date {
    constructor(...args: [] | [number | string | Date]) {
      if (args.length === 0) super(now); else super(args[0]);
    }
    static override now(): number { return now; }
  }

  const sandbox = {
    Date: FixedDate,
    Element: StubElement,
    HTMLElement: StubElement,
    HTMLInputElement: StubInput,
    document: {
      getElementById: (id: string): StubElement | null => byId.get(id) ?? null,
      querySelector: (sel: string): StubElement | null => all.find((e) => e.matches(sel)) ?? null,
      querySelectorAll: (sel: string): StubElement[] => all.filter((e) => e.matches(sel)),
      addEventListener: (type: string, fn: (e: object) => void): void => { docListeners.set(type, [...(docListeners.get(type) ?? []), fn]); },
      createElement: (tag: string): StubElement => new StubElement(tag),
    },
  };
  const context = createContext(sandbox);
  runInContext('var window = globalThis;', context);
  for (const file of ['cities.js', 'app.js']) {
    runInContext(readFileSync(new URL(file, root), 'utf8'), context, { filename: file });
  }

  const el = (id: string): StubElement => {
    const e = byId.get(id);
    if (!e) throw new Error(`no stub #${id}`);
    return e;
  };
  const input = (id: string): StubInput => {
    const e = el(id);
    if (!(e instanceof StubInput)) throw new Error(`#${id} is not an input`);
    return e;
  };
  const rows = (grid: StubElement): Row[] => grid.children.map((r) => {
    if (typeof r === 'string') return { name: r, dot: '', coords: [], status: '' };
    const [nameEl, coordsEl, statusEl] = r.children;
    const kids = (c: Child | undefined): Child[] => (c && typeof c !== 'string' ? c.children : []);
    const dot = kids(nameEl)[0];
    return {
      name: kids(nameEl).filter((c) => typeof c === 'string').join(''),
      dot: dot && typeof dot !== 'string' ? `${dot.className}|${JSON.stringify(dot.style)}` : '',
      coords: kids(coordsEl).map((c) => (typeof c === 'string' ? c : `${c.className ? `${c.className}:` : ''}${c.textContent}`)),
      status: statusEl && typeof statusEl !== 'string' ? `${statusEl.className}:${statusEl.textContent}` : '',
    };
  });
  const clickDoc = (target: StubElement): void => { for (const fn of docListeners.get('click') ?? []) fn({ target }); };
  return {
    state: () => ({
      year: el('current-year').textContent,
      date: input('date-input').value,
      time: input('time-input').value,
      tab: [tabCity, tabGps].map((t) => `${t.id}:${t.className}:${t.getAttribute('aria-selected')}`).join(' '),
      panels: ['panel-city', 'panel-gps'].map((p) => `${p}:${el(p).className}:${el(p).hidden}`),
      status: el('loc-status').textContent,
      hidden: {
        planets: el('planet-grid').hidden, dwarfs: el('dwarf-grid').hidden, dwarfHeader: el('dwarf-header').hidden,
        dropdown: el('city-dropdown').hidden, selected: el('city-selected').hidden, latError: el('lat-error').hidden,
        lonError: el('lon-error').hidden, echo: el('gps-echo').hidden,
      },
      orbits: Object.fromEntries(ORBITS.map((o) => [o, el(`orbit-${o}`).style['transform'] ?? ''])),
      planets: rows(el('planet-grid')),
      dwarfs: rows(el('dwarf-grid')),
      dropdown: el('city-dropdown').children.map((c) => (typeof c === 'string' ? c : `${c.role}|${c.innerHTML}`)),
      selected: el('city-selected-text').textContent,
      search: input('city-search').value,
      latError: el('lat-error').textContent,
      lonError: el('lon-error').textContent,
      invalid: [el('lat-input').getAttribute('aria-invalid'), el('lon-input').getAttribute('aria-invalid')],
      echo: el('gps-echo').textContent,
      focus: focused.id,
      tooltip: `${el('orrery-tooltip').className}|${el('orrery-tooltip').textContent}|${JSON.stringify(el('orrery-tooltip').style)}`,
    }),
    search: (text) => { const s = input('city-search'); s.value = text; s.fire('input'); },
    pick: (index) => {
      const li = el('city-dropdown').children[index];
      if (!li || typeof li === 'string') throw new Error(`no city at ${index}`);
      li.fire('click');
      clickDoc(li);
    },
    click: (id) => { const e = el(id); e.fire('click'); clickDoc(e); },
    clickOutside: () => clickDoc(el('loc-status')),
    type: (id, text) => { const e = input(id); e.value = text; e.fire('input'); },
    hover: (planet) => {
      const dot = all.find((e) => e.getAttribute('data-planet') === planet);
      if (!dot) throw new Error(`no planet ${planet}`);
      const card = orrery;
      for (const fn of card.listeners.get('mouseover') ?? []) fn({ target: dot });
      for (const fn of card.listeners.get('mousemove') ?? []) fn({ target: dot, clientX: 150, clientY: 260 });
      const over = `${el('orrery-tooltip').className}|${el('orrery-tooltip').textContent}|${JSON.stringify(el('orrery-tooltip').style)}`;
      for (const fn of card.listeners.get('mouseout') ?? []) fn({ target: dot });
      return over;
    },
    call: (name, args) => String(JSON.stringify(runInContext(`${name}(${args.map((a) => (a !== null && typeof a === 'object' ? `new Date(${JSON.stringify(a.date)})` : JSON.stringify(a))).join(', ')})`, context))),
    evaluate: (expression) => String(JSON.stringify(runInContext(expression, context))),
  };
}
