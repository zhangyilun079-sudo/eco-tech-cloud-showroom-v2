import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
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
  /** Empty attachment point for a future Exhibit implementation. */
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
  readonly accentSoft: string;
  readonly panel: string;
  readonly metric: string;
  readonly motif: 'water' | 'circular' | 'energy' | 'air' | 'ecology';
}

const ZONE_THEMES: Readonly<Record<ShowroomZoneId, ZoneTheme>> = {
  ZONE_01: {
    title: '水环境治理', englishTitle: 'WATER ENVIRONMENT',
    descriptor: '工业废水 · 水资源循环 · 智慧水务',
    accent: '#25a9bd', accentSoft: '#91e1e4', panel: '#d9f1f1', metric: 'WATER LOOP  92%', motif: 'water',
  },
  ZONE_02: {
    title: '固体废弃物资源化利用', englishTitle: 'RESOURCE CIRCULATION',
    descriptor: '循环经济 · 废物资源化 · 再生技术',
    accent: '#42a56c', accentSoft: '#a9dfb9', panel: '#e0f1e6', metric: 'RECOVERY  86%', motif: 'circular',
  },
  ZONE_03: {
    title: '清洁能源', englishTitle: 'CLEAN ENERGY',
    descriptor: '氢能 · 可再生能源 · 低碳系统',
    accent: '#34a9a1', accentSoft: '#9ee4d9', panel: '#dff2ec', metric: 'CO₂ -68%', motif: 'energy',
  },
  ZONE_04: {
    title: '大气环境治理', englishTitle: 'AIR ENVIRONMENT',
    descriptor: '空气质量 · VOCs 治理 · 排放控制',
    accent: '#4a91ba', accentSoft: '#a9d6e8', panel: '#dfeef3', metric: 'AQI  32', motif: 'air',
  },
  ZONE_05: {
    title: '生态修复与智慧监测', englishTitle: 'ECO RESTORATION',
    descriptor: '生态修复 · 遥感 · 环境监测',
    accent: '#548f70', accentSoft: '#b0d9bf', panel: '#e2eee5', metric: 'ECO INDEX  78', motif: 'ecology',
  },
};

// These anchors are part of the showroom/exhibit contract. The architecture is
// arranged around them rather than moving exhibits when the shell changes.
const ZONE_LAYOUTS: readonly ZoneLayout[] = [
  { id: 'ZONE_01', position: [-8.4, 0, -8.25], rotation: 0 },
  { id: 'ZONE_02', position: [0, 0, -8.25], rotation: 0 },
  { id: 'ZONE_03', position: [8.4, 0, -8.25], rotation: 0 },
  { id: 'ZONE_04', position: [-12.25, 0, 1.25], rotation: Math.PI / 2 },
  { id: 'ZONE_05', position: [12.25, 0, 1.25], rotation: -Math.PI / 2 },
];

export class Showroom {
  public readonly group = new Group();
  public readonly zones: readonly ShowroomZone[];
  public readonly centralDataCore = new CentralDataCore();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private readonly sharedGeometries = new Map<string, BufferGeometry>();
  private zoneShellMaterial?: MeshPhysicalMaterial;

  public constructor() {
    this.group.name = 'Bright ecological technology exhibition centre';
    this.createFloorAndAtrium();
    this.createArchitecture();
    this.createEntrance();
    this.group.add(this.centralDataCore);
    this.zones = ZONE_LAYOUTS.map((layout) => this.createZone(layout));
  }

  public dispose(): void {
    this.centralDataCore.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  public update(delta: number): void {
    this.centralDataCore.update(delta);
  }

  private createFloorAndAtrium(): void {
    const floorMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: new Color('#edf2f1'),
      roughness: 0.26,
      metalness: 0.035,
      clearcoat: 0.62,
      clearcoatRoughness: 0.28,
    }));
    const floor = new Mesh(this.keepGeometry(new PlaneGeometry(31, 27)), floorMaterial);
    floor.name = 'Polished white exhibition floor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 0.75;
    floor.receiveShadow = true;
    this.group.add(floor);

    const atriumMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f9ffff', roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.2,
    }));
    const atrium = new Mesh(this.keepGeometry(new CircleGeometry(4.7, 72)), atriumMaterial);
    atrium.name = 'Central circular atrium floor';
    atrium.rotation.x = -Math.PI / 2;
    atrium.position.y = 0.025;
    atrium.receiveShadow = true;
    this.group.add(atrium);

    const accentMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#63d8d0', emissive: '#3abbb6', emissiveIntensity: 0.9, roughness: 0.22,
    }));
    const atriumEdge = new Mesh(this.keepGeometry(new RingGeometry(4.62, 4.76, 72)), accentMaterial);
    atriumEdge.name = 'Atrium technology inlay';
    atriumEdge.rotation.x = -Math.PI / 2;
    atriumEdge.position.y = 0.045;
    this.group.add(atriumEdge);
  }

  private createArchitecture(): void {
    const white = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f6f9f8', roughness: 0.38, metalness: 0.015, clearcoat: 0.24, clearcoatRoughness: 0.42,
    }));
    const frame = this.keepMaterial(new MeshStandardMaterial({
      color: '#b8d1d3', roughness: 0.28, metalness: 0.55,
    }));
    const glass = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#d7f4f3', roughness: 0.1, metalness: 0, transmission: 0.86,
      transparent: true, opacity: 0.2, thickness: 0.12, depthWrite: false, side: DoubleSide,
    }));
    const light = this.keepMaterial(new MeshStandardMaterial({
      color: '#eaffff', emissive: '#8cebe2', emissiveIntensity: 2.1, roughness: 0.18,
    }));

    // A glazed perimeter keeps the rear of the hall visually open while its
    // white structural piers give the five bays a corporate exhibition rhythm.
    this.createWindowWall(new Vector3(0, 4.2, -11.1), new Vector3(30, 8.4, 0.08), false, glass, frame, white);
    this.createWindowWall(new Vector3(-14.85, 4.2, 0), new Vector3(0.08, 8.4, 22), true, glass, frame, white);
    this.createWindowWall(new Vector3(14.85, 4.2, 0), new Vector3(0.08, 8.4, 22), true, glass, frame, white);

    const perimeterBeam = new Mesh(this.keepGeometry(new BoxGeometry(30.1, 0.32, 0.48)), white);
    perimeterBeam.name = 'Rear floating roof beam';
    perimeterBeam.position.set(0, 8.35, -10.9);
    perimeterBeam.castShadow = true;
    this.group.add(perimeterBeam);

    const roofRing = new Mesh(this.keepGeometry(new TorusGeometry(5.45, 0.17, 12, 96)), white);
    roofRing.name = 'Central atrium ceiling ring';
    roofRing.rotation.x = Math.PI / 2;
    roofRing.position.y = 8.25;
    roofRing.castShadow = true;
    this.group.add(roofRing);
    const luminousRing = new Mesh(this.keepGeometry(new TorusGeometry(4.95, 0.055, 8, 96)), light);
    luminousRing.name = 'Suspended circular daylight feature';
    luminousRing.rotation.x = Math.PI / 2;
    luminousRing.position.y = 8.08;
    this.group.add(luminousRing);

    const radialGeometry = this.keepGeometry(new BoxGeometry(0.16, 0.16, 9.3));
    for (let index = 0; index < 8; index += 1) {
      const beam = new Mesh(radialGeometry, frame);
      beam.name = 'Atrium radial roof member';
      beam.position.y = 8.27;
      beam.rotation.y = index * Math.PI / 4;
      beam.castShadow = true;
      this.group.add(beam);
    }
  }

  private createWindowWall(position: Vector3, size: Vector3, alongZ: boolean, glass: Material, frame: Material, white: Material): void {
    const pane = new Mesh(this.keepGeometry(new BoxGeometry(size.x, size.y, size.z)), glass);
    pane.name = 'Daylight glass curtain wall';
    pane.position.copy(position);
    this.group.add(pane);

    const verticalGeometry = this.keepGeometry(new BoxGeometry(alongZ ? 0.18 : 0.13, 8.4, alongZ ? 0.13 : 0.18));
    const divisions = alongZ ? 5 : 7;
    const span = alongZ ? size.z : size.x;
    for (let index = 0; index <= divisions; index += 1) {
      const offset = -span / 2 + index * span / divisions;
      const mullion = new Mesh(verticalGeometry, index === 0 || index === divisions ? white : frame);
      mullion.name = 'Curtain wall mullion';
      mullion.position.copy(position);
      if (alongZ) mullion.position.z += offset;
      else mullion.position.x += offset;
      mullion.castShadow = true;
      this.group.add(mullion);
    }
    const horizontal = new Mesh(
      this.keepGeometry(new BoxGeometry(alongZ ? 0.14 : size.x, 0.12, alongZ ? size.z : 0.14)),
      frame,
    );
    horizontal.name = 'Curtain wall transom';
    horizontal.position.copy(position);
    this.group.add(horizontal);
  }

  private createEntrance(): void {
    const stepMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f5f8f7', roughness: 0.36, clearcoat: 0.32,
    }));
    for (let index = 0; index < 3; index += 1) {
      const step = new Mesh(
        this.keepGeometry(new BoxGeometry(10.5 - index * 0.55, 0.14, 1.15)),
        stepMaterial,
      );
      step.name = `Entrance approach step ${index + 1}`;
      step.position.set(0, -0.28 + index * 0.14, 13.55 - index * 0.86);
      step.receiveShadow = true;
      this.group.add(step);
    }

    const railFrame = this.keepMaterial(new MeshStandardMaterial({
      color: '#94b8bd', roughness: 0.2, metalness: 0.7,
    }));
    const railGlass = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#c8f5f5', roughness: 0.05, transmission: 0.75,
      transparent: true, opacity: 0.25, depthWrite: false, side: DoubleSide,
    }));
    const guidanceMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#bceee5', emissive: '#55bfb1', emissiveIntensity: 0.38, roughness: 0.34,
    }));
    const guidanceGeometry = this.keepGeometry(new BoxGeometry(0.055, 0.018, 5.8));
    for (const x of [-1.35, 1.35]) {
      const guide = new Mesh(guidanceGeometry, guidanceMaterial);
      guide.name = 'Entrance guidance inlay';
      guide.position.set(x, 0.018, 9.35);
      this.group.add(guide);
    }

    for (const x of [-5.5, 5.5]) {
      const railing = new Group();
      railing.name = 'Foreground glass balustrade';
      railing.position.set(x, 0, 10.6);
      const pane = new Mesh(this.keepGeometry(new BoxGeometry(3.8, 1.05, 0.055)), railGlass);
      pane.position.y = 0.62;
      railing.add(pane);
      const cap = new Mesh(this.keepGeometry(new BoxGeometry(3.9, 0.055, 0.1)), railFrame);
      cap.position.y = 1.17;
      railing.add(cap);
      for (const postX of [-1.9, 1.9]) {
        const post = new Mesh(this.keepGeometry(new BoxGeometry(0.07, 1.18, 0.07)), railFrame);
        post.position.set(postX, 0.59, 0);
        railing.add(post);
      }
      this.group.add(railing);
    }
  }

  private createZone(layout: ZoneLayout): ShowroomZone {
    const zone = new Group();
    zone.name = layout.id;
    zone.position.set(...layout.position);
    zone.rotation.y = layout.rotation;

    const shell = this.zoneShellMaterial ??= this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f8faf9', roughness: 0.36, clearcoat: 0.3, clearcoatRoughness: 0.4,
    }));
    const theme = ZONE_THEMES[layout.id];
    const inset = this.keepMaterial(new MeshStandardMaterial({
      color: theme.panel, roughness: 0.5, metalness: 0.04,
    }));
    const trim = this.keepMaterial(new MeshStandardMaterial({
      color: theme.accent, roughness: 0.24, metalness: 0.68,
    }));
    const light = this.keepMaterial(new MeshStandardMaterial({
      color: theme.accentSoft, emissive: theme.accent, emissiveIntensity: 0.52, roughness: 0.2,
    }));

    this.createExhibitionBay(zone, shell, inset, trim, light, layout.id, theme);
    this.createTitleMarker(zone, layout.id, theme);
    this.createDataDisplay(zone, theme, trim, light);
    this.createTechnologyMotif(zone, theme, trim, light);

    // Local transform intentionally matches the original attachment contract.
    const exhibitPlaceholder = new Group();
    exhibitPlaceholder.name = `${layout.id} exhibit placeholder`;
    exhibitPlaceholder.position.set(0, 0.4, 1.45);
    exhibitPlaceholder.userData.zoneId = layout.id;
    exhibitPlaceholder.userData.isHotspot = true;
    zone.add(exhibitPlaceholder);

    this.group.add(zone);
    const hotspotPosition = exhibitPlaceholder.getWorldPosition(new Vector3());
    return { id: layout.id, position: zone.position.clone(), hotspotPosition, exhibitPlaceholder };
  }

  private createExhibitionBay(zone: Group, shell: Material, inset: Material, trim: Material, light: Material, id: ShowroomZoneId, theme: ZoneTheme): void {
    const back = new Mesh(this.sharedGeometry('zone-wall', () => new BoxGeometry(5.15, 3.45, 0.16)), shell);
    back.name = `${id} white exhibition wall`;
    back.position.set(0, 1.82, 0);
    back.receiveShadow = true;
    zone.add(back);

    const insetPanel = new Mesh(this.sharedGeometry('zone-inset', () => new BoxGeometry(4.45, 1.72, 0.035)), inset);
    insetPanel.name = `${id} integrated display backdrop`;
    insetPanel.position.set(0, 1.45, 0.1);
    zone.add(insetPanel);

    const featurePanel = new Mesh(
      this.sharedGeometry('zone-feature', () => new PlaneGeometry(4.08, 1.4)),
      this.keepMaterial(new MeshStandardMaterial({ color: theme.panel, roughness: 0.42 })),
    );
    featurePanel.name = `${id} themed ecological background wall`;
    featurePanel.position.set(0, 1.46, 0.124);
    zone.add(featurePanel);

    const uprightGeometry = this.sharedGeometry('zone-upright', () => new BoxGeometry(0.16, 3.7, 0.38));
    for (const x of [-2.65, 2.65]) {
      const upright = new Mesh(uprightGeometry, shell);
      upright.position.set(x, 1.85, 0.28);
      upright.castShadow = true;
      zone.add(upright);
    }
    const canopy = new Mesh(this.sharedGeometry('zone-canopy', () => new BoxGeometry(5.46, 0.2, 0.72)), shell);
    canopy.name = `${id} floating exhibition canopy`;
    canopy.position.set(0, 3.7, 0.45);
    canopy.castShadow = true;
    zone.add(canopy);

    const titleBand = new Mesh(this.sharedGeometry('zone-title-band', () => new BoxGeometry(4.25, 0.78, 0.09)), trim);
    titleBand.name = `${id} integrated title band`;
    titleBand.position.set(0, 2.92, 0.12);
    zone.add(titleBand);
    const displayLight = new Mesh(this.sharedGeometry('zone-display-light', () => new BoxGeometry(3.85, 0.045, 0.08)), light);
    displayLight.name = `${id} integrated display light`;
    displayLight.position.set(0, 2.3, 0.17);
    zone.add(displayLight);

    const platform = new Mesh(this.sharedGeometry('zone-platform', () => new CylinderGeometry(1.7, 1.82, 0.28, 48)), shell);
    platform.name = `${id} raised presentation platform`;
    platform.position.set(0, 0.15, 1.45);
    platform.castShadow = true;
    platform.receiveShadow = true;
    zone.add(platform);
    const platformAccent = new Mesh(this.sharedGeometry('zone-platform-accent', () => new TorusGeometry(1.69, 0.035, 8, 48)), light);
    platformAccent.rotation.x = Math.PI / 2;
    platformAccent.position.set(0, 0.3, 1.45);
    zone.add(platformAccent);
  }

  private createTitleMarker(zone: Group, id: ShowroomZoneId, theme: ZoneTheme): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f5ffff';
    context.font = '600 52px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(theme.title, canvas.width / 2, 69);
    context.fillStyle = '#c9eeee';
    context.font = '500 21px Arial, sans-serif';
    context.fillText(`${id}  /  ${theme.englishTitle}`, canvas.width / 2, 132);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    const material = this.keepMaterial(new MeshStandardMaterial({
      map: texture, transparent: true, roughness: 0.35, metalness: 0.02,
    }));
    const marker = new Mesh(this.sharedGeometry('zone-title', () => new PlaneGeometry(4.05, 0.76)), material);
    marker.name = `${id} title marker`;
    marker.position.set(0, 2.92, 0.18);
    zone.add(marker);
  }

  private createDataDisplay(zone: Group, theme: ZoneTheme, trim: Material, light: Material): void {
    const display = new Group();
    display.name = `${zone.name} environmental data visualization`;
    display.position.set(1.42, 1.47, 0.155);

    const baseline = new Mesh(this.sharedGeometry('data-baseline', () => new BoxGeometry(1.02, 0.025, 0.025)), trim);
    baseline.position.set(0, -0.42, 0);
    display.add(baseline);
    const values = [0.3, 0.56, 0.43, 0.78, 0.65, 0.92];
    values.forEach((value, index) => {
      const bar = new Mesh(this.keepGeometry(new BoxGeometry(0.095, value, 0.028)), index === 5 ? light : trim);
      bar.position.set(-0.43 + index * 0.17, -0.41 + value / 2, 0.005);
      display.add(bar);
    });

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = theme.accent;
      context.font = '600 32px Arial, sans-serif';
      context.textAlign = 'center';
      context.fillText(theme.metric, 256, 45);
      context.fillStyle = '#527276';
      context.font = '500 21px "Noto Sans SC", sans-serif';
      context.fillText(theme.descriptor, 256, 94);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      this.textures.push(texture);
      const label = new Mesh(
        this.sharedGeometry('data-label', () => new PlaneGeometry(1.55, 0.39)),
        this.keepMaterial(new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.45 })),
      );
      label.position.set(-0.15, 0.52, 0.012);
      display.add(label);
    }
    zone.add(display);
  }

  private createTechnologyMotif(zone: Group, theme: ZoneTheme, trim: Material, light: Material): void {
    const motif = new Group();
    motif.name = `${zone.name} ${theme.motif} technology motif`;
    motif.position.set(-1.42, 1.52, 0.17);

    if (theme.motif === 'water') {
      for (let index = 0; index < 3; index += 1) {
        const loop = new Mesh(this.keepGeometry(new TorusGeometry(0.22 + index * 0.14, 0.025, 8, 32, Math.PI * 1.5)), index === 2 ? light : trim);
        loop.rotation.z = -Math.PI / 4;
        motif.add(loop);
      }
    } else if (theme.motif === 'circular') {
      const loop = new Mesh(this.keepGeometry(new TorusGeometry(0.52, 0.045, 8, 40, Math.PI * 1.72)), trim);
      loop.rotation.z = 0.15;
      motif.add(loop);
      for (const angle of [0.15, 2.3, 4.5]) {
        const node = new Mesh(this.keepGeometry(new BoxGeometry(0.16, 0.16, 0.06)), light);
        node.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0);
        node.rotation.z = angle;
        motif.add(node);
      }
    } else if (theme.motif === 'energy') {
      const nodeGeometry = this.keepGeometry(new CylinderGeometry(0.09, 0.09, 0.07, 20));
      const positions: readonly [number, number][] = [[-0.46, -0.15], [0, 0.42], [0.48, -0.1], [0, -0.48]];
      positions.forEach(([x, y]) => {
        const node = new Mesh(nodeGeometry, light);
        node.rotation.x = Math.PI / 2;
        node.position.set(x, y, 0);
        motif.add(node);
      });
      [[-0.23, 0.135, -0.72], [0.24, 0.16, 0.68], [0.24, -0.29, -0.83], [-0.23, -0.315, 0.84]].forEach(([x, y, angle]) => {
        const link = new Mesh(this.keepGeometry(new BoxGeometry(0.64, 0.035, 0.035)), trim);
        link.position.set(x, y, -0.01);
        link.rotation.z = angle;
        motif.add(link);
      });
    } else if (theme.motif === 'air') {
      [0.72, 0.92, 0.62].forEach((width, index) => {
        const stream = new Mesh(this.keepGeometry(new TorusGeometry(width / 2, 0.025, 6, 28, Math.PI)), index === 1 ? light : trim);
        stream.scale.y = 0.3;
        stream.position.set(-0.12 + index * 0.11, 0.3 - index * 0.3, 0);
        stream.rotation.z = index % 2 ? Math.PI : 0;
        motif.add(stream);
      });
    } else {
      const gridGeometry = this.keepGeometry(new BoxGeometry(0.025, 1.12, 0.025));
      for (let index = -2; index <= 2; index += 1) {
        const vertical = new Mesh(gridGeometry, index === 0 ? light : trim);
        vertical.position.x = index * 0.22;
        motif.add(vertical);
        const horizontal = new Mesh(gridGeometry, trim);
        horizontal.rotation.z = Math.PI / 2;
        horizontal.position.y = index * 0.22;
        motif.add(horizontal);
      }
      const scan = new Mesh(this.keepGeometry(new RingGeometry(0.23, 0.28, 32)), light);
      scan.position.z = 0.025;
      motif.add(scan);
    }
    zone.add(motif);
  }

  private sharedGeometry<T extends BufferGeometry>(key: string, create: () => T): T {
    const existing = this.sharedGeometries.get(key);
    if (existing) return existing as T;
    const geometry = this.keepGeometry(create());
    this.sharedGeometries.set(key, geometry);
    return geometry;
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
