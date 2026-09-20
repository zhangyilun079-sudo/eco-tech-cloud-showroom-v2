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
      roughness: 0.3,
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.32,
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
      color: '#f6f9f8', roughness: 0.3, metalness: 0.02, clearcoat: 0.32,
    }));
    const frame = this.keepMaterial(new MeshStandardMaterial({
      color: '#b8d1d3', roughness: 0.28, metalness: 0.55,
    }));
    const glass = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#bcebf0', roughness: 0.06, metalness: 0, transmission: 0.78,
      transparent: true, opacity: 0.25, thickness: 0.06, depthWrite: false, side: DoubleSide,
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

    const shell = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#f8faf9', roughness: 0.28, clearcoat: 0.38, clearcoatRoughness: 0.28,
    }));
    const inset = this.keepMaterial(new MeshStandardMaterial({
      color: '#dcebed', roughness: 0.5, metalness: 0.04,
    }));
    const trim = this.keepMaterial(new MeshStandardMaterial({
      color: '#318f94', roughness: 0.28, metalness: 0.48,
    }));
    const light = this.keepMaterial(new MeshStandardMaterial({
      color: '#dffffb', emissive: '#5ddbd0', emissiveIntensity: 1.35, roughness: 0.2,
    }));

    this.createExhibitionBay(zone, shell, inset, trim, light, layout.id);
    this.createTitleMarker(zone, layout.id);

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

  private createExhibitionBay(zone: Group, shell: Material, inset: Material, trim: Material, light: Material, id: ShowroomZoneId): void {
    const back = new Mesh(this.keepGeometry(new BoxGeometry(5.15, 3.45, 0.16)), shell);
    back.name = `${id} white exhibition wall`;
    back.position.set(0, 1.82, 0);
    back.receiveShadow = true;
    zone.add(back);

    const insetPanel = new Mesh(this.keepGeometry(new BoxGeometry(4.45, 1.72, 0.035)), inset);
    insetPanel.name = `${id} integrated display backdrop`;
    insetPanel.position.set(0, 1.45, 0.1);
    zone.add(insetPanel);

    const uprightGeometry = this.keepGeometry(new BoxGeometry(0.16, 3.7, 0.38));
    for (const x of [-2.65, 2.65]) {
      const upright = new Mesh(uprightGeometry, shell);
      upright.position.set(x, 1.85, 0.28);
      upright.castShadow = true;
      zone.add(upright);
    }
    const canopy = new Mesh(this.keepGeometry(new BoxGeometry(5.46, 0.2, 0.72)), shell);
    canopy.name = `${id} floating exhibition canopy`;
    canopy.position.set(0, 3.7, 0.45);
    canopy.castShadow = true;
    zone.add(canopy);

    const titleBand = new Mesh(this.keepGeometry(new BoxGeometry(4.25, 0.78, 0.09)), trim);
    titleBand.name = `${id} integrated title band`;
    titleBand.position.set(0, 2.92, 0.12);
    zone.add(titleBand);
    const displayLight = new Mesh(this.keepGeometry(new BoxGeometry(3.85, 0.045, 0.08)), light);
    displayLight.name = `${id} integrated display light`;
    displayLight.position.set(0, 2.3, 0.17);
    zone.add(displayLight);

    const platform = new Mesh(this.keepGeometry(new CylinderGeometry(1.7, 1.82, 0.28, 48)), shell);
    platform.name = `${id} raised presentation platform`;
    platform.position.set(0, 0.15, 1.45);
    platform.castShadow = true;
    platform.receiveShadow = true;
    zone.add(platform);
    const platformAccent = new Mesh(this.keepGeometry(new TorusGeometry(1.69, 0.035, 8, 48)), light);
    platformAccent.rotation.x = Math.PI / 2;
    platformAccent.position.set(0, 0.3, 1.45);
    zone.add(platformAccent);
  }

  private createTitleMarker(zone: Group, id: ShowroomZoneId): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#efffff';
    context.font = '600 43px Arial, sans-serif';
    context.letterSpacing = '9px';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(id, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    const material = this.keepMaterial(new MeshStandardMaterial({
      map: texture, transparent: true, roughness: 0.35, metalness: 0.02,
    }));
    const marker = new Mesh(this.keepGeometry(new PlaneGeometry(2.85, 0.7)), material);
    marker.name = `${id} title marker`;
    marker.position.set(0, 2.92, 0.18);
    zone.add(marker);
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
