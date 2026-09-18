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
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';

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
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];

  public constructor() {
    this.group.name = 'Procedural ecological technology exhibition hall';
    this.createFloor();
    this.createArchitecture();
    this.zones = ZONE_LAYOUTS.map((layout) => this.createZone(layout));
  }

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private createFloor(): void {
    const floorMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: new Color('#cbd1ca'),
      roughness: 0.64,
      metalness: 0.04,
      clearcoat: 0.16,
      clearcoatRoughness: 0.72,
    }));
    const floor = new Mesh(this.keepGeometry(new PlaneGeometry(28, 24)), floorMaterial);
    floor.name = 'Low-sheen architectural concrete floor';
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const insetMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#527a6b',
      roughness: 0.6,
      metalness: 0.25,
    }));
    const ring = new Mesh(this.keepGeometry(new CircleGeometry(4.15, 64)), insetMaterial);
    ring.name = 'Central hall floor inset';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    ring.receiveShadow = true;
    this.group.add(ring);
  }

  private createArchitecture(): void {
    const wallMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#e3e8e2',
      roughness: 0.82,
      metalness: 0.02,
    }));
    const bronzeMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#355d51',
      roughness: 0.27,
      metalness: 0.7,
    }));
    const lightMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#d7fff0', emissive: '#8de5c0', emissiveIntensity: 2.2,
      roughness: 0.28, metalness: 0.08,
    }));

    const backWall = new Mesh(this.keepGeometry(new BoxGeometry(28, 8, 0.32)), wallMaterial);
    backWall.name = 'Main gallery wall';
    backWall.position.set(0, 4, -10);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    const sideGeometry = this.keepGeometry(new BoxGeometry(0.25, 4.4, 20));
    for (const x of [-13.85, 13.85]) {
      const wall = new Mesh(sideGeometry, wallMaterial);
      wall.position.set(x, 2.2, 0);
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    const beamGeometry = this.keepGeometry(new BoxGeometry(0.22, 0.28, 20));
    for (const x of [-10.5, -5.25, 0, 5.25, 10.5]) {
      const beam = new Mesh(beamGeometry, bronzeMaterial);
      beam.position.set(x, 7.65, 0);
      beam.castShadow = true;
      this.group.add(beam);
    }

    // A restrained overhead grid gives the open hall a precise laboratory rhythm.
    const crossBeamGeometry = this.keepGeometry(new BoxGeometry(27.4, 0.18, 0.2));
    for (const z of [-7.8, -2.6, 2.6, 7.8]) {
      const crossBeam = new Mesh(crossBeamGeometry, bronzeMaterial);
      crossBeam.name = 'Ceiling structural cross member';
      crossBeam.position.set(0, 7.65, z);
      crossBeam.castShadow = true;
      this.group.add(crossBeam);
    }

    const linearLightGeometry = this.keepGeometry(new BoxGeometry(0.07, 0.045, 13.5));
    for (const x of [-7.9, -2.65, 2.65, 7.9]) {
      const linearLight = new Mesh(linearLightGeometry, lightMaterial);
      linearLight.name = 'Recessed architectural linear light';
      linearLight.position.set(x, 7.48, -0.7);
      this.group.add(linearLight);
    }

    const wallLightGeometry = this.keepGeometry(new BoxGeometry(4.6, 0.055, 0.045));
    for (const x of [-8.4, 0, 8.4]) {
      const wallLight = new Mesh(wallLightGeometry, lightMaterial);
      wallLight.position.set(x, 6.25, -9.8);
      this.group.add(wallLight);
    }
  }

  private createZone(layout: ZoneLayout): ShowroomZone {
    const zone = new Group();
    zone.name = layout.id;
    zone.position.set(...layout.position);
    zone.rotation.y = layout.rotation;

    const wallMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#eef1ec', roughness: 0.78, metalness: 0.02,
    }));
    const trimMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#31594c', roughness: 0.38, metalness: 0.42,
    }));
    const plinthMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#e7ebe5', roughness: 0.36, metalness: 0.08,
      clearcoat: 0.28, clearcoatRoughness: 0.48,
    }));
    const glassMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#c9e4db', roughness: 0.12, metalness: 0,
      transparent: true, opacity: 0.23, transmission: 0.5,
      thickness: 0.08, side: DoubleSide, depthWrite: false,
    }));
    const detailMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#9ccfbc', emissive: '#4b9278', emissiveIntensity: 0.7,
      roughness: 0.32, metalness: 0.38,
    }));

    const backdrop = new Mesh(this.keepGeometry(new BoxGeometry(5.2, 3.45, 0.2)), wallMaterial);
    backdrop.name = `${layout.id} background wall`;
    backdrop.position.set(0, 1.74, 0);
    backdrop.castShadow = true;
    backdrop.receiveShadow = true;
    zone.add(backdrop);

    const accent = new Mesh(this.keepGeometry(new BoxGeometry(5.25, 0.12, 0.12)), trimMaterial);
    accent.position.set(0, 3.5, 0.16);
    zone.add(accent);

    const plinth = new Mesh(this.keepGeometry(new CylinderGeometry(1.35, 1.48, 0.36, 48)), plinthMaterial);
    plinth.name = `${layout.id} exhibition plinth`;
    plinth.position.set(0, 0.18, 1.45);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    zone.add(plinth);

    this.createCabinet(zone, trimMaterial, glassMaterial, layout.id);
    this.createScientificDetails(zone, detailMaterial, trimMaterial, layout.id);
    this.createTitleMarker(zone, layout.id);

    const exhibitPlaceholder = new Group();
    exhibitPlaceholder.name = `${layout.id} exhibit placeholder`;
    exhibitPlaceholder.position.set(0, 0.4, 1.45);
    exhibitPlaceholder.userData.zoneId = layout.id;
    exhibitPlaceholder.userData.isHotspot = true;
    zone.add(exhibitPlaceholder);

    this.group.add(zone);
    const hotspotPosition = exhibitPlaceholder.getWorldPosition(new Vector3());
    return {
      id: layout.id,
      position: zone.position.clone(),
      hotspotPosition,
      exhibitPlaceholder,
    };
  }

  private createScientificDetails(zone: Group, lightMaterial: Material, frameMaterial: Material, id: ShowroomZoneId): void {
    const rail = new Mesh(this.keepGeometry(new BoxGeometry(4.45, 0.035, 0.045)), lightMaterial);
    rail.name = `${id} integrated display light`;
    rail.position.set(0, 2.28, 0.14);
    zone.add(rail);

    const dataRail = new Group();
    dataRail.name = `${id} research data markers`;
    dataRail.position.set(-2.15, 1.1, 0.14);
    const markerGeometry = this.keepGeometry(new BoxGeometry(0.035, 0.18, 0.03));
    for (let index = 0; index < 7; index += 1) {
      const marker = new Mesh(markerGeometry, index % 3 === 0 ? lightMaterial : frameMaterial);
      marker.position.y = index * 0.26;
      dataRail.add(marker);
    }
    zone.add(dataRail);
  }

  private createCabinet(zone: Group, frameMaterial: Material, glassMaterial: Material, id: ShowroomZoneId): void {
    const frameGeometry = this.keepGeometry(new BoxGeometry(0.06, 1.8, 0.06));
    const glassGeometry = this.keepGeometry(new BoxGeometry(2.65, 1.8, 0.035));
    const cabinet = new Group();
    cabinet.name = `${id} display cabinet`;
    cabinet.position.set(0, 1.28, 1.45);

    for (const x of [-1.34, 1.34]) {
      for (const z of [-0.78, 0.78]) {
        const upright = new Mesh(frameGeometry, frameMaterial);
        upright.position.set(x, 0, z);
        upright.castShadow = true;
        cabinet.add(upright);
      }
    }
    for (const z of [-0.79, 0.79]) {
      const pane = new Mesh(glassGeometry, glassMaterial);
      pane.position.z = z;
      cabinet.add(pane);
    }
    zone.add(cabinet);
  }

  private createTitleMarker(zone: Group, id: ShowroomZoneId): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#163f34';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#dcebe4';
    context.font = '600 46px Arial, sans-serif';
    context.letterSpacing = '8px';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(id, canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this.textures.push(texture);
    const material = this.keepMaterial(new MeshStandardMaterial({
      map: texture, roughness: 0.56, metalness: 0.08,
    }));
    const marker = new Mesh(this.keepGeometry(new PlaneGeometry(2.8, 0.7)), material);
    marker.name = `${id} title marker`;
    marker.position.set(0, 2.75, 0.13);
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
