import {
  AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, Material,
  Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PlaneGeometry, Points, PointsMaterial,
  RingGeometry, TorusGeometry, Vector3,
} from 'three';
import type { CameraController, CameraState } from '../core/CameraController';
import { ViewMode, type ViewModeState } from '../core/ViewMode';
import type { ZoneDefinition } from './ZoneDefinition';

const TRANSITION_DURATION = 1.15;
interface Transition { readonly from: CameraState; readonly to: CameraState; elapsed: number; readonly complete?: () => void }

/** Owns zone-level presentation and transitions without coupling it to exhibits. */
export class ZoneViewer {
  public readonly group = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly panel: HTMLElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly description: HTMLElement;
  private readonly returnButton: HTMLButtonElement;
  private transition: Transition | null = null;
  private showroomState: CameraState | null = null;
  private elapsed = 0;

  public constructor(
    container: HTMLElement,
    private readonly camera: CameraController,
    private readonly viewMode: ViewModeState,
    private readonly onVisibilityChange: (zoneActive: boolean) => void,
    private readonly onReturn: () => void,
  ) {
    this.group.name = 'Exhibition zones';
    this.group.visible = false;
    this.panel = document.createElement('section');
    this.panel.className = 'zone-viewer-panel';
    this.panel.setAttribute('aria-hidden', 'true');
    this.panel.innerHTML = `<p class="zone-viewer-kicker">ZONE_01 · DIGITAL EXHIBITION</p><h1></h1><p class="zone-viewer-subtitle"></p><p class="zone-viewer-description"></p><div class="zone-exhibit-anchor"><span>01</span><div><strong>展品入口</strong><small>MVR 与更多水环境展品 · 即将开放</small></div></div><button type="button">← 返回主展厅</button>`;
    container.append(this.panel);
    this.title = this.required('h1');
    this.subtitle = this.required('.zone-viewer-subtitle');
    this.description = this.required('.zone-viewer-description');
    const button = this.panel.querySelector<HTMLButtonElement>('button');
    if (!button) throw new Error('Zone return button was not created.');
    this.returnButton = button;
    this.returnButton.addEventListener('click', this.exit);
    this.createWaterPlaceholder();
  }

  public enter(definition: ZoneDefinition): boolean {
    if (definition.id !== 'ZONE_01' || this.viewMode.mode !== ViewMode.SHOWROOM) return false;
    this.showroomState = this.camera.captureState();
    this.viewMode.set(ViewMode.ZONE);
    this.camera.setNavigationEnabled(false);
    this.group.visible = true;
    this.onVisibilityChange(true);
    this.title.textContent = definition.title;
    this.subtitle.textContent = definition.englishTitle;
    this.description.textContent = definition.description;
    this.panel.classList.add('is-visible');
    this.panel.setAttribute('aria-hidden', 'false');
    this.begin({ position: new Vector3(...definition.cameraPosition), target: new Vector3(...definition.cameraTarget) });
    return true;
  }

  public readonly exit = (): void => {
    if (this.viewMode.mode !== ViewMode.ZONE || !this.showroomState || this.transition) return;
    this.onVisibilityChange(false);
    this.panel.classList.remove('is-visible');
    this.panel.setAttribute('aria-hidden', 'true');
    this.begin(this.showroomState, () => {
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
      this.group.rotation.y = Math.sin(this.elapsed * 0.18) * 0.004;
    }
    if (!this.transition) return;
    this.transition.elapsed = Math.min(TRANSITION_DURATION, this.transition.elapsed + delta);
    const p = this.transition.elapsed / TRANSITION_DURATION;
    const eased = p * p * (3 - 2 * p);
    this.camera.applyState({ position: this.transition.from.position.clone().lerp(this.transition.to.position, eased), target: this.transition.from.target.clone().lerp(this.transition.to.target, eased) });
    if (p === 1) { const done = this.transition.complete; this.transition = null; done?.(); }
  }

  public dispose(): void {
    this.returnButton.removeEventListener('click', this.exit);
    this.panel.remove();
    this.geometries.forEach((item) => item.dispose());
    this.materials.forEach((item) => item.dispose());
  }

  private begin(to: CameraState, complete?: () => void): void { this.transition = { from: this.camera.captureState(), to, elapsed: 0, complete }; }
  private required(selector: string): HTMLElement { const element = this.panel.querySelector<HTMLElement>(selector); if (!element) throw new Error(`Missing zone UI: ${selector}`); return element; }
  private geometry<T extends BufferGeometry>(item: T): T { this.geometries.push(item); return item; }
  private material<T extends Material>(item: T): T { this.materials.push(item); return item; }

  private createWaterPlaceholder(): void {
    const origin = new Vector3(0, 0, -42);
    const floor = new Mesh(this.geometry(new PlaneGeometry(28, 22)), this.material(new MeshPhysicalMaterial({ color: '#03151d', metalness: 0.6, roughness: 0.3, clearcoat: 0.65 })));
    floor.rotation.x = -Math.PI / 2; floor.position.copy(origin); this.group.add(floor);
    for (const radius of [3.2, 6.4, 10.2]) {
      const ring = new Mesh(this.geometry(new RingGeometry(radius - 0.035, radius + 0.035, 80)), this.material(new MeshBasicMaterial({ color: '#39ddeb', transparent: true, opacity: 0.34 })));
      ring.rotation.x = -Math.PI / 2; ring.position.copy(origin).add(new Vector3(0, 0.025, 0)); this.group.add(ring);
    }
    const anchor = new Group(); anchor.name = 'ZONE_01 future exhibit anchor — MVR and water exhibits'; anchor.position.copy(origin);
    const portal = new Mesh(this.geometry(new TorusGeometry(2.25, 0.055, 8, 64)), this.material(new MeshBasicMaterial({ color: '#70efff', transparent: true, opacity: 0.72 })));
    portal.rotation.x = Math.PI / 2; portal.position.y = 0.08; anchor.add(portal); this.group.add(anchor);
    const positions: number[] = [];
    for (let i = 0; i < 420; i += 1) { const angle = i * 2.399; const radius = 2 + (i % 70) * 0.14; positions.push(origin.x + Math.cos(angle) * radius, 0.2 + (i % 17) * 0.24, origin.z + Math.sin(angle) * radius); }
    const particles = this.geometry(new BufferGeometry()); particles.setAttribute('position', new Float32BufferAttribute(positions, 3));
    this.group.add(new Points(particles, this.material(new PointsMaterial({ color: new Color('#5fe9ff'), size: 0.045, transparent: true, opacity: 0.58, blending: AdditiveBlending, depthWrite: false }))));
  }
}
