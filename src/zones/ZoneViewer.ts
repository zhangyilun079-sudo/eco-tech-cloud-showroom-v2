import {
  AdditiveBlending, BoxGeometry, BufferGeometry, CanvasTexture, Color, CylinderGeometry,
  DoubleSide, Float32BufferAttribute, Group, Material, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, PointLight, Points,
  PointsMaterial, RingGeometry, SRGBColorSpace, TorusGeometry, Vector3,
} from 'three';
import type { CameraController, CameraState } from '../core/CameraController';
import { RaycastManager } from '../interaction/RaycastManager';
import { ViewMode, type ViewModeState } from '../core/ViewMode';
import type { ZoneDefinition } from './ZoneDefinition';
import type { ExhibitEntry } from './data/zoneExhibits';

const ENTRY_DURATION = 0.78;
const SETTLE_DURATION = 0.62;
interface Transition { readonly from: CameraState; readonly to: CameraState; readonly duration: number; elapsed: number; readonly complete?: () => void }

/** Owns the independent zone environment and its two-stage entrance transition. */
export class ZoneViewer {
  public readonly group = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: CanvasTexture[] = [];
  private readonly circulationRings: Group[] = [];
  private readonly exhibitPreviews: Group[] = [];
  private readonly exhibitDirectory = new Group();
  private readonly waterParticles: Points;
  private readonly panel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly description: HTMLElement;
  private readonly returnButton: HTMLButtonElement;
  private readonly raycastManager: RaycastManager;
  private readonly exhibitTargets: Mesh[] = [];
  private transition: Transition | null = null;
  private showroomState: CameraState | null = null;
  private elapsed = 0;

  public constructor(
    container: HTMLElement,
    private readonly camera: CameraController,
    private readonly canvas: HTMLCanvasElement,
    private readonly viewMode: ViewModeState,
    private readonly onVisibilityChange: (zoneActive: boolean) => void,
    private readonly onReturn: () => void,
    private readonly onOpenExhibit: (viewerId: string, position: Vector3) => void,
  ) {
    this.group.name = 'ZONE_01 water intelligence center';
    this.group.visible = false;
    this.panel = document.createElement('section');
    this.panel.className = 'zone-viewer-panel';
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.innerHTML = `<p class="zone-viewer-kicker">ZONE_01 · WATER INTELLIGENCE CENTER</p><h1></h1><p class="zone-viewer-subtitle"></p><p class="zone-viewer-description"></p><div class="zone-live-status"><span>水质监测在线</span><span>循环系统稳定</span></div><section class="zone-exhibit-directory" aria-label="水环境技术展品目录"><p>EXHIBIT DIRECTORY · 展品目录</p><ol></ol></section><button class="zone-return" type="button">← 返回主展厅</button>`;
    container.append(this.panel);
    this.title = this.required('h1');
    this.subtitle = this.required('.zone-viewer-subtitle');
    this.description = this.required('.zone-viewer-description');
    const button = this.panel.querySelector<HTMLButtonElement>('button');
    if (!button) throw new Error('Zone return button was not created.');
    this.returnButton = button;
    this.returnButton.addEventListener('click', this.exit);
    this.waterParticles = this.createWaterEnvironment();
    this.raycastManager = new RaycastManager({
      camera: this.camera.camera,
      canvas: this.canvas,
      getTargets: () => this.viewMode.mode === ViewMode.ZONE ? this.exhibitTargets : [],
      onHover: (target) => {
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
    this.renderDirectory(definition);
    this.renderExhibitDirectory(definition);
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
      this.viewMode.set(ViewMode.SHOWROOM);
      this.camera.setNavigationEnabled(true);
      this.onReturn();
    });
  };

  public update(delta: number): void {
    if (this.group.visible) {
      this.elapsed += delta;
      this.circulationRings.forEach((ring, index) => {
        ring.rotation.z += delta * (index % 2 === 0 ? 0.16 : -0.11);
        ring.position.y = 3.1 + Math.sin(this.elapsed * 0.7 + index) * 0.12;
      });
      this.exhibitPreviews.forEach((preview, index) => {
        preview.rotation.y += delta * (0.24 + index * 0.04);
        preview.position.y = 2.35 + Math.sin(this.elapsed * 1.1 + index * 0.8) * 0.12;
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
    this.group.add(this.exhibitDirectory);

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

  private renderDirectory(definition: ZoneDefinition): void {
    const list = this.panel.querySelector<HTMLOListElement>('.zone-exhibit-directory ol');
    if (!list) return;
    list.replaceChildren(...definition.exhibits.map((exhibit, index) => {
      const item = document.createElement('li');
      item.className = exhibit.status === 'available' ? 'is-connected' : 'is-placeholder';
      item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><div><strong>${exhibit.name}</strong><small>${exhibit.status === 'available' ? 'CONNECTED · 已接入现有 MVR 展项' : 'PLANNED · 展项预留'}</small></div>`;
      if (exhibit.status === 'available' && exhibit.viewerId) {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.addEventListener('click', () => this.handleExhibitClick(exhibit));
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.handleExhibitClick(exhibit);
          }
        });
      }
      return item;
    }));
  }

  /** Lightweight projections mirror the active definition; they are never physical equipment. */
  private renderExhibitDirectory(definition: ZoneDefinition): void {
    this.exhibitDirectory.clear();
    this.exhibitPreviews.length = 0;
    this.exhibitTargets.length = 0;
    definition.exhibits.forEach((exhibit, index) => {
      const marker = new Group(); marker.name = `Digital exhibit entrance ${index + 1}`;
      marker.position.set(...exhibit.previewPosition);
      const pad = new Mesh(this.geometry(new RingGeometry(1.35, 1.47, 64)), this.material(new MeshBasicMaterial({ color: index === 0 ? '#b8fbff' : '#43cfe5', transparent: true, opacity: index === 0 ? 0.85 : 0.42, side: DoubleSide })));
      pad.rotation.x = -Math.PI / 2; pad.position.y = 0.055;
      const beam = new Mesh(this.geometry(new CylinderGeometry(0.82, 1.15, 3.6, 32, 1, true)), this.material(new MeshBasicMaterial({ color: '#4de4f4', transparent: true, opacity: 0.055, side: DoubleSide, depthWrite: false })));
      beam.position.y = 1.8;
      const preview = new Group(); preview.position.y = 2.35;
      const core = new Mesh(this.geometry(new OctahedronGeometry(index === 0 ? 0.72 : 0.58, 1)), this.material(new MeshBasicMaterial({ color: index === 0 ? '#d3fdff' : '#61d9e9', wireframe: true, transparent: true, opacity: index === 0 ? 0.9 : 0.5 })));
      const orbit = new Mesh(this.geometry(new TorusGeometry(1.02, 0.025, 6, 56)), this.material(new MeshBasicMaterial({ color: '#83eff9', transparent: true, opacity: 0.62 })));
      orbit.rotation.x = Math.PI / 2; preview.add(core, orbit); this.exhibitPreviews.push(preview);
      marker.add(pad, beam, preview, this.createExhibitLabel(
        exhibit.previewLabel,
        exhibit.status === 'available' ? 'CONNECTED' : 'PLANNED',
        index,
      ));
      if (exhibit.status === 'available' && exhibit.viewerId) {
        for (const target of [pad, beam, core, orbit]) {
          target.userData.exhibit = exhibit;
          this.exhibitTargets.push(target);
        }
      }
      this.exhibitDirectory.add(marker);
    });
  }

  private handleExhibitClick(exhibit: ExhibitEntry): void {
    if (this.viewMode.mode !== ViewMode.ZONE || exhibit.status !== 'available' || !exhibit.viewerId) return;
    console.info('clicked exhibit:', exhibit.id, exhibit.viewerId);

    // ExhibitViewer accepts entries from SHOWROOM mode. Restore that owning state
    // before routing to the already registered viewer; exiting the exhibit will
    // therefore return to the main showroom rather than an invisible zone.
    if (this.showroomState) this.camera.applyState(this.showroomState);
    this.transition = null;
    this.showroomState = null;
    this.group.visible = false;
    this.panel.classList.remove('is-visible');
    this.panel.setAttribute('aria-hidden', 'true');
    this.canvas.classList.remove('is-zone-exhibit-hovered');
    this.viewMode.set(ViewMode.SHOWROOM);
    this.camera.setNavigationEnabled(true);
    this.onVisibilityChange(false);
    this.onOpenExhibit(exhibit.viewerId, new Vector3(...exhibit.previewPosition));
  }

  private createExhibitLabel(title: string, status: string, index: number): Mesh {
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 180;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Exhibit label canvas is unavailable.');
    context.fillStyle = 'rgba(3,31,43,.82)'; context.fillRect(0, 0, 720, 180);
    context.strokeStyle = index === 0 ? 'rgba(150,249,255,.85)' : 'rgba(83,210,229,.48)'; context.lineWidth = 3; context.strokeRect(3, 3, 714, 174);
    context.fillStyle = '#8beefa'; context.font = '500 22px sans-serif'; context.fillText(`0${index + 1}  ${status}`, 30, 43);
    context.fillStyle = index === 0 ? '#effeff' : '#9bdae2'; context.font = '500 29px sans-serif'; context.fillText(title, 30, 102);
    context.fillStyle = '#54bdcc'; context.font = '18px sans-serif'; context.fillText(index === 0 ? 'DIGITAL ENTRANCE · ONLINE' : 'HOLOGRAPHIC PREVIEW · RESERVED', 30, 145);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this.textures.push(texture);
    const label = new Mesh(this.geometry(new PlaneGeometry(5.4, 1.35)), this.material(new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })));
    label.position.set(0, 1.1, 1.5); return label;
  }
}
