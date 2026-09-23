// Source-level routing regression checks, without a DOM or WebGL renderer.
// Run: node --test scripts/test-zone-exhibit-routing.mjs
// Rendering and full application integration still require browser verification.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const readSource = (path) => readFileSync(resolve(root, path), 'utf8');
const zoneSource = readSource('src/zones/ZoneViewer.ts');
const appSource = readSource('src/core/ShowroomApplication.ts');
const dataSource = readSource('src/zones/data/zoneExhibits.ts');
const definitionSource = readSource('src/exhibits/data/mvrWastewaterTreatment.ts');
const canonicalId = definitionSource.match(/export const mvrWastewaterTreatmentDefinition\s*=\s*\{\s*id:\s*'([^']+)'/)?.[1];
assert.ok(canonicalId, 'Read the actual frozen MVR definition ID');
const ViewMode = { ZONE: 'ZONE', SHOWROOM: 'SHOWROOM', EXHIBIT: 'EXHIBIT' };
const arraySource = dataSource.match(/export const zone01Exhibits:[^=]+=(\s*\[[\s\S]*?\n\]) as const;/)?.[1];
assert.ok(arraySource, 'Locate the actual configured exhibit array');
const entries = new Function('mvrWastewaterTreatmentDefinition', `return (${arraySource});`)({ id: canonicalId });
const mvr = entries.find((entry) => entry.id === 'MVR_WASTEWATER');

const handlerBody = zoneSource.match(/private handleExhibitClick\(exhibit: ExhibitEntry\): void \{([\s\S]*?)\n  \}\n\n  private showStatusMessage/)?.[1];
assert.ok(handlerBody, 'Locate the actual hotspot click handler');
const callbackBody = appSource.match(/\(viewerId, position\) => \{([\s\S]*?)\n      \},\n    \);/)?.[1];
assert.ok(callbackBody, 'Locate the actual application routing callback');
class Vector3 { constructor(...coordinates) { this.coordinates = coordinates; } }
const quietConsole = { info() {}, error() {} };
const click = new Function('ViewMode', 'Vector3', 'console', `return function(exhibit) {${handlerBody}\n};`)(ViewMode, Vector3, quietConsole);

function fixture() {
  const events = [];
  const registeredExhibit = { metadata: { id: canonicalId }, object: { visible: false } };
  const registry = new Map([[canonicalId, registeredExhibit]]);
  const mode = { mode: ViewMode.ZONE, set(value) { this.mode = value; events.push(['mode', value]); } };
  const makeClasses = () => ({ add(...names) { events.push(['class-add', ...names]); }, remove(...names) { events.push(['class-remove', ...names]); } });
  const app = {
    exhibits: { get(id) { events.push(['resolve', id]); return registry.get(id); } },
    exhibitViewer: { enter(exhibit, position) {
      // Match the existing frozen viewer's SHOWROOM-only entry contract.
      assert.equal(mode.mode, ViewMode.SHOWROOM);
      events.push(['enter', exhibit, position]);
      exhibit.object.visible = true;
      mode.set(ViewMode.EXHIBIT);
    } },
    hotspots: { setEnabled(value) { events.push(['hotspots', value]); } },
    componentInteractions: { activate(exhibit) { events.push(['components', exhibit]); } },
    modeMenu: {
      setMode(value) { events.push(['menu-mode', value]); },
      setExploded(value) { events.push(['exploded', value]); },
      show() { events.push(['menu-show']); },
    },
  };
  const prepare = new Function('console', `return function() { return (viewerId, position) => {${callbackBody}\n}; };`)(quietConsole).call(app);
  const initialState = { label: 'saved main-showroom camera' };
  const zone = {
    viewMode: mode, transition: null, showroomState: initialState,
    group: { visible: true },
    panel: { classList: makeClasses(), setAttribute(...args) { events.push(['attribute', ...args]); } },
    canvas: { classList: makeClasses() },
    camera: {
      applyState(state) { events.push(['camera', state]); },
      setNavigationEnabled(value) { events.push(['navigation', value]); },
    },
    onVisibilityChange(value) { events.push(['visibility', value]); },
    showStatusMessage(message) { events.push(['status', message]); },
    prepareExhibit: prepare,
    // Keep the old callback available when checking a pre-fix source snapshot.
    onOpenExhibit: prepare,
  };
  return { zone, events, registeredExhibit, initialState };
}

function assertZonePreserved(state) {
  assert.equal(state.zone.viewMode.mode, ViewMode.ZONE);
  assert.equal(state.zone.group.visible, true);
  assert.equal(state.zone.showroomState, state.initialState);
  assert.ok(!state.events.some(([kind]) => ['enter', 'camera', 'mode', 'visibility', 'navigation', 'class-remove'].includes(kind)));
}

test('MVR configuration uses the frozen definition ID instead of the nonexistent mvr alias', () => {
  assert.match(dataSource, /viewerId:\s*mvrWastewaterTreatmentDefinition\.id/);
  assert.equal(mvr.viewerId, canonicalId);
});

test('MVR hotspot opens the registered exhibit and activates its existing controls', () => {
  const state = fixture();
  click.call(state.zone, mvr);
  assert.equal(state.zone.viewMode.mode, ViewMode.EXHIBIT);
  const entered = state.events.filter(([kind]) => kind === 'enter');
  assert.equal(entered.length, 1);
  assert.equal(entered[0][1], state.registeredExhibit);
  assert.deepEqual(entered[0][2].coordinates, mvr.previewPosition);
  assert.equal(state.registeredExhibit.object.visible, true);
  assert.ok(state.events.findIndex(([kind]) => kind === 'resolve') < state.events.findIndex(([kind]) => kind === 'camera'));
  assert.ok(state.events.some(([kind, value]) => kind === 'hotspots' && value === false));
  assert.ok(state.events.some(([kind, value]) => kind === 'components' && value === state.registeredExhibit));
  assert.ok(state.events.some(([kind]) => kind === 'menu-show'));
});

test('unregistered viewer ID preserves the zone and reports a visible status', () => {
  const state = fixture();
  click.call(state.zone, { ...mvr, viewerId: 'missing-viewer' });
  assertZonePreserved(state);
  assert.ok(state.events.some(([kind, text]) => kind === 'status' && text.includes('尚未接入')));
});

test('coming-soon exhibits stay in the zone without registry or viewer calls', () => {
  const state = fixture();
  click.call(state.zone, entries.find((entry) => entry.status === 'coming'));
  assertZonePreserved(state);
  assert.ok(!state.events.some(([kind]) => kind === 'resolve'));
  assert.ok(state.events.some(([kind, text]) => kind === 'status' && text.includes('即将开放')));
});

test('clicking during an active zone transition does not interrupt navigation', () => {
  const state = fixture();
  const transition = { elapsed: 0.2 };
  state.zone.transition = transition;
  click.call(state.zone, mvr);
  assertZonePreserved(state);
  assert.equal(state.zone.transition, transition);
  assert.equal(state.events.length, 0);
});

test('repeated click after entering the exhibit cannot open a second viewer', () => {
  const state = fixture();
  click.call(state.zone, mvr);
  click.call(state.zone, mvr);
  assert.equal(state.events.filter(([kind]) => kind === 'enter').length, 1);
});
