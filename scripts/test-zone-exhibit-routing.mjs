// Exercises the real application, ZoneViewer, ExhibitViewer and menu methods.
// DOM, Three.js rendering, camera controls and frozen feature controllers are
// isolated doubles: these checks are NOT a WebGL/browser acceptance test.
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
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { return this.set(v.x, v.y, v.z); }
  add(v) { return this.set(this.x + v.x, this.y + v.y, this.z + v.z); }
  addScaledVector(v, k) { return this.add(v.clone().set(v.x * k, v.y * k, v.z * k)); }
  normalize() { const d = Math.hypot(this.x, this.y, this.z) || 1; return this.set(this.x / d, this.y / d, this.z / d); }
  lerp(v, k) { return this.set(this.x + (v.x - this.x) * k, this.y + (v.y - this.y) * k, this.z + (v.z - this.z) * k); }
}
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
    this.rotation = new Vector3(); this.quaternion = { copy() {} }; this.userData = {};
  }
  add(...children) { this.children.push(...children); }
  clear() { this.children = []; }
}
const three = {
  Vector3, Vector2: Vector3, Group, Scene: Group,
  Box3: class { setFromObject() { return this; } getSize(v) { return v.set(8, 6, 4); } },
  MathUtils: { clamp: (v, min, max) => Math.max(min, Math.min(v, max)) },
  Clock: class {}, Color: class {}, Fog: class {},
};
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
// Use an intentionally arbitrary metadata ID: config must reference the provided
// definition rather than quietly reintroducing a hardcoded "mvr" alias.
const metadata = { id: 'canonical-mvr-test-definition', components: [] };
const definitionModule = { mvrWastewaterTreatmentDefinition: metadata };
const { zone01Exhibits: entries } = load('src/zones/data/zoneExhibits.ts', {
  '../../exhibits/data/mvrWastewaterTreatment': definitionModule,
});
const mvr = entries[0];
const { ExhibitViewer } = load('src/exhibits/ExhibitViewer.ts', { three, '../core/ViewMode': modes });
const { ExhibitModeMenu } = load('src/exhibits/navigation/ExhibitModeMenu.ts');
const { ZoneViewer } = load('src/zones/ZoneViewer.ts', {
  three, '../core/ViewMode': modes,
  '../interaction/RaycastManager': { RaycastManager: class { constructor(options) { this.options = options; } } },
});
// Omit environmental meshes only, never replace navigation or click methods.
ZoneViewer.prototype.createWaterEnvironment = () => new Group();
ZoneViewer.prototype.renderExhibitSpace = function () { this.exhibitTargets.push({}); };
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
  // Future-zone fixture tests origin routing without pretending its geometry exists.
  app.zoneViewer.currentDefinition = { ...definition, id: zoneId };
  const zone = cameraState(6, -36);
  app.camera.applyState(zone);
  return { app, hall, zone, scene: app.zoneViewer.group, target: app.zoneViewer.exhibitTargets[0] };
}
function open(f) {
  f.app.zoneViewer.handleExhibitClick(mvr);
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
  f.app.zoneViewer.handleExhibitClick(mvr);
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
  assert.equal(f.app.zoneViewer.exhibitTargets[0], f.target);
  assert.equal(f.app.zoneViewer.panel.classList.contains('is-visible'), true);
  assert.equal(f.app.infoPanel.mode, ViewMode.ZONE);
  assert.equal(f.app.camera.enabled, false);
  assert.equal(f.app.zoneViewer.raycastManager.options.getTargets().length, 1);
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
