import {
  AdditiveBlending, BoxGeometry, BufferGeometry, CanvasTexture, Color, CylinderGeometry,
  DoubleSide, Float32BufferAttribute, Group, Material, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, PointLight, Points,
  PointsMaterial, RingGeometry, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector3,
} from 'three';
import type { CameraController, CameraState } from '../core/CameraController';
import { RaycastManager } from '../interaction/RaycastManager';
import { ViewMode, type ViewModeState } from '../core/ViewMode';
import type { ZoneDefinition } from './ZoneDefinition';
import type { ExhibitEntry } from './data/zoneExhibits';

const ENTRY_DURATION = 0.78;
const SETTLE_DURATION = 0.62;
interface Transition { readonly from: CameraState; readonly to: CameraState; readonly duration: number; elapsed: number; readonly complete?: () => void }
interface ExhibitHotspot {
  readonly root: Group;
  readonly core: Mesh<SphereGeometry, MeshStandardMaterial>;
  readonly rings: readonly Mesh<RingGeometry, MeshBasicMaterial>[];
  readonly available: boolean;
  readonly phase: number;
  hovered: boolean;
}

export interface ZoneExhibitReturnContext {
  readonly zoneId: ZoneDefinition['id'];
  readonly title: string;
  readonly cameraState: CameraState;
  readonly showroomCameraState: CameraState;
}

/** Owns the independent zone environment and its two-stage entrance transition. */
export class ZoneViewer {
  public readonly group = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: CanvasTexture[] = [];
  private readonly circulationRings: Group[] = [];
  private readonly exhibitDisplays: Group[] = [];
  private readonly exhibitHotspots: ExhibitHotspot[] = [];
  private readonly exhibitSpace = new Group();
  private readonly waterParticles: Points;
  private readonly panel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly description: HTMLElement;
  private readonly returnButton: HTMLButtonElement;
  private readonly statusMessage: HTMLElement;
  private readonly raycastManager: RaycastManager;
  private readonly exhibitTargets: Mesh[] = [];
  private transition: Transition | null = null;
  private showroomState: CameraState | null = null;
  private currentDefinition: ZoneDefinition | null = null;
  private suspendedContext: ZoneExhibitReturnContext | null = null;
  private elapsed = 0;
  private statusMessageTimer: number | null = null;

  public constructor(
    container: HTMLElement,
    private readonly camera: CameraController,
    private readonly canvas: HTMLCanvasElement,
    private readonly viewMode: ViewModeState,
    private readonly onVisibilityChange: (zoneActive: boolean) => void,
    private readonly onReturn: () => void,
    private readonly prepareExhibit: (viewerId: string, position: Vector3) => (() => boolean) | null,
  ) {
    this.group.name = 'ZONE_01 water intelligence center';
    this.group.visible = false;
    this.panel = document.createElement('section');
    this.panel.className = 'zone-viewer-panel';
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.innerHTML = `<p class="zone-viewer-kicker">ZONE_01 · WATER INTELLIGENCE CENTER</p><h1></h1><p class="zone-viewer-subtitle"></p><p class="zone-viewer-description"></p><div class="zone-live-status"><span>水质监测在线</span><span>循环系统稳定</span></div><p class="zone-explore-hint">探索空间中的展项热点</p><div class="zone-exhibit-status" role="status" aria-live="polite"></div><button class="zone-return" type="button">← 返回主展厅</button>`;
    container.append(this.panel);
    this.title = this.required('h1');
    this.subtitle = this.required('.zone-viewer-subtitle');
    this.description = this.required('.zone-viewer-description');
    this.statusMessage = this.required('.zone-exhibit-status');
    const button = this.panel.querySelector<HTMLButtonElement>('button');
    if (!button) throw new Error('Zone return button was not created.');
    this.returnButton = button;
    this.returnButton.addEventListener('click', this.exit);
    this.waterParticles = this.createWaterEnvironment();
    this.raycastManager = new RaycastManager({
      camera: this.camera.camera,
      canvas: this.canvas,
      getTargets: () => this.viewMode.mode === ViewMode.ZONE && !this.transition && !this.suspendedContext ? this.exhibitTargets : [],
      onHover: (target) => {
        const hotspot = target?.userData.hotspot as ExhibitHotspot | undefined;
        this.exhibitHotspots.forEach((candidate) => {
          if (candidate === hotspot) this.onPointerOver(candidate);
          else this.onPointerOut(candidate);
        });
        this.canvas.classList.toggle('is-zone-exhibit-hovered', target !== null);
      },
      onClick: (target) => {
        const exhibit = target.userData.exhibit as ExhibitEntry | undefined;
        if (exhibit) this.handleExhibitClick(exhibit);
      },
    });
  }

  public enter(definition: ZoneDefinition, hotspotPosition: Vector3): boolean {
    if (definition.id !== 'ZONE_01' || this.viewMode.mode !== ViewMode.SHOWROOM) return false;
    this.currentDefinition = definition;
    this.suspendedContext = null;
    this.showroomState = this.camera.captureState();
    this.viewMode.set(ViewMode.ZONE);
    this.camera.setNavigationEnabled(false);
    this.group.visible = true;
    this.onVisibilityChange(true);
    this.title.textContent = definition.title;
    this.subtitle.textContent = definition.englishTitle;
    this.description.textContent = definition.description;
    console.info('[ZoneViewer] zone exhibit data', {
      zoneId: definition.id,
      zoneName: definition.title,
      exhibitCount: definition.exhibits.length,
      exhibits: definition.exhibits,
    });
    this.renderExhibitSpace(definition);
    this.panel.classList.add('is-visible');
    this.panel.setAttribute('aria-hidden', 'false');

    const target = new Vector3(...definition.cameraTarget);
    const threshold = hotspotPosition.clone().add(new Vector3(...definition.entryPosition));
    const direction = new Vector3(...definition.entryDirection).normalize();
    const viewingState = { position: threshold.clone().addScaledVector(direction, 3), target };
    // Cross the architectural threshold first, then make a short lateral settle
    // into the authored viewing composition instead of flying at the rear wall.
    this.begin({ position: threshold, target: threshold.clone().add(direction) }, ENTRY_DURATION, () => {
      this.begin(viewingState, SETTLE_DURATION);
    });
    return true;
  }

  public readonly exit = (): void => {
    if (this.viewMode.mode !== ViewMode.ZONE || !this.showroomState || this.transition) return;
    this.onVisibilityChange(false);
    this.panel.classList.remove('is-visible');
    this.panel.setAttribute('aria-hidden', 'true');
    this.begin(this.showroomState, ENTRY_DURATION + SETTLE_DURATION, () => {
      this.group.visible = false;
      this.showroomState = null;
      this.currentDefinition = null;
      this.suspendedContext = null;
      this.viewMode.set(ViewMode.SHOWROOM);
      this.camera.setNavigationEnabled(true);
      this.onReturn();
    });
  };

  public get exhibitReturnContext(): ZoneExhibitReturnContext | null {
    return this.suspendedContext;
  }

  /** Reveal only the environment during the viewer-owned return animation. */
  public showReturnEnvironment(): void {
    if (this.suspendedContext) this.group.visible = true;
  }

  /** Resume the same scene; do not re-enter the zone or replay its entrance flight. */
  public resumeFromExhibit(): void {
    if (!this.suspendedContext || this.viewMode.mode !== ViewMode.ZONE) return;
    this.suspendedContext = null;
    this.group.visible = true;
    this.panel.classList.add('is-visible');
    this.panel.setAttribute('aria-hidden', 'false');
    this.camera.setNavigationEnabled(false);
    this.onVisibilityChange(true);
  }

  public discardExhibitReturn(): void {
    this.suspendedContext = null;
    this.currentDefinition = null;
    this.showroomState = null;
    this.group.visible = false;
    this.panel.classList.remove('is-visible');
    this.panel.setAttribute('aria-hidden', 'true');
  }

  public update(delta: number): void {
    if (this.group.visible) {
      this.elapsed += delta;
      this.circulationRings.forEach((ring, index) => {
        ring.rotation.z += delta * (index % 2 === 0 ? 0.16 : -0.11);
        ring.position.y = 3.1 + Math.sin(this.elapsed * 0.7 + index) * 0.12;
      });
      this.exhibitDisplays.forEach((display, index) => {
        display.rotation.y += delta * (0.08 + index * 0.015);
      });
      this.exhibitHotspots.forEach((hotspot) => {
        const pulse = (Math.sin(this.elapsed * 2.8 + hotspot.phase) + 1) * 0.5;
        const hoverScale = hotspot.hovered ? 1.34 : 1;
        hotspot.root.scale.setScalar(hoverScale * (0.94 + pulse * 0.1));
        hotspot.root.quaternion.copy(this.camera.camera.quaternion);
        hotspot.rings[0].rotation.z += delta * 0.75;
        hotspot.rings[1].rotation.z -= delta * 0.48;
        hotspot.rings.forEach((ring, index) => {
          ring.material.opacity = (hotspot.hovered ? 0.96 : 0.48) + pulse * (index === 0 ? 0.18 : 0.1);
        });
        hotspot.core.material.emissiveIntensity = (hotspot.hovered ? 3.2 : 1.65) + pulse * 0.75;
      });
      this.waterParticles.rotation.y += delta * 0.055;
      this.waterParticles.position.y = Math.sin(this.elapsed * 0.55) * 0.08;
    }
    if (!this.transition) return;
    this.transition.elapsed = Math.min(this.transition.duration, this.transition.elapsed + delta);
    const p = this.transition.elapsed / this.transition.duration;
    const eased = p * p * (3 - 2 * p);
    this.camera.applyState({ position: this.transition.from.position.clone().lerp(this.transition.to.position, eased), target: this.transition.from.target.clone().lerp(this.transition.to.target, eased) });
    if (p === 1) { const done = this.transition.complete; this.transition = null; done?.(); }
  }

  public dispose(): void {
    this.returnButton.removeEventListener('click', this.exit);
    this.raycastManager.dispose();
    this.canvas.classList.remove('is-zone-exhibit-hovered');
    if (this.statusMessageTimer !== null) window.clearTimeout(this.statusMessageTimer);
    this.panel.remove();
    this.geometries.forEach((item) => item.dispose());
    this.materials.forEach((item) => item.dispose());
    this.textures.forEach((item) => item.dispose());
  }

  private begin(to: CameraState, duration: number, complete?: () => void): void {
    this.transition = { from: this.camera.captureState(), to, duration, elapsed: 0, complete };
  }
  private required(selector: string): HTMLElement { const element = this.panel.querySelector<HTMLElement>(selector); if (!element) throw new Error(`Missing zone UI: ${selector}`); return element; }
  private geometry<T extends BufferGeometry>(item: T): T { this.geometries.push(item); return item; }
  private material<T extends Material>(item: T): T { this.materials.push(item); return item; }

  private createWaterEnvironment(): Points {
    const origin = new Vector3(0, 0, -42);
    const floor = new Mesh(this.geometry(new PlaneGeometry(32, 27)), this.material(new MeshPhysicalMaterial({ color: '#0d5870', emissive: '#06384a', emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.16 })));
    floor.rotation.x = -Math.PI / 2; floor.position.copy(origin); this.group.add(floor);

    const glass = this.material(new MeshPhysicalMaterial({ color: '#61e9ff', emissive: '#0b7695', emissiveIntensity: 0.35, transparent: true, opacity: 0.24, roughness: 0.08, metalness: 0.05, transmission: 0.45, depthWrite: false, side: DoubleSide }));
    const frame = this.material(new MeshStandardMaterial({ color: '#b9f7ff', emissive: '#28cce6', emissiveIntensity: 0.65, metalness: 0.7, roughness: 0.24 }));
    for (const x of [-13, 13]) {
      const wall = new Mesh(this.geometry(new PlaneGeometry(25, 8)), glass); wall.rotation.y = Math.PI / 2; wall.position.set(x, 4, -42); this.group.add(wall);
      for (const z of [-52, -46, -40, -34]) {
        const rib = new Mesh(this.geometry(new BoxGeometry(0.16, 8, 0.16)), frame); rib.position.set(x * 0.995, 4, z); this.group.add(rib);
      }
    }
    const back = new Mesh(this.geometry(new PlaneGeometry(26, 8)), glass); back.position.set(0, 4, -53); this.group.add(back);

    // Luminous circulation channels lead the eye from the entrance into the center.
    for (const radius of [3.1, 6.2, 9.5, 12.6]) {
      const ring = new Mesh(this.geometry(new RingGeometry(radius - 0.045, radius + 0.045, 96)), this.material(new MeshBasicMaterial({ color: '#80f2ff', transparent: true, opacity: 0.55, side: DoubleSide })));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(origin).add(new Vector3(0, 0.035, 0)); this.group.add(ring);
    }
    for (const x of [-7, 0, 7]) {
      const flow = new Group(); flow.position.set(x, 3.1, -47);
      const torus = new Mesh(this.geometry(new TorusGeometry(2.1, 0.055, 8, 72)), this.material(new MeshBasicMaterial({ color: '#72edff', transparent: true, opacity: 0.7 })));
      const inner = new Mesh(this.geometry(new TorusGeometry(1.55, 0.025, 6, 64)), this.material(new MeshBasicMaterial({ color: '#b8f8ff', transparent: true, opacity: 0.4 })));
      flow.add(torus, inner); this.circulationRings.push(flow); this.group.add(flow);
    }

    this.createMonitoringWall(new Vector3(8.8, 4.3, -48.5), -0.2);
    this.createMonitoringWall(new Vector3(-8.8, 4.3, -48.5), 0.2);
    this.group.add(this.exhibitSpace);

    const positions: number[] = [];
    for (let i = 0; i < 620; i += 1) {
      const angle = i * 2.399; const radius = 2 + (i % 100) * 0.115;
      positions.push(Math.cos(angle) * radius, 0.18 + (i % 23) * 0.25, -42 + Math.sin(angle) * radius);
    }
    const particlesGeometry = this.geometry(new BufferGeometry()); particlesGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const particles = new Points(particlesGeometry, this.material(new PointsMaterial({ color: new Color('#a4f7ff'), size: 0.055, transparent: true, opacity: 0.72, blending: AdditiveBlending, depthWrite: false })));
    this.group.add(particles, new PointLight('#77eaff', 52, 28, 1.4), new PointLight('#b5f7ff', 34, 18, 1.5));
    this.group.children.at(-2)?.position.set(-7, 6, -39);
    this.group.children.at(-1)?.position.set(8, 5, -47);
    return particles;
  }

  private createMonitoringWall(position: Vector3, rotationY: number): void {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 320;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Water monitoring canvas is unavailable.');
    const gradient = context.createLinearGradient(0, 0, 640, 320); gradient.addColorStop(0, 'rgba(7,55,76,.94)'); gradient.addColorStop(1, 'rgba(18,116,140,.76)');
    context.fillStyle = gradient; context.fillRect(0, 0, 640, 320);
    context.strokeStyle = 'rgba(129,239,255,.2)'; context.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 320); context.stroke(); }
    for (let y = 0; y < 320; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(640, y); context.stroke(); }
    context.fillStyle = '#aef7ff'; context.font = '600 22px sans-serif'; context.fillText('WATER QUALITY · LIVE', 34, 48);
    context.font = '500 50px sans-serif'; context.fillText('Ⅱ', 35, 125);
    context.font = '16px sans-serif'; context.fillStyle = '#69eafa'; context.fillText('COD  18.2 mg/L', 120, 92); context.fillText('NH₃-N  0.42 mg/L', 120, 122);
    context.strokeStyle = '#75eeff'; context.lineWidth = 4; context.beginPath(); context.moveTo(35, 250);
    for (let x = 35; x < 610; x += 18) context.lineTo(x, 225 + Math.sin(x * 0.045) * 22 + Math.sin(x * 0.012) * 10);
    context.stroke();
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this.textures.push(texture);
    const display = new Mesh(this.geometry(new PlaneGeometry(6.2, 3.1)), this.material(new MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9 })));
    display.position.copy(position); display.rotation.y = rotationY; this.group.add(display);
    const base = new Mesh(this.geometry(new CylinderGeometry(0.9, 1.25, 0.22, 32)), this.material(new MeshPhysicalMaterial({ color: '#1bb3cf', transparent: true, opacity: 0.42, transmission: 0.35 })));
    base.position.set(position.x, 0.12, position.z + 1); this.group.add(base);
  }

  /** Builds lightweight physical displays; full exhibit models stay exclusively in ExhibitViewer. */
  private renderExhibitSpace(definition: ZoneDefinition): void {
    this.exhibitSpace.clear();
    this.exhibitDisplays.length = 0;
    this.exhibitHotspots.length = 0;
    this.exhibitTargets.length = 0;
    definition.exhibits.forEach((exhibit, index) => {
      const marker = new Group(); marker.name = `Exhibit showcase ${index + 1}`;
      marker.position.set(...exhibit.previewPosition);
      const available = exhibit.status === 'available' && exhibit.viewerId !== null;
      const plinth = new Mesh(this.geometry(new CylinderGeometry(1.6, 1.85, 0.42, 48)), this.material(new MeshPhysicalMaterial({ color: available ? '#176b7b' : '#124754', emissive: available ? '#0a7890' : '#073d49', emissiveIntensity: 0.42, metalness: 0.65, roughness: 0.28, clearcoat: 0.7 })));
      plinth.position.y = 0.21;
      const display = this.createPhysicalPlaceholder(index, available);
      display.position.y = 0.42;
      this.exhibitDisplays.push(display);
      const hotspot = this.createExhibitHotspot(exhibit, index, available);
      marker.add(plinth, display, hotspot.root, this.createExhibitLabel(
        exhibit.previewLabel,
        available ? '点击热点进入展项' : '展项预留',
        index,
      ));
      this.exhibitSpace.add(marker);
    });
  }

  private createExhibitHotspot(exhibit: ExhibitEntry, index: number, available: boolean): ExhibitHotspot {
    const root = new Group();
    root.name = `Exhibit hotspot: ${exhibit.id}`;
    root.position.set(0, 3.15, 0.35);
    const color = available ? '#9af7ff' : '#4fabb8';
    const core = new Mesh(
      this.geometry(new SphereGeometry(0.2, 20, 14)),
      this.material(new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.65, roughness: 0.15, metalness: 0.25 })),
    );
    const rings = [0.42, 0.62].map((radius) => new Mesh(
      this.geometry(new RingGeometry(radius - 0.025, radius + 0.025, 48)),
      this.material(new MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false, blending: AdditiveBlending })),
    ));
    rings[1].rotation.z = Math.PI / 4;

    // A generous, invisible sphere makes both the bright core and scan rings easy
    // to acquire without making the visible hotspot oversized.
    const target = new Mesh(
      this.geometry(new SphereGeometry(0.72, 12, 8)),
      this.material(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })),
    );
    const hotspot: ExhibitHotspot = { root, core, rings, available, phase: index * 1.7, hovered: false };
    target.userData.exhibit = exhibit;
    target.userData.hotspot = hotspot;
    root.add(...rings, core, target);
    this.exhibitHotspots.push(hotspot);
    this.exhibitTargets.push(target);
    return hotspot;
  }

  private onPointerOver(hotspot: ExhibitHotspot): void {
    if (hotspot.hovered) return;
    hotspot.hovered = true;
  }

  private onPointerOut(hotspot: ExhibitHotspot): void {
    if (!hotspot.hovered) return;
    hotspot.hovered = false;
  }

  private createPhysicalPlaceholder(index: number, available: boolean): Group {
    const display = new Group();
    const material = this.material(new MeshStandardMaterial({ color: available ? '#a9e7e9' : '#5f8f96', emissive: available ? '#176f79' : '#163e45', emissiveIntensity: 0.32, metalness: 0.72, roughness: 0.3, transparent: !available, opacity: available ? 1 : 0.58 }));
    if (index === 0) {
      const body = new Mesh(this.geometry(new CylinderGeometry(0.62, 0.78, 1.65, 24)), material); body.position.y = 1.05;
      const chamber = new Mesh(this.geometry(new CylinderGeometry(0.38, 0.48, 1.95, 20)), material); chamber.position.set(0.85, 1.18, 0.12);
      const bridge = new Mesh(this.geometry(new BoxGeometry(0.95, 0.22, 0.28)), material); bridge.position.set(0.42, 1.55, 0.05);
      display.add(body, chamber, bridge);
    } else if (index === 1) {
      for (const x of [-0.68, 0, 0.68]) {
        const membrane = new Mesh(this.geometry(new CylinderGeometry(0.18, 0.18, 1.65, 16)), material); membrane.position.set(x, 1.18, 0); display.add(membrane);
      }
      const header = new Mesh(this.geometry(new BoxGeometry(1.75, 0.18, 0.34)), material); header.position.set(0, 1.95, 0); display.add(header);
    } else {
      const consoleBody = new Mesh(this.geometry(new BoxGeometry(1.65, 1.15, 0.52)), material); consoleBody.position.y = 1.05; consoleBody.rotation.x = -0.12;
      const sensor = new Mesh(this.geometry(new CylinderGeometry(0.08, 0.08, 1.15, 12)), material); sensor.position.set(0.72, 2, 0);
      const sensorHead = new Mesh(this.geometry(new OctahedronGeometry(0.25, 0)), material); sensorHead.position.set(0.72, 2.58, 0); display.add(consoleBody, sensor, sensorHead);
    }
    return display;
  }

  private handleExhibitClick(exhibit: ExhibitEntry): void {
    if (this.viewMode.mode !== ViewMode.ZONE || this.transition || this.suspendedContext) return;
    if (exhibit.status === 'coming' || !exhibit.viewerId) {
      this.showStatusMessage(`${exhibit.previewLabel} · 即将开放`);
      return;
    }
    // Resolve the registered exhibit before changing any camera, visibility or
    // navigation state. A stale viewerId must leave the visitor inside the zone.
    const openExhibit = this.prepareExhibit(exhibit.viewerId, new Vector3(...exhibit.previewPosition));
    if (!openExhibit) {
      this.showStatusMessage(`${exhibit.previewLabel} · 展品尚未接入，请稍后重试`);
      return;
    }
    console.info('[ZoneViewer] exhibit hotspot clicked', { id: exhibit.id, viewerId: exhibit.viewerId });

    if (!this.currentDefinition || !this.showroomState) return;
    this.suspendedContext = {
      zoneId: this.currentDefinition.id,
      title: this.currentDefinition.title,
      cameraState: this.camera.captureState(),
      showroomCameraState: this.showroomState,
    };
    // Keep both return views and the existing scene. Never reset to the main hall
    // merely to open a zone exhibit; ExhibitViewer accepts ZONE directly.
    this.group.visible = false;
    this.panel.classList.remove('is-visible');
    this.panel.setAttribute('aria-hidden', 'true');
    this.canvas.classList.remove('is-zone-exhibit-hovered');
    this.exhibitHotspots.forEach((hotspot) => this.onPointerOut(hotspot));
    if (this.statusMessageTimer !== null) window.clearTimeout(this.statusMessageTimer);
    this.statusMessageTimer = null;
    this.statusMessage.classList.remove('is-visible');
    if (!openExhibit()) {
      this.resumeFromExhibit();
      this.showStatusMessage('展品暂时无法打开，请重试');
    }
  }

  private showStatusMessage(message: string): void {
    this.statusMessage.textContent = message;
    this.statusMessage.classList.add('is-visible');
    if (this.statusMessageTimer !== null) window.clearTimeout(this.statusMessageTimer);
    this.statusMessageTimer = window.setTimeout(() => {
      this.statusMessage.classList.remove('is-visible');
      this.statusMessageTimer = null;
    }, 2200);
  }

  private createExhibitLabel(title: string, status: string, index: number): Mesh {
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 180;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Exhibit label canvas is unavailable.');
    context.fillStyle = 'rgba(3,31,43,.82)'; context.fillRect(0, 0, 720, 180);
    context.strokeStyle = index === 0 ? 'rgba(150,249,255,.85)' : 'rgba(83,210,229,.48)'; context.lineWidth = 3; context.strokeRect(3, 3, 714, 174);
    context.fillStyle = '#8beefa'; context.font = '500 22px sans-serif'; context.fillText(`展项 0${index + 1}`, 30, 43);
    context.fillStyle = index === 0 ? '#effeff' : '#9bdae2'; context.font = '500 29px sans-serif'; context.fillText(title, 30, 102);
    context.fillStyle = '#54bdcc'; context.font = '18px sans-serif'; context.fillText(status, 30, 145);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this.textures.push(texture);
    const label = new Mesh(this.geometry(new PlaneGeometry(5.4, 1.35)), this.material(new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })));
    label.position.set(0, 1.1, 1.5); return label;
  }
}
