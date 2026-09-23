// Exercises the real application, ZoneViewer, ExhibitViewer, menu and showcase methods.
// DOM, Three.js rendering/picking, camera controls and frozen feature controllers
// are isolated doubles: these checks are NOT a WebGL/browser acceptance test.
// Run after npm ci: node --test scripts/test-zone-exhibit-routing.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = new URL('../', import.meta.url);

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
  set(x, y, z) { Object.assign(this, { x, y, z }); return this; }
  setScalar(v) { return this.set(v, v, v); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { return this.set(v.x, v.y, v.z); }
  add(v) { return this.set(this.x + v.x, this.y + v.y, this.z + v.z); }
  addScaledVector(v, k) { return this.add(v.clone().set(v.x * k, v.y * k, v.z * k)); }
  normalize() { const d = Math.hypot(this.x, this.y, this.z) || 1; return this.set(this.x / d, this.y / d, this.z / d); }
  lerp(v, k) { return this.set(this.x + (v.x - this.x) * k, this.y + (v.y - this.y) * k, this.z + (v.z - this.z) * k); }
}
let failCanvasAfter = Infinity;
class Element {
  constructor() {
    this.children = []; this.dataset = {}; this.style = {}; this.attributes = {};
    this.hidden = false; this.disabled = false; this.clientWidth = 1280; this.clientHeight = 720;
    this.selectors = new Map(); this.listeners = new Map(); this.captures = new Set();
    const classes = new Set();
    this.classList = {
      add: (...v) => v.forEach((c) => classes.add(c)),
      remove: (...v) => v.forEach((c) => classes.delete(c)),
      contains: (v) => classes.has(v),
      toggle: (v, flag) => { if (flag ?? !classes.has(v)) classes.add(v); else classes.delete(v); },
    };
  }
  set innerHTML(text) { this.html = text; }
  querySelector(selector) {
    if (!this.selectors.has(selector)) this.selectors.set(selector, new Element());
    return this.selectors.get(selector);
  }
  getContext() {
    if (failCanvasAfter-- === 0) return null;
    this.context = { texts: [], fillRect() {}, strokeRect() {},
      fillText(text) { this.texts.push({ text, color: this.fillStyle }); } };
    return this.context;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  append(...v) { this.children.push(...v); }
  addEventListener(k, fn) { this.listeners.set(k, fn); }
  removeEventListener(k) { this.listeners.delete(k); }
  click() { this.listeners.get('click')?.({ currentTarget: this }); }
  remove() {}
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  setPointerCapture(id) { this.captures.add(id); }
}
class Group {
  constructor() {
    this.visible = true; this.children = []; this.position = new Vector3();
    this.rotation = new Vector3(); this.quaternion = { copy(value) { this.copied = value; } };
    this.scale = new Vector3(1, 1, 1); this.userData = {}; this.parent = null;
  }
  add(...children) { children.forEach((child) => { child.parent = this; this.children.push(child); }); }
  clear() { this.children.forEach((child) => { child.parent = null; }); this.children.length = 0; }
  removeFromParent() {
    if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
    this.parent = null;
  }
  getObjectByName(name) {
    if (this.name === name) return this;
    for (const child of this.children) { const found = child.getObjectByName?.(name); if (found) return found; }
  }
}
const resources = [];
class Resource {
  constructor(...args) { this.args = args; this.disposeCalls = 0; resources.push(this); }
  dispose() { this.disposeCalls++; }
}
class Material extends Resource { constructor(properties) { super(properties); Object.assign(this, properties); } }
class Mesh extends Group { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } }
const three = {
  Vector3, Vector2: Vector3, Group, Scene: Group, Mesh,
  Box3: class { setFromObject() { return this; } getSize(v) { return v.set(8, 6, 4); } },
  MathUtils: { clamp: (v, min, max) => Math.max(min, Math.min(v, max)) },
  Clock: class {}, Color: class {}, Fog: class {},
  BufferGeometry: Resource, Material, MeshBasicMaterial: Material, MeshPhysicalMaterial: Material, MeshStandardMaterial: Material,
  CanvasTexture: class extends Resource { constructor(image) { super(image); this.image = image; } },
  AdditiveBlending: 2, DoubleSide: 2, SRGBColorSpace: 'srgb',
};
for (const name of ['BoxGeometry', 'CylinderGeometry', 'OctahedronGeometry', 'PlaneGeometry', 'RingGeometry', 'SphereGeometry']) {
  three[name] = class extends Resource { constructor(...args) { super(...args); this.type = name; } };
}
class RaycastDouble {
  static created = 0;
  constructor(options) { this.options = options; this.disposeCalls = 0; RaycastDouble.created++; }
  dispose() { this.disposeCalls++; }
}
const fakeWindow = { addEventListener() {}, removeEventListener() {}, setTimeout() { return 1; }, clearTimeout() {} };
const fakeDocument = { createElement: () => new Element() };
function load(path, dependencies = {}) {
  const source = readFileSync(new URL(path, root), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true, fileName: path,
  });
  assert.equal(diagnostics?.length ?? 0, 0, `Transpile ${path}`);
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'document', 'window', 'console', outputText)(
    (id) => { assert.ok(id in dependencies, `Explicit test dependency: ${id}`); return dependencies[id]; },
    module, module.exports, fakeDocument, fakeWindow, { info() {}, error() {} },
  );
  return module.exports;
}
const modes = load('src/core/ViewMode.ts');
const { ViewMode } = modes;
// An arbitrary supplied ID detects reintroduction of a hardcoded "mvr" alias.
const metadata = { id: 'canonical-mvr-test-definition', components: [] };
const definitionModule = { mvrWastewaterTreatmentDefinition: metadata };
const { zone01Exhibits: entries } = load('src/zones/data/zoneExhibits.ts', {
  '../../exhibits/data/mvrWastewaterTreatment': definitionModule,
});
const mvr = entries[0];
const { ExhibitViewer } = load('src/exhibits/ExhibitViewer.ts', { three, '../core/ViewMode': modes });
const { ExhibitModeMenu } = load('src/exhibits/navigation/ExhibitModeMenu.ts');
const standModule = load('src/zones/components/ZoneExhibitStand.ts', { three });
const showcaseModule = load('src/zones/components/ZoneExhibitShowcase.ts', {
  three, './ZoneExhibitStand': standModule,
  '../../interaction/RaycastManager': { RaycastManager: RaycastDouble },
});
const { ZoneExhibitShowcase } = showcaseModule;
const { ZoneViewer } = load('src/zones/ZoneViewer.ts', {
  three, '../core/ViewMode': modes, './components/ZoneExhibitShowcase': showcaseModule,
});
// Omit environmental meshes only; use the real stand, showcase, click and return methods.
ZoneViewer.prototype.createWaterEnvironment = () => new Group();
class CameraController {
  constructor() { this.camera = new Group(); this.target = new Vector3(); this.enabled = true; }
  captureState() { return { position: this.camera.position.clone(), target: this.target.clone() }; }
  applyState(s) { this.camera.position.copy(s.position); this.target.copy(s.target); }
  setNavigationEnabled(v) { this.enabled = v; }
  resize() {}
}
class Registry {
  constructor() { this.group = new Group(); this.items = new Map(); }
  register(e) { this.items.set(e.metadata.id, e); }
  get(id) { return this.items.get(id); }
}
class Controller {
  constructor() { this.cleanups = 0; }
  exit() { this.cleanups++; }
  cleanupAll() { this.cleanups++; }
  collapse() { this.cleanups++; }
  deactivate() { this.active = false; this.cleanups++; }
  activate(exhibit) { this.active = exhibit; }
  registerCleanup() {}
}
const { ShowroomApplication } = load('src/core/ShowroomApplication.ts', {
  three,
  '../exhibits/ExhibitRegistry': { ExhibitRegistry: Registry },
  '../exhibits/ExhibitShowcase': { ExhibitShowcase: class { showAt() { this.visible = true; } hide() { this.visible = false; } } },
  '../exhibits/ExhibitViewer': { ExhibitViewer },
  '../exhibits/explosion/ExplosionController': { ExplosionController: Controller },
  '../exhibits/components/ComponentInteractionManager': { ComponentInteractionManager: Controller },
  '../exhibits/data/mvrWastewaterTreatment': definitionModule,
  '../exhibits/models/MvrWastewaterTreatmentModel': { MvrWastewaterTreatmentModel: class {
    constructor(value) { this.metadata = value; this.object = new Group(); this.object.visible = false; }
  } },
  '../exhibits/process/ProcessController': { ProcessController: Controller },
  '../exhibits/technology/TechnologyController': { TechnologyController: Controller },
  '../exhibits/navigation/ExhibitModeMenu': { ExhibitModeMenu },
  '../exhibits/optimization/ExhibitResourceManager': { ExhibitResourceManager: Controller },
  '../interaction/HotspotManager': { HotspotManager: class { constructor() { this.group = new Group(); } setEnabled(v) { this.enabled = v; } } },
  '../showroom/Showroom': { Showroom: class { constructor() { this.group = new Group(); this.zones = []; } } },
  '../ui/InfoPanel': { InfoPanel: class { setViewMode(v) { this.mode = v; } showExhibit() { this.visible = true; } hideExhibit() { this.visible = false; } } },
  '../zones/ZoneManager': { ZoneManager: class {} },
  '../zones/ZoneViewer': { ZoneViewer },
  '../zones/data/zones': { zoneDefinitions: [] },
  './CameraController': { CameraController },
  './LightingRig': { LightingRig: class {} },
  './RendererManager': { RendererManager: class { constructor() { this.renderer = { domElement: new Element() }; } resize() {} } },
  './ViewMode': modes,
});
const cameraState = (x, z) => ({ position: new Vector3(x, 5, z), target: new Vector3(x / 2, 2, z - 5) });
function fixture(zoneId = 'ZONE_01', title = '水环境治理') {
  const app = new ShowroomApplication(new Element());
  const hall = cameraState(1, 23);
  app.camera.applyState(hall);
  const definition = { id: 'ZONE_01', title, englishTitle: '', description: '', exhibits: entries,
    cameraTarget: [0, 2, -42], entryPosition: [0, 5, -30], entryDirection: [0, 0, -1] };
  assert.equal(app.zoneViewer.enter(definition, new Vector3()), true);
  app.zoneViewer.update(0.78); app.zoneViewer.update(0.62);
  // Future-zone fixture checks origin routing, not whether its geometry exists.
  app.zoneViewer.currentDefinition = { ...definition, id: zoneId };
  const zone = cameraState(6, -36);
  app.camera.applyState(zone);
  return { app, hall, zone, scene: app.zoneViewer.group, target: app.zoneViewer.exhibitShowcase.targets[0] };
}
function open(f) {
  f.app.zoneViewer.exhibitShowcase.raycastManager.options.onClick(f.target);
  assert.equal(f.app.viewMode.mode, ViewMode.EXHIBIT);
  f.app.exhibitViewer.update(0.85);
}
function clickReturn(f, mode = 'return-zone') {
  f.app.modeMenu.buttons.get(mode).click();
  f.app.exhibitViewer.update(0.85);
}

test('MVR data references the supplied registered definition, not a hardcoded alias', () => {
  assert.equal(mvr.viewerId, metadata.id);
});
test('opens frozen exhibit from ZONE without a main-hall camera reset', () => {
  const f = fixture();
  f.app.zoneViewer.exhibitShowcase.raycastManager.options.onClick(f.target);
  assert.deepEqual(f.app.camera.captureState(), f.zone);
  assert.equal(f.app.exhibits.get(mvr.viewerId).object.visible, true);
  assert.equal(f.app.showroom.group.visible, false);
  assert.equal(f.app.hotspots.enabled, false);
  assert.equal(f.app.componentInteractions.active, f.app.exhibits.get(mvr.viewerId));
  assert.equal(f.app.modeMenu.buttons.get('return-zone').hidden, false);
});
test('return-zone restores exact camera, scene and hotspot identities without SHOWROOM', () => {
  const f = fixture(); open(f);
  const visited = []; const originalSet = f.app.viewMode.set.bind(f.app.viewMode);
  f.app.viewMode.set = (mode) => { visited.push(mode); originalSet(mode); };
  f.app.modeMenu.buttons.get('return-zone').click();
  assert.equal(f.app.showroom.group.visible, false);
  assert.equal(f.app.zoneViewer.panel.classList.contains('is-visible'), false);
  assert.equal(f.app.hotspots.enabled, false);
  f.app.exhibitViewer.update(0.85);
  assert.deepEqual(visited, [ViewMode.ZONE]);
  assert.deepEqual(f.app.camera.captureState(), f.zone);
  assert.equal(f.app.zoneViewer.group, f.scene);
  assert.equal(f.app.zoneViewer.exhibitShowcase.targets[0], f.target);
  assert.equal(f.app.zoneViewer.panel.classList.contains('is-visible'), true);
  assert.equal(f.app.infoPanel.mode, ViewMode.ZONE);
  assert.equal(f.app.camera.enabled, false);
  assert.equal(f.app.zoneViewer.exhibitShowcase.raycastManager.options.getTargets().length, 3);
});
for (const mode of [ViewMode.EXPLODED, ViewMode.PROCESS, ViewMode.TECHNOLOGY]) {
  test(`return from ${mode} calls existing cleanup then restores the zone`, () => {
    const f = fixture(); open(f); f.app.viewMode.set(mode); clickReturn(f);
    assert.equal(f.app.viewMode.mode, ViewMode.ZONE);
    assert.equal(f.app.processController.cleanups, 1);
    assert.equal(f.app.technologyController.cleanups, 1);
    assert.equal(f.app.explosionController.cleanups, 1);
    assert.equal(f.app.resourceManager.cleanups, 1);
    assert.equal(f.app.componentInteractions.active, false);
    assert.equal(f.app.exhibitShowcase.visible, false);
    assert.equal(f.app.exhibits.get(mvr.viewerId).object.visible, false);
  });
}
test('separate main-hall button still returns to the saved main-hall view', () => {
  const f = fixture(); open(f); clickReturn(f, 'return');
  assert.equal(f.app.viewMode.mode, ViewMode.SHOWROOM);
  assert.deepEqual(f.app.camera.captureState(), f.hall);
  assert.equal(f.app.showroom.group.visible, true);
  assert.equal(f.app.hotspots.enabled, true);
  assert.equal(f.app.zoneViewer.exhibitReturnContext, null);
  assert.equal(f.app.zoneViewer.group.visible, false);
});
test('zone return can repeat and the zone return-to-hall button still works', () => {
  const f = fixture();
  for (let i = 0; i < 3; i++) { open(f); clickReturn(f); assert.deepEqual(f.app.camera.captureState(), f.zone); }
  f.app.zoneViewer.returnButton.click(); f.app.zoneViewer.update(1.4);
  assert.equal(f.app.viewMode.mode, ViewMode.SHOWROOM);
  assert.deepEqual(f.app.camera.captureState(), f.hall);
});
test('origin is not hardcoded to ZONE_01; title and state follow the entered zone', () => {
  const f = fixture('ZONE_04', '大气环境治理'); open(f);
  assert.equal(f.app.zoneViewer.exhibitReturnContext.zoneId, 'ZONE_04');
  assert.match(f.app.modeMenu.buttons.get('return-zone').title, /大气环境治理/);
  clickReturn(f); assert.equal(f.app.zoneViewer.currentDefinition.id, 'ZONE_04');
  assert.deepEqual(f.app.camera.captureState(), f.zone);
});
test('rejects return during entry and repeated return during exit', () => {
  const f = fixture(); f.app.zoneViewer.handleExhibitClick(mvr);
  f.app.modeMenu.buttons.get('return-zone').click();
  assert.equal(f.app.processController.cleanups, 0);
  f.app.exhibitViewer.update(0.85);
  f.app.modeMenu.buttons.get('return-zone').click();
  f.app.modeMenu.buttons.get('return').click();
  assert.equal(f.app.processController.cleanups, 1);
  f.app.exhibitViewer.update(0.85);
  assert.equal(f.app.viewMode.mode, ViewMode.ZONE);
});
test('unregistered and coming exhibits preserve zone and do not create return context', () => {
  for (const entry of [{ ...mvr, viewerId: 'missing' }, entries[1]]) {
    const f = fixture(); f.app.zoneViewer.handleExhibitClick(entry);
    assert.equal(f.app.viewMode.mode, ViewMode.ZONE);
    assert.deepEqual(f.app.camera.captureState(), f.zone);
    assert.equal(f.app.zoneViewer.group.visible, true);
    assert.equal(f.app.zoneViewer.exhibitReturnContext, null);
    assert.equal(f.app.zoneViewer.statusMessage.classList.contains('is-visible'), true);
  }
});
test('without an origin, zone button is hidden; visible menu numbering stays contiguous', () => {
  const menu = new ExhibitModeMenu(new Element(), () => assert.fail('hidden button must not route'));
  assert.equal(menu.buttons.get('return-zone').hidden, true);
  assert.equal(menu.buttons.get('return-zone').style.display, 'none');
  assert.equal(menu.buttons.get('return').querySelector('span').textContent, '04');
  menu.buttons.get('return-zone').click();
  menu.setReturnZone('水环境治理');
  assert.equal(menu.buttons.get('return').querySelector('span').textContent, '05');
});
test('return cancels pointer capture before navigating', () => {
  const f = fixture(); open(f);
  f.app.exhibitViewer.pointerId = 7;
  f.app.renderer.renderer.domElement.setPointerCapture(7);
  clickReturn(f);
  assert.equal(f.app.renderer.renderer.domElement.hasPointerCapture(7), false);
});

function showcaseFixture(data = entries) {
  let enabled = true;
  const canvas = new Element(); const camera = new Group(); const selected = [];
  const showcase = new ZoneExhibitShowcase({ camera, canvas, isInteractive: () => enabled, onSelect: (entry) => selected.push(entry) });
  showcase.setEntries(data);
  return { showcase, canvas, camera, selected, setEnabled(value) { enabled = value; }, picker: showcase.raycastManager.options };
}
const previews = (showcase) => showcase.group.children.map((group) => group.children[1]);
const labels = (showcase) => showcase.group.children.map((group) => group.children[3].material.map.image.context);

test('reordering data keeps each preview shape and availability attached to its own entry', () => {
  const f = showcaseFixture([entries[2], entries[1], entries[0]]);
  assert.deepEqual(previews(f.showcase).map((display) => display.name), [
    'Showcase preview: monitoring', 'Showcase preview: membrane', 'Showcase preview: mvr',
  ]);
  assert.deepEqual(previews(f.showcase).map((display) => display.children.length), [3, 4, 3]);
  assert.equal(labels(f.showcase)[0].texts[1].color, '#9bdae2');
  assert.equal(labels(f.showcase)[2].texts[1].color, '#effeff');
  f.picker.onClick(f.showcase.targets[2]);
  assert.equal(f.selected[0], mvr);
});
test('all configured placements, labels and target metadata survive extraction', () => {
  const f = showcaseFixture();
  entries.forEach((entry, index) => {
    assert.deepEqual(f.showcase.group.children[index].position, new Vector3(...entry.previewPosition));
    assert.equal(f.showcase.targets[index].userData.exhibit, entry);
    assert.equal(labels(f.showcase)[index].texts[1].text, entry.previewLabel);
  });
});
test('30 synthetic entries use one picker and keep ordinal 10/30 rather than 010/030', () => {
  const data = Array.from({ length: 30 }, (_, index) => ({ ...entries[1], id: `TEST_ONLY_${index}`, previewPosition: [index * 5, 0, -40] }));
  const before = RaycastDouble.created;
  const f = showcaseFixture(data);
  assert.equal(RaycastDouble.created - before, 1);
  assert.equal(f.showcase.targets.length, 30);
  assert.equal(f.showcase.group.children.length, 30);
  assert.equal(labels(f.showcase)[9].texts[0].text, '展项 10');
  assert.equal(labels(f.showcase)[29].texts[0].text, '展项 30');
  assert.equal(entries.length, 3, 'Synthetic data is not published into the real water zone');
});
test('missing and unknown preview kinds use a generic placeholder without breaking selection', () => {
  for (const kind of [undefined, 'unrecognized-runtime-value']) {
    const entry = { ...entries[1], showcaseKind: kind };
    const f = showcaseFixture([entry]);
    assert.equal(previews(f.showcase)[0].children.length, 1);
    assert.equal(previews(f.showcase)[0].children[0].geometry.type, 'BoxGeometry');
    f.picker.onClick(f.showcase.targets[0]); assert.equal(f.selected[0], entry);
  }
});
test('coming entries use the same selection callback and the existing zone status message', () => {
  const f = fixture();
  const showcase = f.app.zoneViewer.exhibitShowcase;
  showcase.raycastManager.options.onClick(showcase.targets[1]);
  assert.equal(f.app.viewMode.mode, ViewMode.ZONE);
  assert.match(f.app.zoneViewer.statusMessage.textContent, /即将开放/);
});
test('inactive, hidden, stale and unknown targets cannot dispatch selection', () => {
  const f = showcaseFixture(); const target = f.showcase.targets[0];
  f.setEnabled(false); f.picker.onClick(target); assert.equal(f.picker.getTargets().length, 0);
  f.setEnabled(true); f.showcase.group.visible = false; f.picker.onClick(target);
  f.showcase.group.visible = true; f.picker.onClick(new Group());
  f.showcase.setEntries([entries[2]]); f.picker.onClick(target);
  assert.equal(f.selected.length, 0);
});
test('hover and animation persist; disabling clears the cursor and highlight', () => {
  const f = showcaseFixture(); const target = f.showcase.targets[0]; const hotspot = target.parent;
  f.picker.onHover(target); f.showcase.update(0.1);
  assert.equal(f.canvas.classList.contains('is-zone-exhibit-hovered'), true);
  assert.ok(hotspot.scale.x > 1.2);
  assert.equal(hotspot.quaternion.copied, f.camera.quaternion);
  assert.ok(previews(f.showcase)[0].rotation.y > 0);
  f.setEnabled(false); f.showcase.update(0.1);
  assert.equal(f.canvas.classList.contains('is-zone-exhibit-hovered'), false);
  assert.ok(hotspot.scale.x < 1.1);
});
test('replacing entries disposes each old geometry/material/texture exactly once', () => {
  const start = resources.length; const f = showcaseFixture(); const oldResources = resources.slice(start);
  const oldTargets = f.showcase.targets; const before = RaycastDouble.created;
  f.showcase.setEntries([entries[2]]);
  assert.ok(oldResources.every((item) => item.disposeCalls === 1));
  assert.equal(RaycastDouble.created, before, 'No extra listener group on rebuild');
  assert.equal(f.showcase.targets.length, 1);
  assert.ok(f.showcase.targets.every((target) => !oldTargets.includes(target)));
});
test('empty data releases displays and targets and can later be populated again', () => {
  const f = showcaseFixture(); f.showcase.setEntries([]);
  assert.equal(f.showcase.targets.length, 0); assert.equal(f.showcase.group.children.length, 0);
  f.showcase.setEntries(entries); assert.equal(f.showcase.targets.length, 3);
});
test('duplicate IDs fail before disturbing the previous display set', () => {
  const f = showcaseFixture(); const oldTargets = f.showcase.targets; const before = resources.length;
  assert.throws(() => f.showcase.setEntries([mvr, mvr]), /Duplicate zone exhibit/);
  assert.deepEqual(f.showcase.targets, oldTargets); assert.equal(resources.length, before);
});
test('failed label creation cleans the partial replacement and preserves the old set', () => {
  const f = showcaseFixture(); const oldTargets = f.showcase.targets; const start = resources.length;
  failCanvasAfter = 1;
  try { assert.throws(() => f.showcase.setEntries(entries), /label canvas is unavailable/); }
  finally { failCanvasAfter = Infinity; }
  assert.deepEqual(f.showcase.targets, oldTargets);
  assert.ok(resources.slice(start).every((item) => item.disposeCalls === 1));
});
test('dispose is idempotent and removes the picker, owned resources, targets and group', () => {
  const external = new Resource(); const start = resources.length; const f = showcaseFixture();
  const owned = resources.slice(start); const parent = new Group(); parent.add(f.showcase.group);
  const oldTarget = f.showcase.targets[0]; f.picker.onHover(oldTarget);
  f.showcase.dispose(); f.showcase.dispose(); f.picker.onClick(oldTarget);
  assert.equal(f.showcase.raycastManager.disposeCalls, 1);
  assert.ok(owned.every((item) => item.disposeCalls === 1));
  assert.equal(external.disposeCalls, 0, 'Unowned resources remain untouched');
  assert.equal(parent.children.length, 0); assert.equal(f.showcase.targets.length, 0);
  assert.equal(f.canvas.classList.contains('is-zone-exhibit-hovered'), false);
  assert.equal(f.selected.length, 0);
  assert.throws(() => f.showcase.setEntries(entries), /disposed/);
});
test('suspend/resume keeps identical display resources and disables picking until the return finishes', () => {
  const f = fixture(); const showcase = f.app.zoneViewer.exhibitShowcase;
  const targets = showcase.targets; const stands = [...showcase.group.children]; const before = resources.length;
  open(f); assert.equal(showcase.raycastManager.options.getTargets().length, 0);
  f.app.modeMenu.buttons.get('return-zone').click();
  assert.equal(showcase.raycastManager.options.getTargets().length, 0);
  f.app.exhibitViewer.update(0.85);
  assert.deepEqual(showcase.targets, targets); assert.deepEqual(showcase.group.children, stands);
  assert.equal(resources.length, before); assert.equal(showcase.raycastManager.options.getTargets().length, 3);
});
