import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
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

// Every bay retains the same local exhibit/hotspot attachment contract. Their
// parent anchors sit at the perimeter so the centre reads as circulation space.
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
  private readonly sharedGeometries = new Map<string, BufferGeometry>();
  private zoneShellMaterial?: MeshPhysicalMaterial;

  public constructor() {
    this.group.name = 'Bright ecological technology exhibition centre';
    this.createFloorAndAtrium();
    this.createArchitecture();
    this.createEntrance();
    this.createHumanScaleFurnishings();
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
    const atrium = new Mesh(this.keepGeometry(new CylinderGeometry(5.35, 5.5, 0.24, 72)), atriumMaterial);
    atrium.name = 'Raised central circular presentation platform';
    atrium.position.y = 0.1;
    atrium.receiveShadow = true;
    this.group.add(atrium);

    const accentMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#63d8d0', emissive: '#3abbb6', emissiveIntensity: 0.9, roughness: 0.22,
    }));
    const atriumEdge = new Mesh(this.keepGeometry(new RingGeometry(5.25, 5.48, 72)), accentMaterial);
    atriumEdge.name = 'Atrium technology inlay';
    atriumEdge.rotation.x = -Math.PI / 2;
    atriumEdge.position.y = 0.235;
    this.group.add(atriumEdge);

    const innerInlay = new Mesh(this.keepGeometry(new RingGeometry(3.65, 3.72, 72)), accentMaterial);
    innerInlay.name = 'Central platform hierarchy inlay';
    innerInlay.rotation.x = -Math.PI / 2;
    innerInlay.position.y = 0.238;
    this.group.add(innerInlay);

    // A broad, flush circulation loop makes the intended visitor route legible
    // without introducing rails or walls around the central gathering space.
    const routeMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#c3dedb', roughness: 0.52, metalness: 0.05,
      transparent: true, opacity: 0.72,
    }));
    for (const [inner, outer] of [[6.35, 6.43], [8.05, 8.11]] as const) {
      const route = new Mesh(this.keepGeometry(new RingGeometry(inner, outer, 96)), routeMaterial);
      route.name = 'Flush circular visitor circulation marker';
      route.rotation.x = -Math.PI / 2;
      route.position.y = 0.012;
      this.group.add(route);
    }

    // The uninterrupted entrance spine leads directly to the data core. It is
    // deliberately floor-only so the arrival view stays completely open.
    const arrivalSpine = new Mesh(this.keepGeometry(new PlaneGeometry(2.9, 8.2)), routeMaterial);
    arrivalSpine.name = 'Open entrance circulation spine';
    arrivalSpine.rotation.x = -Math.PI / 2;
    arrivalSpine.position.set(0, 0.014, 8.55);
    this.group.add(arrivalSpine);
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
    this.createDistantEnvironment();
    this.createWindowWall(new Vector3(0, 4.75, -11.7), new Vector3(30, 9.5, 0.08), false, glass, frame, white);
    this.createWindowWall(new Vector3(-14.85, 4.75, -0.35), new Vector3(0.08, 9.5, 22.7), true, glass, frame, white);
    this.createWindowWall(new Vector3(14.85, 4.75, -0.35), new Vector3(0.08, 9.5, 22.7), true, glass, frame, white);

    const perimeterBeam = new Mesh(this.keepGeometry(new BoxGeometry(30.1, 0.32, 0.48)), white);
    perimeterBeam.name = 'Rear floating roof beam';
    perimeterBeam.position.set(0, 9.35, -11.48);
    perimeterBeam.castShadow = true;
    this.group.add(perimeterBeam);

    const roofRing = new Mesh(this.keepGeometry(new TorusGeometry(5.45, 0.17, 12, 96)), white);
    roofRing.name = 'Central atrium ceiling ring';
    roofRing.rotation.x = Math.PI / 2;
    roofRing.position.y = 9.08;
    roofRing.castShadow = true;
    this.group.add(roofRing);
    const luminousRing = new Mesh(this.keepGeometry(new TorusGeometry(4.95, 0.055, 8, 96)), light);
    luminousRing.name = 'Suspended circular daylight feature';
    luminousRing.rotation.x = Math.PI / 2;
    luminousRing.position.y = 8.9;
    this.group.add(luminousRing);

    const radialGeometry = this.keepGeometry(new BoxGeometry(0.16, 0.16, 9.3));
    for (let index = 0; index < 8; index += 1) {
      const beam = new Mesh(radialGeometry, frame);
      beam.name = 'Atrium radial roof member';
      beam.position.y = 9.12;
      beam.rotation.y = index * Math.PI / 4;
      beam.castShadow = true;
      this.group.add(beam);
    }

    this.createUpperGallery(white, frame, glass, light);
    this.createLayeredCeiling(white, frame, light);
  }

  private createWindowWall(position: Vector3, size: Vector3, alongZ: boolean, glass: Material, frame: Material, white: Material): void {
    const pane = new Mesh(this.keepGeometry(new BoxGeometry(size.x, size.y, size.z)), glass);
    pane.name = 'Daylight glass curtain wall';
    pane.position.copy(position);
    this.group.add(pane);

    const verticalGeometry = this.keepGeometry(new BoxGeometry(alongZ ? 0.2 : 0.14, size.y, alongZ ? 0.14 : 0.2));
    const divisions = alongZ ? 8 : 12;
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
    const transomGeometry = this.keepGeometry(new BoxGeometry(alongZ ? 0.14 : size.x, 0.11, alongZ ? size.z : 0.14));
    for (const y of [1.05, 3.25, 5.5, 7.75, 9.43]) {
      const horizontal = new Mesh(transomGeometry, frame);
      horizontal.name = 'Curtain wall architectural transom';
      horizontal.position.copy(position);
      horizontal.position.y = y;
      this.group.add(horizontal);
    }
  }

  private createUpperGallery(white: Material, frame: Material, glass: Material, light: Material): void {
    const gallery = new Group();
    gallery.name = 'Second level circular gallery';

    const deck = new Mesh(this.keepGeometry(new RingGeometry(10.35, 13.55, 96, 1, 0, Math.PI)), white);
    deck.name = 'Curved upper gallery walkway';
    deck.rotation.x = -Math.PI / 2;
    deck.position.y = 4.45;
    deck.castShadow = true;
    deck.receiveShadow = true;
    gallery.add(deck);

    // A visible soffit and edge beams give the balcony credible structural
    // depth instead of allowing it to read as a floating plane.
    const soffit = new Mesh(this.keepGeometry(new RingGeometry(10.42, 13.48, 96, 1, 0, Math.PI)), white);
    soffit.name = 'Gallery deep structural soffit';
    soffit.rotation.x = -Math.PI / 2;
    soffit.position.y = 4.12;
    soffit.castShadow = true;
    gallery.add(soffit);
    for (const radius of [10.38, 13.5]) {
      const edgeBeam = new Mesh(this.keepGeometry(new TorusGeometry(radius, 0.22, 10, 96, Math.PI)), white);
      edgeBeam.name = 'Gallery curved structural edge beam';
      edgeBeam.rotation.x = -Math.PI / 2;
      edgeBeam.position.y = 4.25;
      gallery.add(edgeBeam);
    }

    // This recessed wall and lighting turn the upper circulation route into
    // a usable inner gallery rather than just a balustrade.
    const innerWall = new Mesh(this.keepGeometry(new BoxGeometry(18.5, 2.65, 0.24)), white);
    innerWall.name = 'Upper gallery inner exhibition wall';
    innerWall.position.set(0, 5.75, -10.95);
    innerWall.castShadow = true;
    gallery.add(innerWall);
    const galleryLightGeometry = this.keepGeometry(new BoxGeometry(2.05, 0.055, 0.16));
    for (const x of [-7.4, -4.45, -1.5, 1.5, 4.45, 7.4]) {
      const fixture = new Mesh(galleryLightGeometry, light);
      fixture.name = 'Upper gallery integrated ceiling light';
      fixture.position.set(x, 7.02, -10.72);
      gallery.add(fixture);
    }

    const fascia = new Mesh(this.keepGeometry(new TorusGeometry(10.38, 0.16, 8, 72, Math.PI)), frame);
    fascia.name = 'Gallery inner metallic fascia';
    fascia.rotation.x = -Math.PI / 2;
    fascia.position.y = 4.38;
    gallery.add(fascia);
    const underlight = new Mesh(this.keepGeometry(new TorusGeometry(11.55, 0.045, 6, 72, Math.PI)), light);
    underlight.name = 'Gallery integrated under-light';
    underlight.rotation.x = -Math.PI / 2;
    underlight.position.y = 4.28;
    gallery.add(underlight);

    const postGeometry = this.keepGeometry(new BoxGeometry(0.075, 1.25, 0.075));
    const paneGeometry = this.keepGeometry(new BoxGeometry(1.7, 1.02, 0.045));
    const supportGeometry = this.keepGeometry(new CylinderGeometry(0.14, 0.19, 4.42, 12));
    const segments = 16;
    for (let index = 0; index <= segments; index += 1) {
      const angle = Math.PI + index * Math.PI / segments;
      const radius = 10.25;
      const post = new Mesh(postGeometry, frame);
      post.name = 'Gallery glass railing post';
      post.position.set(Math.cos(angle) * radius, 5.04, Math.sin(angle) * radius);
      gallery.add(post);
      if (index < segments) {
        const midAngle = angle + Math.PI / segments / 2;
        const pane = new Mesh(paneGeometry, glass);
        pane.name = 'Gallery transparent glass railing';
        pane.position.set(Math.cos(midAngle) * radius, 5.02, Math.sin(midAngle) * radius);
        pane.rotation.y = -midAngle - Math.PI / 2;
        gallery.add(pane);
      }
      if (index % 2 === 0) {
        const supportRadius = 13.15;
        const support = new Mesh(supportGeometry, frame);
        support.name = 'Gallery structural column';
        support.position.set(Math.cos(angle) * supportRadius, 2.2, Math.sin(angle) * supportRadius);
        support.castShadow = true;
        gallery.add(support);
      }
    }
    this.group.add(gallery);
  }

  private createLayeredCeiling(white: Material, frame: Material, light: Material): void {
    const ceiling = new Group();
    ceiling.name = 'Layered circular exhibition ceiling';
    const rings: readonly [number, number, number, Material][] = [
      [7.2, 0.16, 9.18, frame], [9.25, 0.25, 9.38, white], [11.65, 0.12, 9.52, frame],
      [6.35, 0.055, 8.98, light], [8.35, 0.06, 9.18, light], [10.45, 0.055, 9.34, light],
    ];
    rings.forEach(([radius, tube, y, material], index) => {
      const ring = new Mesh(this.keepGeometry(new TorusGeometry(radius, tube, 8, 96)), material);
      ring.name = index < 3 ? 'Layered metallic ceiling ring' : 'Architectural ceiling light ring';
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      ceiling.add(ring);
    });
    const hangerGeometry = this.keepGeometry(new CylinderGeometry(0.035, 0.035, 0.7, 8));
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6;
      const hanger = new Mesh(hangerGeometry, frame);
      hanger.name = 'Ceiling ring suspension rod';
      hanger.position.set(Math.cos(angle) * 8.35, 9.52, Math.sin(angle) * 8.35);
      ceiling.add(hanger);
    }
    this.group.add(ceiling);
  }

  private createDistantEnvironment(): void {
    const landscape = this.keepMaterial(new MeshStandardMaterial({
      color: '#a9cfc8', transparent: true, opacity: 0.34, roughness: 0.9, depthWrite: false,
    }));
    const skylineGeometry = this.keepGeometry(new BoxGeometry(1, 1, 0.12));
    const heights = [1.6, 2.4, 1.9, 3.1, 2.2, 1.5, 2.8, 1.8, 2.5, 1.4, 2.9, 2];
    heights.forEach((height, index) => {
      const block = new Mesh(skylineGeometry, landscape);
      block.name = 'Distant campus silhouette';
      block.scale.set(1.7 + (index % 3) * 0.35, height, 1);
      block.position.set(-13.6 + index * 2.45, height / 2, -13.5 - (index % 2) * 0.3);
      this.group.add(block);
    });
  }

  private createEntrance(): void {
    const stepMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f5f8f7', roughness: 0.36, clearcoat: 0.32,
    }));
    for (let index = 0; index < 5; index += 1) {
      const step = new Mesh(
        this.keepGeometry(new BoxGeometry(12.2 - index * 0.55, 0.13, 1.05)),
        stepMaterial,
      );
      step.name = `Entrance approach step ${index + 1}`;
      step.position.set(0, -0.52 + index * 0.13, 14.25 - index * 0.78);
      step.receiveShadow = true;
      this.group.add(step);
    }

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

    const threshold = new Mesh(this.keepGeometry(new RingGeometry(0.58, 0.64, 48)), guidanceMaterial);
    threshold.name = 'Subtle entrance orientation marker';
    threshold.rotation.x = -Math.PI / 2;
    threshold.position.set(0, 0.022, 11.55);
    this.group.add(threshold);
  }

  private createHumanScaleFurnishings(): void {
    const bodyMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#66868a', roughness: 0.78, transparent: true, opacity: 0.58,
    }));
    // Sparse, low-contrast figures establish scale along the perimeter while
    // keeping the entrance and the central sightline empty.
    const visitorPositions: readonly [number, number, number, number][] = [
      [-9.6, 0, -4.1, 0.15], [7.4, 0, -6.1, -0.35], [-11.8, 4.48, -5.8, 0.45],
      [10.7, 0, -3.8, -0.5], [-7.6, 0, 1.9, 0.2],
    ];
    visitorPositions.forEach(([x, y, z, rotation], index) => {
      const visitor = new Group();
      visitor.name = `Distant visitor scale silhouette ${index + 1}`;
      const body = new Mesh(this.sharedGeometry('visitor-body', () => new CylinderGeometry(0.2, 0.29, 1.15, 10)), bodyMaterial);
      body.position.y = 0.78;
      visitor.add(body);
      const head = new Mesh(this.sharedGeometry('visitor-head', () => new SphereGeometry(0.2, 12, 8)), bodyMaterial);
      head.position.y = 1.55;
      visitor.add(head);
      visitor.position.set(x, y, z);
      visitor.rotation.y = rotation;
      this.group.add(visitor);
    });
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
    this.createZoneTechnologyDisplay(zone, layout.id, theme, trim, light);

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

  /**
   * Permanent, non-interactive context models that make every bay read as a
   * technology exhibition at hall scale. These deliberately remain separate
   * from the exhibit placeholder and the interactive MVR exhibit contract.
   */
  private createZoneTechnologyDisplay(zone: Group, id: ShowroomZoneId, theme: ZoneTheme, trim: Material, light: Material): void {
    const display = new Group();
    display.name = `${id} permanent technology exhibition display`;
    display.position.set(0, 0.31, 1.43);

    const steel = this.keepMaterial(new MeshStandardMaterial({ color: '#53666a', roughness: 0.28, metalness: 0.82 }));
    const brushedMetal = this.keepMaterial(new MeshStandardMaterial({ color: '#a9babd', roughness: 0.3, metalness: 0.72 }));
    const darkMetal = this.keepMaterial(new MeshStandardMaterial({ color: '#26383d', roughness: 0.32, metalness: 0.76 }));
    const glass = this.keepMaterial(new MeshPhysicalMaterial({
      color: theme.accentSoft, roughness: 0.08, metalness: 0.05, transmission: 0.58,
      transparent: true, opacity: 0.52, thickness: 0.08, depthWrite: false,
    }));
    const screen = this.keepMaterial(new MeshStandardMaterial({
      color: '#153d45', emissive: theme.accent, emissiveIntensity: 0.9, roughness: 0.18,
    }));
    const greenery = this.keepMaterial(new MeshStandardMaterial({ color: '#4e8b63', roughness: 0.82 }));

    if (id === 'ZONE_01') this.createWaterTreatmentDisplay(display, steel, brushedMetal, glass, screen, trim, light);
    else if (id === 'ZONE_02') this.createResourceRecoveryDisplay(display, steel, darkMetal, glass, greenery, trim, light);
    else if (id === 'ZONE_03') this.createCleanEnergyDisplay(display, steel, brushedMetal, glass, screen, trim, light);
    else if (id === 'ZONE_04') this.createAirTreatmentDisplay(display, steel, brushedMetal, glass, screen, trim, light);
    else this.createEcologicalRestorationDisplay(display, steel, glass, screen, greenery, trim, light);

    display.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    zone.add(display);
  }

  private createWaterTreatmentDisplay(display: Group, steel: Material, metal: Material, glass: Material, screen: Material, trim: Material, light: Material): void {
    const skid = new Mesh(this.keepGeometry(new BoxGeometry(3.25, 0.12, 1.5)), steel);
    skid.name = 'MVR process skid';
    skid.position.y = 0.05;
    display.add(skid);

    // Tall evaporator and separator vessels form the unmistakable MVR silhouette.
    const vesselGeometry = this.keepGeometry(new CylinderGeometry(0.31, 0.36, 1.9, 20));
    for (const [x, height] of [[-0.9, 1], [-0.25, 0.78]] as const) {
      const vessel = new Mesh(vesselGeometry, metal);
      vessel.name = 'MVR stainless steel evaporation vessel';
      vessel.scale.y = height;
      vessel.position.set(x, 0.18 + 0.95 * height, -0.12);
      display.add(vessel);
      const sightGlass = new Mesh(this.keepGeometry(new BoxGeometry(0.12, 0.58 * height, 0.045)), glass);
      sightGlass.position.set(x, vessel.position.y, 0.22);
      display.add(sightGlass);
    }
    const tankGeometry = this.keepGeometry(new CylinderGeometry(0.4, 0.4, 0.62, 20));
    for (const x of [0.56, 1.22]) {
      const tank = new Mesh(tankGeometry, metal);
      tank.name = 'Wastewater balance tank';
      tank.position.set(x, 0.43, 0.28);
      display.add(tank);
      const rim = new Mesh(this.keepGeometry(new TorusGeometry(0.4, 0.035, 7, 24)), trim);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 0.75, 0.28);
      display.add(rim);
    }
    this.addPipe(display, [-1.48, 1.62, -0.35], [1.48, 1.62, -0.35], 0.055, trim, 'MVR overhead process pipe');
    this.addPipe(display, [-1.15, 0.82, 0.53], [1.38, 0.82, 0.53], 0.045, light, 'MVR illuminated water loop');
    for (const x of [-1.5, -0.75, 0, 0.75, 1.5]) {
      this.addPipe(display, [x, 0.12, -0.62], [x, 1.78, -0.62], 0.035, steel, 'MVR steel support upright');
    }
    const compressor = new Mesh(this.keepGeometry(new TorusGeometry(0.3, 0.12, 10, 28)), steel);
    compressor.name = 'MVR vapour compressor silhouette';
    compressor.position.set(0.47, 1.28, -0.17);
    compressor.rotation.y = Math.PI / 2;
    display.add(compressor);
    this.addControlCabinet(display, 1.48, 0.48, -0.38, steel, screen, light, 'MVR process control cabinet');
  }

  private createResourceRecoveryDisplay(display: Group, steel: Material, darkMetal: Material, glass: Material, greenery: Material, trim: Material, light: Material): void {
    const base = new Mesh(this.keepGeometry(new BoxGeometry(3.3, 0.1, 1.5)), steel);
    base.position.y = 0.04;
    display.add(base);
    const conveyor = new Group();
    conveyor.name = 'Material sorting conveyor';
    conveyor.rotation.y = -0.13;
    const belt = new Mesh(this.keepGeometry(new BoxGeometry(2.45, 0.13, 0.55)), darkMetal);
    belt.position.y = 0.62;
    conveyor.add(belt);
    for (const x of [-1.05, -0.52, 0, 0.52, 1.05]) {
      const roller = new Mesh(this.keepGeometry(new CylinderGeometry(0.1, 0.1, 0.62, 12)), trim);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(x, 0.68, 0);
      conveyor.add(roller);
    }
    for (const x of [-1.08, 1.08]) this.addPipe(conveyor, [x, 0.08, -0.2], [x, 0.58, -0.2], 0.035, steel, 'Conveyor support');
    conveyor.position.set(-0.28, 0, 0.15);
    display.add(conveyor);
    const hopper = new Mesh(this.keepGeometry(new CylinderGeometry(0.55, 0.25, 0.78, 4)), glass);
    hopper.name = 'Recycling feed hopper';
    hopper.position.set(-1.12, 1.13, -0.18);
    hopper.rotation.y = Math.PI / 4;
    display.add(hopper);
    const processor = new Mesh(this.keepGeometry(new BoxGeometry(0.85, 1.18, 0.85)), steel);
    processor.name = 'Enclosed resource processing module';
    processor.position.set(1.08, 0.68, -0.18);
    display.add(processor);
    const window = new Mesh(this.keepGeometry(new BoxGeometry(0.55, 0.45, 0.04)), glass);
    window.position.set(1.08, 0.78, 0.265);
    display.add(window);
    for (const [x, z, material] of [[0.75, 0.58, greenery], [1.15, 0.58, trim], [1.5, 0.58, light]] as const) {
      const bale = new Mesh(this.keepGeometry(new BoxGeometry(0.3, 0.28, 0.32)), material);
      bale.name = 'Recovered material bale';
      bale.position.set(x, 0.25, z);
      display.add(bale);
    }
    const circulation = new Mesh(this.keepGeometry(new TorusGeometry(0.48, 0.06, 8, 36, Math.PI * 1.72)), light);
    circulation.name = 'Resource circulation loop';
    circulation.position.set(0.35, 1.55, -0.38);
    circulation.rotation.z = 0.22;
    display.add(circulation);
  }

  private createCleanEnergyDisplay(display: Group, steel: Material, metal: Material, glass: Material, screen: Material, trim: Material, light: Material): void {
    const rack = new Mesh(this.keepGeometry(new BoxGeometry(3.25, 0.12, 1.45)), steel);
    rack.position.y = 0.05;
    display.add(rack);
    for (const [z, y] of [[-0.28, 0.57], [0.32, 0.57]] as const) {
      const tank = new Mesh(this.keepGeometry(new CylinderGeometry(0.25, 0.25, 1.85, 20)), metal);
      tank.name = 'High pressure hydrogen storage tank';
      tank.rotation.z = Math.PI / 2;
      tank.position.set(-0.52, y, z);
      display.add(tank);
      for (const x of [-1.12, 0.08]) {
        const collar = new Mesh(this.keepGeometry(new TorusGeometry(0.255, 0.035, 7, 20)), trim);
        collar.rotation.y = Math.PI / 2;
        collar.position.set(x, y, z);
        display.add(collar);
      }
    }
    const solarArray = new Group();
    solarArray.name = 'Photovoltaic energy array';
    solarArray.position.set(0.9, 0.52, 0.24);
    solarArray.rotation.x = -0.35;
    for (const x of [-0.46, 0, 0.46]) {
      const panel = new Mesh(this.keepGeometry(new BoxGeometry(0.4, 0.045, 0.82)), screen);
      panel.position.x = x;
      solarArray.add(panel);
      const rail = new Mesh(this.keepGeometry(new BoxGeometry(0.045, 0.06, 0.86)), light);
      rail.position.set(x, 0.03, 0);
      solarArray.add(rail);
    }
    display.add(solarArray);
    this.addPipe(display, [-1.47, 1.05, -0.58], [0.35, 1.05, -0.58], 0.045, light, 'Hydrogen distribution line');
    this.addControlCabinet(display, 1.42, 0.61, -0.42, steel, screen, trim, 'Energy monitoring station');
    const status = new Mesh(this.keepGeometry(new RingGeometry(0.13, 0.18, 24)), glass);
    status.position.set(1.42, 0.78, 0.04);
    display.add(status);
  }

  private createAirTreatmentDisplay(display: Group, steel: Material, metal: Material, glass: Material, screen: Material, trim: Material, light: Material): void {
    const base = new Mesh(this.keepGeometry(new BoxGeometry(3.3, 0.1, 1.48)), steel);
    base.position.y = 0.04;
    display.add(base);
    const scrubber = new Mesh(this.keepGeometry(new CylinderGeometry(0.38, 0.44, 1.65, 20)), metal);
    scrubber.name = 'Air scrubbing tower';
    scrubber.position.set(-1.05, 0.9, -0.13);
    display.add(scrubber);
    for (const y of [0.38, 0.92, 1.47]) {
      const band = new Mesh(this.keepGeometry(new TorusGeometry(0.4, 0.035, 7, 24)), trim);
      band.rotation.x = Math.PI / 2;
      band.position.set(-1.05, y, -0.13);
      display.add(band);
    }
    const filterBank = new Mesh(this.keepGeometry(new BoxGeometry(1.15, 1.12, 0.85)), steel);
    filterBank.name = 'VOCs filtration module';
    filterBank.position.set(0.37, 0.62, 0.02);
    display.add(filterBank);
    for (const x of [-0.02, 0.35, 0.72]) {
      const filter = new Mesh(this.keepGeometry(new BoxGeometry(0.23, 0.78, 0.04)), glass);
      filter.position.set(x, 0.64, 0.465);
      display.add(filter);
    }
    this.addPipe(display, [-0.69, 1.42, -0.13], [1.35, 1.42, -0.13], 0.16, metal, 'Air treatment duct');
    const fan = new Mesh(this.keepGeometry(new TorusGeometry(0.32, 0.08, 9, 24)), steel);
    fan.name = 'Extraction fan housing';
    fan.position.set(1.34, 1.42, -0.13);
    fan.rotation.y = Math.PI / 2;
    display.add(fan);
    this.addControlCabinet(display, 1.32, 0.52, 0.42, steel, screen, light, 'Air quality monitoring cabinet');
    const sensor = new Mesh(this.keepGeometry(new SphereGeometry(0.11, 12, 8)), light);
    sensor.name = 'Ambient emissions sensor';
    sensor.position.set(1.55, 1.78, 0.38);
    display.add(sensor);
  }

  private createEcologicalRestorationDisplay(display: Group, steel: Material, glass: Material, screen: Material, greenery: Material, trim: Material, light: Material): void {
    const earth = this.keepMaterial(new MeshStandardMaterial({ color: '#8d8061', roughness: 0.92 }));
    const water = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#55b9bd', roughness: 0.12, transmission: 0.38, transparent: true, opacity: 0.78,
    }));
    const terrain = new Mesh(this.keepGeometry(new CylinderGeometry(1.7, 1.7, 0.16, 36)), earth);
    terrain.name = 'Wetland landscape model terrain';
    terrain.position.y = 0.06;
    terrain.scale.z = 0.43;
    display.add(terrain);
    for (const [x, z, radius] of [[-0.58, 0.02, 0.52], [0.18, 0.18, 0.46], [0.78, -0.12, 0.38]] as const) {
      const pond = new Mesh(this.keepGeometry(new CylinderGeometry(radius, radius, 0.035, 28)), water);
      pond.name = 'Constructed wetland water cell';
      pond.position.set(x, 0.165, z);
      pond.scale.z = 0.55;
      display.add(pond);
    }
    const reedGeometry = this.keepGeometry(new CylinderGeometry(0.018, 0.026, 0.42, 6));
    const reedPositions: readonly [number, number][] = [
      [-1.35, -0.28], [-1.18, 0.18], [-0.88, 0.42], [-0.38, -0.38], [0.18, -0.42],
      [0.55, 0.4], [0.94, 0.25], [1.26, -0.28], [1.45, 0.12], [0.02, 0.48],
    ];
    reedPositions.forEach(([x, z], index) => {
      const reed = new Mesh(reedGeometry, index % 3 === 0 ? trim : greenery);
      reed.name = 'Wetland planting';
      reed.position.set(x, 0.36 + (index % 2) * 0.08, z);
      display.add(reed);
    });
    this.addPipe(display, [1.18, 0.16, -0.48], [1.18, 1.5, -0.48], 0.045, steel, 'Ecological monitoring mast');
    const station = new Mesh(this.keepGeometry(new BoxGeometry(0.52, 0.54, 0.42)), steel);
    station.name = 'Wetland monitoring station';
    station.position.set(1.18, 0.61, -0.48);
    display.add(station);
    const stationScreen = new Mesh(this.keepGeometry(new BoxGeometry(0.32, 0.24, 0.035)), screen);
    stationScreen.position.set(1.18, 0.65, -0.255);
    display.add(stationScreen);
    const remoteSensor = new Group();
    remoteSensor.name = 'Remote sensing antenna';
    remoteSensor.position.set(1.18, 1.55, -0.48);
    remoteSensor.rotation.z = -0.38;
    const dish = new Mesh(this.keepGeometry(new CylinderGeometry(0.32, 0.08, 0.08, 24)), glass);
    dish.rotation.x = Math.PI / 2;
    remoteSensor.add(dish);
    const signal = new Mesh(this.keepGeometry(new TorusGeometry(0.42, 0.025, 7, 24, Math.PI)), light);
    signal.position.set(0, 0.18, 0);
    remoteSensor.add(signal);
    display.add(remoteSensor);
  }

  private addControlCabinet(parent: Group, x: number, y: number, z: number, bodyMaterial: Material, screenMaterial: Material, accentMaterial: Material, name: string): void {
    const cabinet = new Group();
    cabinet.name = name;
    cabinet.position.set(x, y, z);
    const body = new Mesh(this.keepGeometry(new BoxGeometry(0.52, 0.96, 0.42)), bodyMaterial);
    cabinet.add(body);
    const screen = new Mesh(this.keepGeometry(new BoxGeometry(0.32, 0.25, 0.035)), screenMaterial);
    screen.position.set(0, 0.17, 0.225);
    cabinet.add(screen);
    const indicator = new Mesh(this.keepGeometry(new BoxGeometry(0.27, 0.035, 0.04)), accentMaterial);
    indicator.position.set(0, -0.19, 0.228);
    cabinet.add(indicator);
    parent.add(cabinet);
  }

  private addPipe(parent: Group, start: readonly [number, number, number], end: readonly [number, number, number], radius: number, material: Material, name: string): void {
    const startPoint = new Vector3(...start);
    const endPoint = new Vector3(...end);
    const direction = endPoint.clone().sub(startPoint);
    const pipe = new Mesh(this.keepGeometry(new CylinderGeometry(radius, radius, direction.length(), 10)), material);
    pipe.name = name;
    pipe.position.copy(startPoint).add(endPoint).multiplyScalar(0.5);
    pipe.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
    parent.add(pipe);
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

    // Side returns and a lit ceiling plane define a walk-in exhibition bay;
    // all additions sit outside the existing central attachment volume.
    const sideReturnGeometry = this.sharedGeometry('zone-side-return', () => new BoxGeometry(0.18, 2.9, 2.55));
    for (const x of [-2.62, 2.62]) {
      const sideReturn = new Mesh(sideReturnGeometry, shell);
      sideReturn.name = `${id} exhibition bay side return`;
      sideReturn.position.set(x, 1.48, 1.22);
      sideReturn.castShadow = true;
      sideReturn.receiveShadow = true;
      zone.add(sideReturn);
    }
    const ceilingLight = new Mesh(this.sharedGeometry('zone-ceiling-light', () => new BoxGeometry(3.55, 0.055, 0.18)), light);
    ceilingLight.name = `${id} recessed bay lighting`;
    ceilingLight.position.set(0, 3.54, 1.33);
    zone.add(ceilingLight);

    const consoleGroup = new Group();
    consoleGroup.name = `${id} interactive display console`;
    const consoleBase = new Mesh(this.sharedGeometry('zone-console-base', () => new BoxGeometry(1.22, 0.72, 0.6)), shell);
    consoleBase.position.y = 0.36;
    consoleGroup.add(consoleBase);
    const consoleScreen = new Mesh(this.sharedGeometry('zone-console-screen', () => new BoxGeometry(1.03, 0.055, 0.46)), light);
    consoleScreen.position.set(0, 0.77, -0.02);
    consoleScreen.rotation.x = -0.2;
    consoleGroup.add(consoleScreen);
    const consoleTrim = new Mesh(this.sharedGeometry('zone-console-trim', () => new BoxGeometry(0.8, 0.045, 0.035)), trim);
    consoleTrim.position.set(0, 0.2, 0.32);
    consoleGroup.add(consoleTrim);
    consoleGroup.position.set(1.86, 0, 2.45);
    consoleGroup.rotation.y = -0.12;
    zone.add(consoleGroup);

    const equipmentArea = new Group();
    equipmentArea.name = `${id} equipment display area`;
    equipmentArea.position.set(-1.88, 0.31, 2.03);
    const equipmentPlinth = new Mesh(this.sharedGeometry('zone-equipment-plinth', () => new BoxGeometry(1.14, 0.18, 1.15)), shell);
    equipmentPlinth.position.y = -0.2;
    equipmentArea.add(equipmentPlinth);
    const equipmentBody = new Mesh(this.sharedGeometry('zone-equipment-body', () => new CylinderGeometry(0.35, 0.42, 0.9, 20)), inset);
    equipmentBody.position.y = 0.35;
    equipmentArea.add(equipmentBody);
    const equipmentCap = new Mesh(this.sharedGeometry('zone-equipment-cap', () => new TorusGeometry(0.35, 0.045, 8, 24)), trim);
    equipmentCap.rotation.x = Math.PI / 2;
    equipmentCap.position.y = 0.8;
    equipmentArea.add(equipmentCap);
    const equipmentGauge = new Mesh(this.sharedGeometry('zone-equipment-gauge', () => new BoxGeometry(0.33, 0.22, 0.055)), light);
    equipmentGauge.position.set(0, 0.43, 0.38);
    equipmentArea.add(equipmentGauge);
    zone.add(equipmentArea);
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
