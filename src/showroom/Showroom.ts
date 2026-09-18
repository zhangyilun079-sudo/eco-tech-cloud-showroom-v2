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
  SRGBColorSpace,
  TorusGeometry,
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
    this.createEnvironmentalDataCore();
    this.zones = ZONE_LAYOUTS.map((layout) => this.createZone(layout));
  }

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private createFloor(): void {
    const floorMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: new Color('#c7cecc'),
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
      color: '#263f45',
      roughness: 0.6,
      metalness: 0.25,
    }));
    const ring = new Mesh(this.keepGeometry(new RingGeometry(3.55, 4.15, 64)), insetMaterial);
    ring.name = 'Central hall floor inset';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.008;
    ring.receiveShadow = true;
    this.group.add(ring);
  }

  /** A low, open instrument cluster that keeps every route through the hall clear. */
  private createEnvironmentalDataCore(): void {
    const core = new Group();
    core.name = 'Central smart environmental data core';

    const frameMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#244951', roughness: 0.3, metalness: 0.72,
    }));
    const signalMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#8be4ce', emissive: '#38bfa5', emissiveIntensity: 1.5,
      roughness: 0.24, metalness: 0.18,
    }));
    const glassMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#bdece8', transparent: true, opacity: 0.18, transmission: 0.65,
      roughness: 0.08, metalness: 0, depthWrite: false, side: DoubleSide,
    }));

    // Concentric telemetry rails establish the hub without filling its center.
    for (const [radius, y] of [[3.6, 0.035], [2.85, 0.045], [1.95, 0.055]] as const) {
      const telemetryRing = new Mesh(
        this.keepGeometry(new TorusGeometry(radius, 0.025, 8, 80)),
        signalMaterial,
      );
      telemetryRing.name = 'Live environmental telemetry floor ring';
      telemetryRing.rotation.x = Math.PI / 2;
      telemetryRing.position.y = y;
      core.add(telemetryRing);
    }

    // Three transparent readouts leave broad gaps between all exhibition routes.
    for (let index = 0; index < 3; index += 1) {
      const angle = index * Math.PI * 2 / 3 + Math.PI / 6;
      const station = new Group();
      station.name = `Environmental monitoring station ${index + 1}`;
      station.position.set(Math.cos(angle) * 2.65, 0, Math.sin(angle) * 2.65);
      station.rotation.y = -angle + Math.PI / 2;

      const mast = new Mesh(this.keepGeometry(new BoxGeometry(0.055, 1.75, 0.055)), frameMaterial);
      mast.position.y = 0.9;
      station.add(mast);
      const screen = new Mesh(this.keepGeometry(new PlaneGeometry(1.2, 0.62)), glassMaterial);
      screen.position.set(0, 1.35, 0.04);
      station.add(screen);
      const header = new Mesh(this.keepGeometry(new BoxGeometry(1.2, 0.035, 0.035)), signalMaterial);
      header.position.set(0, 1.68, 0.055);
      station.add(header);
      for (let barIndex = 0; barIndex < 5; barIndex += 1) {
        const bar = new Mesh(
          this.keepGeometry(new BoxGeometry(0.1, 0.08 + barIndex * 0.045, 0.025)),
          signalMaterial,
        );
        bar.position.set(-0.4 + barIndex * 0.2, 1.14 + bar.geometry.parameters.height / 2, 0.065);
        station.add(bar);
      }
      core.add(station);
    }
    this.group.add(core);
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

    const panelMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#dce4e2', roughness: 0.7, metalness: 0.08,
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

    this.createCapsuleFrame(zone, panelMaterial, trimMaterial, detailMaterial, layout.id);

    const plinth = new Mesh(this.keepGeometry(new CylinderGeometry(1.35, 1.48, 0.28, 8)), plinthMaterial);
    plinth.name = `${layout.id} equipment presentation deck`;
    plinth.position.set(0, 0.18, 1.45);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    zone.add(plinth);

    this.createCabinet(zone, trimMaterial, glassMaterial, layout.id);
    this.createScientificDetails(zone, detailMaterial, trimMaterial, layout.id);
    this.createControlPanel(zone, panelMaterial, trimMaterial, detailMaterial, layout.id);
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

  private createCapsuleFrame(zone: Group, panelMaterial: Material, frameMaterial: Material, signalMaterial: Material, id: ShowroomZoneId): void {
    const rearPanel = new Mesh(this.keepGeometry(new BoxGeometry(4.7, 2.65, 0.1)), panelMaterial);
    rearPanel.name = `${id} modular service panel`;
    rearPanel.position.set(0, 1.72, 0);
    rearPanel.receiveShadow = true;
    zone.add(rearPanel);

    const vertical = this.keepGeometry(new BoxGeometry(0.11, 3.5, 0.18));
    for (const x of [-2.55, 2.55]) {
      const upright = new Mesh(vertical, frameMaterial);
      upright.position.set(x, 1.75, 0.25);
      upright.castShadow = true;
      zone.add(upright);
    }
    const topRail = new Mesh(this.keepGeometry(new BoxGeometry(5.2, 0.12, 0.18)), frameMaterial);
    topRail.position.set(0, 3.5, 0.25);
    zone.add(topRail);
    const serviceRail = new Mesh(this.keepGeometry(new BoxGeometry(4.55, 0.045, 0.04)), signalMaterial);
    serviceRail.position.set(0, 3.25, 0.12);
    zone.add(serviceRail);
  }

  private createControlPanel(zone: Group, panelMaterial: Material, frameMaterial: Material, signalMaterial: Material, id: ShowroomZoneId): void {
    const consoleGroup = new Group();
    consoleGroup.name = `${id} intelligent control console`;
    consoleGroup.position.set(1.72, 1.38, 0.16);
    const console = new Mesh(this.keepGeometry(new BoxGeometry(1.05, 0.82, 0.1)), frameMaterial);
    consoleGroup.add(console);
    const display = new Mesh(this.keepGeometry(new PlaneGeometry(0.88, 0.64)), panelMaterial);
    display.position.z = 0.056;
    consoleGroup.add(display);
    for (let row = 0; row < 3; row += 1) {
      const indicator = new Mesh(this.keepGeometry(new BoxGeometry(0.5 - row * 0.09, 0.035, 0.025)), signalMaterial);
      indicator.position.set(-0.12 + row * 0.045, 0.2 - row * 0.2, 0.075);
      consoleGroup.add(indicator);
    }
    zone.add(consoleGroup);
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
