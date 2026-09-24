import {
  AdditiveBlending, BoxGeometry, BufferGeometry, CanvasTexture, CylinderGeometry,
  DoubleSide, Group, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, PointLight, RingGeometry,
  SphereGeometry, SpotLight, SRGBColorSpace, TorusGeometry,
} from 'three';
import type { Camera } from 'three';
import type { ExhibitEntry, ExhibitShowcaseKind } from '../data/zoneExhibits';

interface StandHotspot {
  readonly root: Group;
  readonly core: Mesh<SphereGeometry, MeshStandardMaterial>;
  readonly rings: readonly Mesh<RingGeometry, MeshBasicMaterial>[];
  readonly target: Mesh;
  hovered: boolean;
}

/** One lightweight display, not a full exhibit model or an exhibit controller. */
export class ZoneExhibitStand {
  public readonly group = new Group();
  public readonly target: Mesh;
  private readonly geometries = new Set<BufferGeometry>();
  private readonly materials = new Set<Material>();
  private readonly textures = new Set<CanvasTexture>();
  private readonly display: Group;
  private readonly hotspot: StandHotspot;
  private disposed = false;

  public constructor(public readonly entry: ExhibitEntry, private readonly index: number) {
    const available = entry.status === 'available' && Boolean(entry.viewerId);
    const isZone01Mvr = entry.zoneId === 'ZONE_01' && entry.showcaseKind === 'mvr';
    this.group.name = `Exhibit showcase ${index + 1}`;
    this.group.position.set(...entry.previewPosition);
    try {
      const plinth = new Mesh(
        this.geometry(new CylinderGeometry(1.6, 1.85, 0.42, 48)),
        this.material(new MeshPhysicalMaterial({ color: available ? '#176b7b' : '#124754', emissive: available ? '#0a7890' : '#073d49', emissiveIntensity: 0.42, metalness: 0.65, roughness: 0.28, clearcoat: 0.7 })),
      );
      plinth.position.y = 0.21;
      this.display = this.createPhysicalPlaceholder(entry.showcaseKind ?? 'generic', available);
      this.display.name = `Showcase preview: ${entry.showcaseKind ?? 'generic'}`;
      // Lift the hero equipment clear of both the plinth and its foreground sign.
      this.display.position.y = isZone01Mvr ? 0.78 : entry.showcaseKind === 'rto' ? 0.56 : 0.42;
      this.hotspot = this.createHotspot(available);
      this.target = this.hotspot.target;
      this.group.add(plinth, this.display, this.hotspot.root, this.createLabel(available));
      if (isZone01Mvr) this.group.add(this.createMvrLighting());
    } catch (error) {
      // A failed label/mesh creation must not strand resources during a rebuild.
      this.dispose();
      throw error;
    }
  }

  public setHovered(hovered: boolean): void {
    if (!this.disposed) this.hotspot.hovered = hovered;
  }

  public update(delta: number, elapsed: number, camera: Camera): void {
    if (this.disposed) return;
    // The production MVR clone is an exhibit, not an animated placeholder.
    if (this.entry.showcaseKind !== 'mvr' && this.entry.showcaseKind !== 'rto') this.display.rotation.y += delta * (0.08 + this.index * 0.015);
    const pulse = (Math.sin(elapsed * 2.8 + this.index * 1.7) + 1) * 0.5;
    const hoverScale = this.hotspot.hovered ? 1.34 : 1;
    this.hotspot.root.scale.setScalar(hoverScale * (0.94 + pulse * 0.1));
    this.hotspot.root.quaternion.copy(camera.quaternion);
    this.hotspot.rings[0].rotation.z += delta * 0.75;
    this.hotspot.rings[1].rotation.z -= delta * 0.48;
    this.hotspot.rings.forEach((ring, index) => {
      ring.material.opacity = Math.min(1, (this.hotspot.hovered ? 0.96 : 0.48) + pulse * (index === 0 ? 0.18 : 0.1));
    });
    this.hotspot.core.material.emissiveIntensity = (this.hotspot.hovered ? 3.2 : 1.65) + pulse * 0.75;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.group.removeFromParent();
    this.group.clear();
    // Preview resources are independent from the full Viewer assets.
    this.geometries.forEach((item) => item.dispose());
    this.materials.forEach((item) => item.dispose());
    this.textures.forEach((item) => item.dispose());
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }

  private geometry<T extends BufferGeometry>(item: T): T { this.geometries.add(item); return item; }
  private material<T extends Material>(item: T): T { this.materials.add(item); return item; }

  private createHotspot(available: boolean): StandHotspot {
    const root = new Group();
    root.name = `Exhibit hotspot: ${this.entry.id}`;
    const isRto = this.entry.showcaseKind === 'rto';
    if (isRto) root.position.set(3.35, 2.45, 0);
    else root.position.set(0, 3.15, 0.35);
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
    const target = new Mesh(
      this.geometry(new SphereGeometry(0.72, 12, 8)),
      this.material(new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })),
    );
    target.name = `Exhibit hit target: ${this.entry.id}`;
    target.userData.exhibit = this.entry;
    root.add(...rings, core, target);
    return { root, core, rings, target, hovered: false };
  }

  /** The authored kind, never the array index, selects the representative preview. */
  private createPhysicalPlaceholder(kind: ExhibitShowcaseKind, available: boolean): Group {
    const display = new Group();
    if (kind === 'mvr') {
      display.name = 'Lightweight MVR preview';
      const steel = this.material(new MeshPhysicalMaterial({ color: '#b9c4c2', roughness: 0.32, metalness: 0.78 }));
      const frame = this.material(new MeshStandardMaterial({ color: '#29423f', roughness: 0.4, metalness: 0.72 }));
      const blue = this.material(new MeshStandardMaterial({ color: '#287e8b', roughness: 0.32, metalness: 0.58 }));
      const base = new Mesh(this.geometry(new BoxGeometry(3.5, 0.18, 1.8)), frame); base.position.y = 0.12; display.add(base);
      for (const [x, height, radius] of [[0.45, 2.9, 0.48], [1.3, 2.05, 0.38]] as const) {
        const vessel = new Mesh(this.geometry(new CylinderGeometry(radius, radius, height, 12)), steel);
        vessel.position.set(x, height / 2 + 0.2, 0); display.add(vessel);
      }
      for (const y of [0.45, 1.7, 3.05]) {
        const beam = new Mesh(this.geometry(new BoxGeometry(3.5, 0.09, 0.09)), frame); beam.position.set(0, y, -0.82); display.add(beam);
      }
      const exchanger = new Mesh(this.geometry(new CylinderGeometry(0.25, 0.25, 1.65, 10)), steel);
      exchanger.rotation.z = Math.PI / 2; exchanger.position.set(-0.85, 1.05, 0); display.add(exchanger);
      const pipe = new Mesh(this.geometry(new TorusGeometry(0.78, 0.06, 6, 18, Math.PI)), blue);
      pipe.rotation.x = Math.PI / 2; pipe.position.set(0.2, 2.9, 0); display.add(pipe);
      display.scale.setScalar(1.05);
      return display;
    }
    if (kind === 'rto') {
      display.name = 'Lightweight RTO preview';
      const shell = this.material(new MeshStandardMaterial({ color: '#d7d1c7', metalness: 0.48, roughness: 0.4 }));
      const dark = this.material(new MeshStandardMaterial({ color: '#342a2b', metalness: 0.7, roughness: 0.34 }));
      const heat = this.material(new MeshStandardMaterial({ color: '#d65b2c', emissive: '#7b1d0e', emissiveIntensity: 0.5 }));
      for (const x of [-1.15, 0, 1.15]) {
        const bed = new Mesh(this.geometry(new BoxGeometry(0.9, 2.45, 1.05)), shell); bed.position.set(x, 1.42, 0); display.add(bed);
        const hopper = new Mesh(this.geometry(new CylinderGeometry(0.34, 0.5, 0.55, 4)), dark); hopper.position.set(x, 0.28, 0); hopper.rotation.y = Math.PI / 4; display.add(hopper);
      }
      const chamber = new Mesh(this.geometry(new BoxGeometry(3.55, 0.72, 1.08)), heat); chamber.position.set(0, 3.02, 0); display.add(chamber);
      const stack = new Mesh(this.geometry(new CylinderGeometry(0.18, 0.22, 3.2, 12)), dark); stack.position.set(2.05, 1.8, 0); display.add(stack);
      display.rotation.y = Math.PI / 2;
      display.scale.setScalar(0.92);
      return display;
    }

    const material = this.material(new MeshStandardMaterial({ color: available ? '#a9e7e9' : '#5f8f96', emissive: available ? '#176f79' : '#163e45', emissiveIntensity: 0.32, metalness: 0.72, roughness: 0.3, transparent: !available, opacity: available ? 1 : 0.58 }));
    if (kind === 'membrane') {
      for (const x of [-0.68, 0, 0.68]) {
        const membrane = new Mesh(this.geometry(new CylinderGeometry(0.18, 0.18, 1.65, 16)), material); membrane.position.set(x, 1.18, 0); display.add(membrane);
      }
      const header = new Mesh(this.geometry(new BoxGeometry(1.75, 0.18, 0.34)), material); header.position.set(0, 1.95, 0); display.add(header);
    } else if (kind === 'monitoring') {
      const consoleBody = new Mesh(this.geometry(new BoxGeometry(1.65, 1.15, 0.52)), material); consoleBody.position.y = 1.05; consoleBody.rotation.x = -0.12;
      const sensor = new Mesh(this.geometry(new CylinderGeometry(0.08, 0.08, 1.15, 12)), material); sensor.position.set(0.72, 2, 0);
      const sensorHead = new Mesh(this.geometry(new OctahedronGeometry(0.25, 0)), material); sensorHead.position.set(0.72, 2.58, 0); display.add(consoleBody, sensor, sensorHead);
    } else {
      const placeholder = new Mesh(this.geometry(new BoxGeometry(1.2, 1.4, 1.2)), material);
      placeholder.position.y = 1.12;
      display.add(placeholder);
    }
    return display;
  }

  private createLabel(available: boolean): Mesh {
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 180;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Exhibit label canvas is unavailable.');
    context.fillStyle = 'rgba(3,31,43,.82)'; context.fillRect(0, 0, 720, 180);
    context.strokeStyle = available ? 'rgba(150,249,255,.85)' : 'rgba(83,210,229,.48)'; context.lineWidth = 3; context.strokeRect(3, 3, 714, 174);
    context.fillStyle = '#8beefa'; context.font = '500 22px sans-serif'; context.fillText(`展项 ${String(this.index + 1).padStart(2, '0')}`, 30, 43);
    context.fillStyle = available ? '#effeff' : '#9bdae2'; context.font = '500 29px sans-serif'; context.fillText(this.entry.previewLabel, 30, 102);
    context.fillStyle = '#54bdcc'; context.font = '18px sans-serif'; context.fillText(available ? '点击热点进入展项' : '展项预留', 30, 145);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this.textures.add(texture);
    const isZone01Mvr = this.entry.zoneId === 'ZONE_01' && this.entry.showcaseKind === 'mvr';
    const isRto = this.entry.showcaseKind === 'rto';
    const label = new Mesh(this.geometry(new PlaneGeometry(isZone01Mvr ? 4.6 : 5.4, isZone01Mvr ? 1.15 : 1.35)), this.material(new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })));
    // Keep signs in the visitor-facing foreground without covering the exhibit.
    if (isRto) {
      label.position.set(3.68, 0.9, 0);
      label.rotation.y = Math.PI / 2;
    } else {
      label.position.set(0, isZone01Mvr ? 0.72 : 1.1, isZone01Mvr ? 2.75 : 1.5);
    }
    return label;
  }

  private createMvrLighting(): Group {
    const lighting = new Group();
    lighting.name = 'ZONE_01 MVR industrial showcase lighting';

    const topLight = new SpotLight('#f1fbff', 62, 12, Math.PI / 5, 0.45, 1.25);
    topLight.name = 'MVR overhead industrial light';
    topLight.position.set(0, 6.2, 1.2);
    topLight.target.position.set(0, 2.1, 0);

    const cyanRim = new PointLight('#39e9ff', 48, 9, 1.45);
    cyanRim.name = 'MVR cyan edge light';
    cyanRim.position.set(-3.1, 2.8, -1.8);

    lighting.add(topLight, topLight.target, cyanRim);
    return lighting;
  }
}
