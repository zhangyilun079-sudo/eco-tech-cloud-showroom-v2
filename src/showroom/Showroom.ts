import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Texture,
  Vector3,
} from 'three';
import { CentralDataCore } from './CentralDataCore';

export type ShowroomZoneId = 'ZONE_01' | 'ZONE_02' | 'ZONE_03' | 'ZONE_04' | 'ZONE_05';

export interface ShowroomZone {
  readonly id: ShowroomZoneId;
  readonly position: Vector3;
  readonly hotspotPosition: Vector3;
  /** Stable, empty attachment point used by the exhibit-mode registry. */
  readonly exhibitPlaceholder: Group;
}

interface ZoneLayout {
  readonly id: ShowroomZoneId;
  readonly position: readonly [number, number, number];
  readonly rotation: number;
}

interface ZoneTheme {
  readonly title: string;
  readonly englishTitle: string;
  readonly descriptor: string;
  readonly accent: string;
  readonly metric: string;
  readonly motif: 'water' | 'circular' | 'energy' | 'air' | 'ecology';
  readonly indicators: readonly [ZoneIndicator, ZoneIndicator, ZoneIndicator];
}

interface ZoneIndicator {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly level: number;
}

interface AnimatedDataDisplay {
  readonly texture: CanvasTexture;
  readonly context: CanvasRenderingContext2D;
  readonly theme: ZoneTheme;
  readonly phase: number;
}

const ZONE_THEMES: Readonly<Record<ShowroomZoneId, ZoneTheme>> = {
  ZONE_01: { title: '水环境治理', englishTitle: 'WATER INTELLIGENCE', descriptor: '智慧水务 / 资源循环', accent: '#35d9e7', metric: 'RECOVERY 92%', motif: 'water', indicators: [
    { label: 'WATER QUALITY', value: 'Ⅱ', unit: 'CLASS', level: 0.84 }, { label: 'TREATMENT', value: '97.6', unit: '% EFF.', level: 0.976 }, { label: 'RECYCLING', value: '92', unit: '%', level: 0.92 },
  ] },
  ZONE_02: { title: '固废资源化', englishTitle: 'RESOURCE CIRCULATION', descriptor: '智能分选 / 循环材料', accent: '#58e59a', metric: 'CYCLE 86%', motif: 'circular', indicators: [
    { label: 'CIRCULATION', value: '1.8K', unit: 'T/DAY', level: 0.78 }, { label: 'RECYCLE RATE', value: '86', unit: '%', level: 0.86 }, { label: 'DIVERSION', value: '91', unit: '%', level: 0.91 },
  ] },
  ZONE_03: { title: '清洁能源', englishTitle: 'CLEAN ENERGY', descriptor: '氢能 / 智慧储能', accent: '#48e1c1', metric: 'CO₂ −68%', motif: 'energy', indicators: [
    { label: 'RENEWABLE', value: '81', unit: '% GRID', level: 0.81 }, { label: 'HYDROGEN', value: '12.4', unit: 'T/DAY', level: 0.68 }, { label: 'STORAGE', value: '94', unit: '% SOC', level: 0.94 },
  ] },
  ZONE_04: { title: '大气环境治理', englishTitle: 'AIR INTELLIGENCE', descriptor: '感知网络 / 排放控制', accent: '#5dbef3', metric: 'AQI 32', motif: 'air', indicators: [
    { label: 'AIR QUALITY', value: '32', unit: 'AQI GOOD', level: 0.88 }, { label: 'EMISSIONS', value: '−43', unit: '% YOY', level: 0.74 }, { label: 'SENSORS', value: '128', unit: 'ONLINE', level: 0.96 },
  ] },
  ZONE_05: { title: '生态修复', englishTitle: 'ECO RESTORATION', descriptor: '数字孪生 / 智慧监测', accent: '#76e69d', metric: 'ECO INDEX 78', motif: 'ecology', indicators: [
    { label: 'ECO MONITOR', value: '78', unit: 'INDEX', level: 0.78 }, { label: 'REMOTE SENSE', value: '96', unit: '% COVER', level: 0.96 }, { label: 'HABITAT', value: '+18', unit: '% GAIN', level: 0.69 },
  ] },
};

// Keep these anchors stable: HotspotManager and exhibit-mode entry depend on them.
const ZONE_LAYOUTS: readonly ZoneLayout[] = [
  { id: 'ZONE_01', position: [-9.25, 0, -8.25], rotation: 0 },
  { id: 'ZONE_02', position: [0, 0, -8.25], rotation: 0 },
  { id: 'ZONE_03', position: [9.25, 0, -8.25], rotation: 0 },
  { id: 'ZONE_04', position: [-12.25, 0, -1.55], rotation: Math.PI / 2 },
  { id: 'ZONE_05', position: [12.25, 0, -1.55], rotation: -Math.PI / 2 },
];

export class Showroom {
  public readonly group = new Group();
  public readonly zones: readonly ShowroomZone[];
  public readonly centralDataCore = new CentralDataCore();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private readonly holograms: Group[] = [];
  private readonly atmosphere = new Group();
  private readonly dataDisplays: AnimatedDataDisplay[] = [];
  private elapsed = 0;
  private dataFrame = -1;

  public constructor() {
    this.group.name = 'Cylindrical intelligent digital exhibition hall';
    this.createCircularHall();
    this.createCeilingRings();
    this.createEntrance();
    this.createAtmosphere();
    this.group.add(this.centralDataCore);
    this.zones = ZONE_LAYOUTS.map((layout) => this.createZone(layout));
  }

  public update(delta: number): void {
    this.elapsed += delta;
    this.centralDataCore.update(delta);
    this.holograms.forEach((hologram, index) => {
      hologram.rotation.y += delta * (0.14 + index * 0.012);
      hologram.position.y = 2.25 + Math.sin(this.elapsed * 0.75 + index) * 0.09;
    });
    // The atmosphere is deliberately one batched point cloud. This update is
    // reached only in showroom mode, so no decorative work survives offscreen.
    this.atmosphere.rotation.y = this.elapsed * 0.006;
    this.atmosphere.position.y = Math.sin(this.elapsed * 0.12) * 0.035;
    const nextDataFrame = Math.floor(this.elapsed * 10);
    if (nextDataFrame !== this.dataFrame) {
      this.dataFrame = nextDataFrame;
      this.dataDisplays.forEach((display) => {
        this.drawDataDisplay(display, this.elapsed);
        display.texture.needsUpdate = true;
      });
    }
  }

  public dispose(): void {
    this.centralDataCore.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private createCircularHall(): void {
    const floor = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#08171b', roughness: 0.38, metalness: 0.62, clearcoat: 0.46, clearcoatRoughness: 0.3,
    }));
    const floorMesh = new Mesh(this.keepGeometry(new CylinderGeometry(15.4, 15.4, 0.22, 96)), floor);
    floorMesh.name = 'Dark circular reflective floor';
    floorMesh.position.set(0, -0.11, 0.35);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    const wall = this.keepMaterial(new MeshStandardMaterial({
      color: '#091a20', roughness: 0.42, metalness: 0.72, side: DoubleSide,
    }));
    // Preserve the cylindrical enclosure while removing a generous 72° front
    // sector. Three's cylinder starts at +Z, so the skin begins after the
    // opening and wraps around the back of the hall.
    const entranceHalfAngle = Math.PI * 0.2;
    const shell = new Mesh(this.keepGeometry(new CylinderGeometry(
      15.15, 15.15, 10.2, 72, 1, true,
      entranceHalfAngle, Math.PI * 2 - entranceHalfAngle * 2,
    )), wall);
    shell.name = 'Open cylindrical hall inner skin';
    shell.position.set(0, 5.05, 0.35);
    this.group.add(shell);

    const line = this.keepMaterial(new MeshBasicMaterial({ color: '#35d7d7', transparent: true, opacity: 0.34 }));
    for (const radius of [5.5, 8.2, 11.3, 14.65]) {
      const ring = new Mesh(this.keepGeometry(new RingGeometry(radius - 0.035, radius + 0.035, 96)), line);
      ring.name = 'Floor navigation data ring';
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.012;
      this.group.add(ring);
    }
    for (let i = 0; i < 24; i += 1) {
      const angle = i / 24 * Math.PI * 2;
      if (Math.sin(angle) > 0.72) continue;
      const rib = new Mesh(this.keepGeometry(new BoxGeometry(0.08, 9.6, 0.18)), wall);
      rib.name = 'Cylindrical structural data rib';
      rib.position.set(Math.cos(angle) * 14.95, 4.85, Math.sin(angle) * 14.95 + 0.35);
      rib.rotation.y = -angle;
      this.group.add(rib);
    }
  }

  private createCeilingRings(): void {
    const dark = this.keepMaterial(new MeshStandardMaterial({ color: '#0a171b', metalness: 0.72, roughness: 0.3 }));
    const cyan = this.keepMaterial(new MeshBasicMaterial({ color: '#a7ffff', transparent: true, opacity: 0.92 }));
    const green = this.keepMaterial(new MeshBasicMaterial({ color: '#69edb3', transparent: true, opacity: 0.74 }));
    for (const [radius, height, material] of [[13.4, 9.35, cyan], [10.3, 9.12, green], [7.15, 8.9, cyan], [4.4, 8.72, green]] as const) {
      const carrier = new Mesh(this.keepGeometry(new TorusGeometry(radius, 0.14, 8, 96)), dark);
      carrier.rotation.x = Math.PI / 2;
      carrier.position.y = height;
      const light = new Mesh(this.keepGeometry(new TorusGeometry(radius, 0.035, 6, 96)), material);
      light.name = 'Primary luminous ceiling ring';
      light.rotation.x = Math.PI / 2;
      light.position.y = height - 0.13;
      this.group.add(carrier, light);
    }
    const ceiling = new Mesh(this.keepGeometry(new CylinderGeometry(14.75, 14.75, 0.12, 96)), dark);
    ceiling.name = 'Recessed dark circular ceiling';
    ceiling.position.y = 9.55;
    this.group.add(ceiling);
  }

  private createEntrance(): void {
    const structure = this.keepMaterial(new MeshStandardMaterial({
      color: '#08171c', metalness: 0.82, roughness: 0.24,
    }));
    const inset = this.keepMaterial(new MeshStandardMaterial({
      color: '#0b2227', metalness: 0.62, roughness: 0.34,
    }));
    const cyan = this.keepMaterial(new MeshBasicMaterial({ color: '#8ffcf3', transparent: true, opacity: 0.92 }));
    const green = this.keepMaterial(new MeshBasicMaterial({ color: '#63e8ac', transparent: true, opacity: 0.76 }));
    const guide = this.keepMaterial(new MeshBasicMaterial({ color: '#50e3d0', transparent: true, opacity: 0.68 }));

    // A dark arrival apron carries the architecture beyond the circular floor
    // and makes the luminous route readable from the first camera frame.
    const apron = new Mesh(this.keepGeometry(new PlaneGeometry(11.8, 8.2)), this.keepMaterial(new MeshPhysicalMaterial({
      color: '#061115', roughness: 0.34, metalness: 0.56, clearcoat: 0.45,
    })));
    apron.name = 'Ceremonial entrance arrival apron';
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(0, -0.015, 17.1);
    apron.receiveShadow = true;
    this.group.add(apron);

    // The primary portal is intentionally wider than the data island. Its
    // slim frame reads as a gateway without interrupting the central sightline.
    for (const x of [-5.65, 5.65]) {
      const pier = new Mesh(this.keepGeometry(new BoxGeometry(0.7, 8.7, 1.18)), structure);
      pier.name = 'Grand entrance structural pier';
      pier.position.set(x, 4.35, 14.2);
      pier.rotation.y = x < 0 ? -0.07 : 0.07;

      const innerEdge = new Mesh(this.keepGeometry(new BoxGeometry(0.055, 7.9, 1.23)), x < 0 ? cyan : green);
      innerEdge.name = 'Illuminated gateway inner edge';
      innerEdge.position.set(x < 0 ? x + 0.385 : x - 0.385, 4.1, 14.15);
      this.group.add(pier, innerEdge);
    }

    const lintel = new Mesh(this.keepGeometry(new BoxGeometry(12, 0.66, 1.28)), structure);
    lintel.name = 'Floating ceremonial gateway crown';
    lintel.position.set(0, 8.72, 14.18);
    const crownLight = new Mesh(this.keepGeometry(new BoxGeometry(10.8, 0.055, 1.33)), cyan);
    crownLight.name = 'Gateway crown light';
    crownLight.position.set(0, 8.34, 14.17);
    this.group.add(lintel, crownLight);

    // Angled wings visually connect the freestanding portal to the cut edges
    // of the cylindrical shell while keeping the full entrance axis open.
    for (const side of [-1, 1]) {
      const wing = new Mesh(this.keepGeometry(new BoxGeometry(3.6, 7.45, 0.34)), inset);
      wing.name = 'Entrance side architectural wing';
      wing.position.set(side * 7.2, 3.72, 12.9);
      wing.rotation.y = side * 0.48;
      const wingLight = new Mesh(this.keepGeometry(new BoxGeometry(0.045, 6.65, 0.39)), side < 0 ? green : cyan);
      wingLight.name = 'Entrance wing vertical beacon';
      wingLight.position.set(side * 6.05, 3.72, 13.55);
      wingLight.rotation.y = side * 0.48;
      this.group.add(wing, wingLight);
    }

    for (const x of [-2.15, -1.45, 1.45, 2.15]) {
      const strip = new Mesh(this.keepGeometry(new PlaneGeometry(x === -2.15 || x === 2.15 ? 0.025 : 0.055, 15.2)), guide);
      strip.name = 'Entrance floor guidance light';
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(x, 0.025, 11.2);
      this.group.add(strip);
    }
    for (const z of [14.7, 16.2, 17.7, 19.2]) {
      const stepLight = new Mesh(this.keepGeometry(new PlaneGeometry(5.7, 0.025)), green);
      stepLight.name = 'Ceremonial arrival cadence light';
      stepLight.rotation.x = -Math.PI / 2;
      stepLight.position.set(0, 0.028, z);
      this.group.add(stepLight);
    }
    const threshold = new Mesh(this.keepGeometry(new TorusGeometry(14.72, 0.04, 5, 96, Math.PI * 0.27)), guide);
    threshold.name = 'Open arrival threshold arc';
    threshold.rotation.set(Math.PI / 2, 0, Math.PI * 0.365);
    threshold.position.set(0, 0.03, 0.35);
    this.group.add(threshold);
  }

  private createZone(layout: ZoneLayout): ShowroomZone {
    const theme = ZONE_THEMES[layout.id];
    const zone = new Group();
    zone.name = `${layout.id} double-height intelligent projection bay`;
    zone.position.set(...layout.position);
    zone.rotation.y = layout.rotation;

    const structure = this.keepMaterial(new MeshStandardMaterial({ color: '#0c2026', metalness: 0.82, roughness: 0.3 }));
    const inset = this.keepMaterial(new MeshStandardMaterial({ color: '#06151a', metalness: 0.48, roughness: 0.55 }));
    const glow = this.keepMaterial(new MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.72, toneMapped: false }));
    const screen = this.keepMaterial(new MeshPhysicalMaterial({
      color: new Color(theme.accent).multiplyScalar(0.12), emissive: theme.accent,
      emissiveIntensity: 0.22, transparent: true, opacity: 0.72, roughness: 0.2,
      clearcoat: 0.45, clearcoatRoughness: 0.18, toneMapped: true,
    }));

    const back = new Mesh(this.keepGeometry(new BoxGeometry(7.2, 8.2, 0.32)), inset);
    back.name = 'Double-height digital bay backdrop';
    back.position.set(0, 4.1, -0.3);
    zone.add(back);
    const header = new Mesh(this.keepGeometry(new BoxGeometry(7.35, 0.26, 0.5)), structure);
    header.position.set(0, 8.08, -0.1);
    zone.add(header);
    for (const x of [-3.48, 3.48]) {
      const column = new Mesh(this.keepGeometry(new BoxGeometry(0.22, 8.25, 0.48)), structure);
      column.position.set(x, 4.05, -0.08);
      const trim = new Mesh(this.keepGeometry(new BoxGeometry(0.035, 7.72, 0.51)), glow);
      trim.position.set(x > 0 ? x - 0.13 : x + 0.13, 4.02, -0.05);
      zone.add(column, trim);
    }

    this.createMainScreen(zone, layout.id, theme, screen, glow);
    this.createSecondaryScreens(zone, theme, glow);
    this.createPodArchitecture(zone, theme, structure, glow);
    this.createHologram(zone, theme);

    // Attachment point remains intentionally empty in showroom mode. The
    // detailed MVR object is owned and rendered only by ExhibitViewer.
    const exhibitPlaceholder = new Group();
    exhibitPlaceholder.name = `${layout.id} exhibit attachment anchor`;
    exhibitPlaceholder.position.set(0, 0, 1.25);
    zone.add(exhibitPlaceholder);
    this.group.add(zone);

    return {
      id: layout.id,
      position: zone.position.clone(),
      hotspotPosition: zone.position.clone().add(new Vector3(0, 0, layout.rotation === 0 ? 1.45 : 0)),
      exhibitPlaceholder,
    };
  }

  private createMainScreen(zone: Group, id: ShowroomZoneId, theme: ZoneTheme, screen: Material, glow: Material): void {
    const display = new Mesh(this.keepGeometry(new PlaneGeometry(6.25, 2.6)), screen);
    display.name = 'Self-illuminated panoramic technology display';
    display.position.set(0, 6.18, -0.115);
    zone.add(display);

    const labelTexture = this.createLabelTexture(id, theme);
    const label = new Mesh(this.keepGeometry(new PlaneGeometry(5.8, 2.1)), this.keepMaterial(new MeshBasicMaterial({
      map: labelTexture, transparent: true, depthWrite: false,
    })));
    label.name = 'Glowing digital title signage';
    label.position.set(0, 6.18, -0.08);
    zone.add(label);

    for (const y of [4.73, 7.62]) {
      const trim = new Mesh(this.keepGeometry(new BoxGeometry(6.3, 0.025, 0.05)), glow);
      trim.position.set(0, y, -0.04);
      zone.add(trim);
    }
  }

  private createSecondaryScreens(zone: Group, theme: ZoneTheme, glow: Material): void {
    const display = this.createDataDisplay(theme, this.dataDisplays.length * 0.83);
    const panel = new Mesh(this.keepGeometry(new PlaneGeometry(6.15, 1.18)), this.keepMaterial(new MeshBasicMaterial({
      map: display.texture, transparent: true, opacity: 0.96, depthWrite: false,
    })));
    panel.name = `${theme.englishTitle} animated environmental indicators`;
    panel.position.set(0, 4.08, -0.04);
    zone.add(panel);

    for (const x of [-2.75, 2.75]) {
      const sideLight = new Mesh(this.keepGeometry(new BoxGeometry(0.018, 1.2, 0.04)), glow);
      sideLight.position.set(x, 4.08, -0.01);
      zone.add(sideLight);
    }
  }

  private createPodArchitecture(zone: Group, theme: ZoneTheme, structure: Material, glow: Material): void {
    const glass = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#b5f5ee', emissive: theme.accent, emissiveIntensity: 0.1, transparent: true,
      opacity: 0.14, transmission: 0.82, thickness: 0.12, roughness: 0.16, metalness: 0.02, depthWrite: false,
      side: DoubleSide,
    }));
    // Keep the presentation footprint rotationally symmetrical. The former
    // half-cylinder/half-torus construction read as a broken ring from the
    // main aisle and left rotating previews without a clear safe boundary.
    const deck = new Mesh(this.keepGeometry(new CylinderGeometry(2.55, 2.75, 0.2, 64)), structure);
    deck.name = 'Lower-level holographic projection deck';
    deck.rotation.y = Math.PI / 2;
    deck.position.set(0, 0.12, 0.65);
    zone.add(deck);

    const glassShell = new Mesh(this.keepGeometry(new CylinderGeometry(2.35, 2.65, 2.75, 64, 1, true)), glass);
    glassShell.name = 'Transparent technical model shell';
    glassShell.rotation.y = Math.PI / 2;
    glassShell.position.set(0, 1.5, 0.4);
    zone.add(glassShell);

    for (const radius of [1.65, 2.3]) {
      const ring = new Mesh(this.keepGeometry(new TorusGeometry(radius, 0.025, 6, 72)), glow);
      ring.name = 'Pod projection boundary';
      ring.rotation.set(Math.PI / 2, 0, Math.PI / 2);
      ring.position.set(0, 0.27, 0.58);
      zone.add(ring);
    }

    const consoleGroup = new Group();
    consoleGroup.name = 'Interactive lower-level data surface';
    consoleGroup.position.set(0, 0.82, 2.05);
    consoleGroup.rotation.x = -0.42;
    const console = new Mesh(this.keepGeometry(new BoxGeometry(2.7, 0.78, 0.07)), glass);
    const consoleGlow = new Mesh(this.keepGeometry(new PlaneGeometry(2.42, 0.55)), this.keepMaterial(new MeshBasicMaterial({
      color: theme.accent, transparent: true, opacity: 0.23, blending: AdditiveBlending,
    })));
    consoleGlow.position.z = 0.045;
    consoleGroup.add(console, consoleGlow);
    for (let i = -3; i <= 3; i += 1) {
      const key = new Mesh(this.keepGeometry(new BoxGeometry(0.22, 0.025, 0.02)), glow);
      key.position.set(i * 0.31, -0.12 + Math.abs(i % 2) * 0.17, 0.075);
      consoleGroup.add(key);
    }
    zone.add(consoleGroup);
  }

  private createHologram(zone: Group, theme: ZoneTheme): void {
    const hologram = new Group();
    hologram.name = `${theme.englishTitle} floating holographic preview`;
    hologram.position.set(0, 2.25, 0.3);
    const material = this.keepMaterial(new MeshBasicMaterial({
      color: theme.accent, wireframe: true, transparent: true, opacity: 0.3,
      depthWrite: false, blending: AdditiveBlending,
    }));
    const solid = this.keepMaterial(new MeshPhysicalMaterial({
      color: theme.accent, emissive: theme.accent, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.055, roughness: 0.2, depthWrite: false,
    }));
    // A 1.35 m bounding radius leaves a generous margin inside the 2.35 m
    // shell at every rotation angle, including the floating animation.
    if (theme.motif === 'water') {
      this.createMvrHologram(hologram, material, solid);
    } else {
      const geometry = this.keepGeometry(theme.motif === 'circular'
        ? new TorusGeometry(1.05, 0.3, 10, 30)
        : theme.motif === 'energy'
          ? new SphereGeometry(1.08, 16, 10)
          : theme.motif === 'air'
            ? new TorusGeometry(1.0, 0.13, 7, 36)
            : new SphereGeometry(1.02, 12, 8));
      const form = new Mesh(geometry, solid);
      const wire = new Mesh(geometry, material);
      wire.scale.setScalar(1.015);
      hologram.add(form, wire);

      const edges = new LineSegments(this.keepGeometry(new EdgesGeometry(geometry, 18)), this.keepMaterial(new LineBasicMaterial({
        color: theme.accent, transparent: true, opacity: 0.42, blending: AdditiveBlending,
      })));
      edges.scale.setScalar(1.03);
      hologram.add(edges);
    }
    const projector = new Mesh(this.keepGeometry(new CylinderGeometry(0.08, 1.35, 2.8, 28, 1, true)), this.keepMaterial(new MeshBasicMaterial({
      color: theme.accent, transparent: true, opacity: 0.035, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
    })));
    projector.position.y = -1.18;
    hologram.add(projector);
    zone.add(hologram);
    this.holograms.push(hologram);
  }

  /** Lightweight showroom twin of the full MVR exhibit's plant silhouette. */
  private createMvrHologram(hologram: Group, wire: Material, fill: Material): void {
    const plant = new Group();
    plant.name = 'MVR process plant holographic silhouette';
    plant.scale.setScalar(0.72);
    plant.position.y = -0.05;

    const add = (geometry: BufferGeometry, position: readonly [number, number, number], material: Material = wire): Mesh => {
      const mesh = new Mesh(this.keepGeometry(geometry), material);
      mesh.position.set(...position);
      plant.add(mesh);
      return mesh;
    };

    // Two-level skid frame and platforms establish the characteristic plant
    // proportions without loading the detailed interactive exhibit model.
    for (const x of [-1.55, 0, 1.55]) {
      for (const z of [-0.65, 0.65]) add(new BoxGeometry(0.07, 2.5, 0.07), [x, 0, z]);
    }
    for (const y of [-1.15, 0, 1.15]) {
      for (const z of [-0.65, 0.65]) add(new BoxGeometry(3.2, 0.07, 0.07), [0, y, z]);
    }
    for (const y of [-0.05, 1.08]) add(new BoxGeometry(3.12, 0.045, 1.35), [0, y, 0], fill);

    // Evaporator, crystallizer and horizontal heat-exchanger barrels echo the
    // recognizable equipment grouping of the formal MVR exhibit.
    add(new CylinderGeometry(0.36, 0.36, 2.15, 14), [0.38, 0.05, -0.05]);
    add(new CylinderGeometry(0.34, 0.12, 0.42, 14), [0.38, -1.23, -0.05]);
    add(new CylinderGeometry(0.29, 0.29, 1.45, 14), [1.18, -0.35, 0.12]);
    for (const y of [-0.72, -0.25]) {
      const exchanger = add(new CylinderGeometry(0.16, 0.16, 1.08, 12), [-0.85, y, -0.2]);
      exchanger.rotation.z = Math.PI / 2;
    }

    // Orthogonal pipe runs remain legible in wireframe and reinforce the
    // industrial process-network reading at showroom viewing distance.
    const pipe = (length: number, position: readonly [number, number, number], axis: 'x' | 'y'): void => {
      const segment = add(new CylinderGeometry(0.035, 0.035, length, 7), position);
      if (axis === 'x') segment.rotation.z = Math.PI / 2;
    };
    pipe(1.9, [-0.55, 0.72, -0.35], 'x');
    pipe(1.55, [-1.48, 0, -0.35], 'y');
    pipe(1.05, [0.88, 0.92, 0.25], 'x');
    pipe(1.25, [1.38, 0.32, 0.25], 'y');
    hologram.add(plant);
  }

  private createLabelTexture(id: ShowroomZoneId, theme: ZoneTheme): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 360;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = theme.accent;
      context.fillRect(42, 43, 7, 238);
      context.font = '600 24px Arial, sans-serif';
      context.fillText(`${id}  //  LIVE DIGITAL TWIN`, 78, 72);
      context.fillStyle = '#eaffff';
      context.font = '600 62px Arial, sans-serif';
      context.fillText(theme.title, 76, 157);
      context.fillStyle = theme.accent;
      context.font = '500 31px Arial, sans-serif';
      context.fillText(theme.englishTitle, 78, 207);
      context.fillStyle = 'rgba(220,255,252,.64)';
      context.font = '400 23px Arial, sans-serif';
      context.fillText(theme.descriptor, 78, 257);
      context.textAlign = 'right';
      context.fillStyle = theme.accent;
      context.font = '500 25px Arial, sans-serif';
      context.fillText(theme.metric, 958, 257);
      context.strokeStyle = theme.accent;
      context.globalAlpha = 0.36;
      for (let x = 630; x < 960; x += 33) {
        const height = 40 + ((x / 33) % 5) * 13;
        context.strokeRect(x, 168 - height, 17, height);
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    return texture;
  }

  private createAtmosphere(): void {
    this.atmosphere.name = 'Restrained ambient data particles';
    const positions: number[] = [];
    // Deterministic distribution avoids visual popping between page loads and
    // keeps the central sightline almost entirely clear.
    for (let index = 0; index < 110; index += 1) {
      const angle = index * 2.399963;
      const radius = 4.5 + ((index * 37) % 100) / 100 * 9.2;
      positions.push(Math.cos(angle) * radius, 0.8 + ((index * 53) % 100) / 100 * 7.2, Math.sin(angle) * radius - 0.3);
    }
    const geometry = this.keepGeometry(new BufferGeometry());
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const material = this.keepMaterial(new PointsMaterial({
      color: '#7bded4', size: 0.025, transparent: true, opacity: 0.22,
      depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true,
    }));
    this.atmosphere.add(new Points(geometry, material));
    this.group.add(this.atmosphere);
  }

  private createDataDisplay(theme: ZoneTheme, phase: number): AnimatedDataDisplay {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 196;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create environmental data display.');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    const display = { texture, context, theme, phase };
    this.dataDisplays.push(display);
    this.drawDataDisplay(display, 0);
    return display;
  }

  private drawDataDisplay(display: AnimatedDataDisplay, elapsed: number): void {
    const { context, theme, phase } = display;
    const pulse = (Math.sin(elapsed * 1.25 + phase) + 1) * 0.5;
    context.clearRect(0, 0, 1024, 196);
    context.fillStyle = 'rgba(2, 18, 24, .88)';
    context.fillRect(0, 0, 1024, 196);
    context.strokeStyle = `${theme.accent}55`;
    context.lineWidth = 2;
    context.strokeRect(2, 2, 1020, 192);

    theme.indicators.forEach((indicator, index) => {
      const x = 30 + index * 325;
      context.fillStyle = 'rgba(220, 255, 252, .58)';
      context.font = '600 18px Arial, sans-serif';
      context.fillText(indicator.label, x, 38);
      context.fillStyle = '#efffff';
      context.font = '500 48px Arial, sans-serif';
      context.fillText(indicator.value, x, 94);
      context.fillStyle = theme.accent;
      context.font = '500 15px Arial, sans-serif';
      context.fillText(indicator.unit, x + 112, 91);

      context.fillStyle = 'rgba(140, 235, 225, .12)';
      context.fillRect(x, 126, 252, 8);
      const liveLevel = Math.min(1, indicator.level * (0.94 + pulse * 0.06));
      context.fillStyle = theme.accent;
      context.fillRect(x, 126, 252 * liveLevel, 8);
      context.fillStyle = `${theme.accent}99`;
      for (let sample = 0; sample < 18; sample += 1) {
        const wave = Math.sin(sample * 0.72 + elapsed * 1.8 + phase + index) * 8;
        context.fillRect(x + sample * 14, 163 + wave, 7, 2);
      }
    });
  }

  private keepGeometry<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private keepMaterial<T extends Material>(material: T): T {
    this.materials.push(material);
    return material;
  }
}
