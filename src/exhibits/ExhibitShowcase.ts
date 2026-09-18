import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RectAreaLight,
  RingGeometry,
  SpotLight,
  Vector3,
} from 'three';

/** A reusable, self-contained presentation stage for focused exhibit viewing. */
export class ExhibitShowcase extends Group {
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];

  public constructor() {
    super();
    this.name = 'Exhibit presentation environment';
    this.visible = false;
    this.createEnvironment();
    this.createPlatform();
    this.createLighting();
  }

  public showAt(position: Vector3): void {
    this.position.copy(position);
    this.visible = true;
  }

  public hide(): void {
    this.visible = false;
  }

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.clear();
  }

  private createEnvironment(): void {
    const backdropMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#10221f', roughness: 0.84, metalness: 0.05, side: DoubleSide,
    }));
    const detailMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#52766c', emissive: '#254b41', emissiveIntensity: 0.55,
      roughness: 0.4, metalness: 0.42,
    }));

    const backdrop = new Mesh(this.keepGeometry(new PlaneGeometry(13, 8)), backdropMaterial);
    backdrop.name = 'Technical exhibit backdrop';
    backdrop.position.set(0, 3.35, -2.2);
    backdrop.receiveShadow = true;
    this.add(backdrop);

    const floor = new Mesh(this.keepGeometry(new CircleGeometry(7.4, 64)), backdropMaterial);
    floor.name = 'Exhibit presentation floor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.42;
    floor.receiveShadow = true;
    this.add(floor);

    // Fine rails suggest a calibrated laboratory display rather than a game HUD.
    const horizontalRail = this.keepGeometry(new BoxGeometry(9.5, 0.018, 0.018));
    for (const y of [0.65, 1.55, 2.45, 3.35, 4.25, 5.15, 6.05]) {
      const rail = new Mesh(horizontalRail, detailMaterial);
      rail.position.set(0.65, y, -2.14);
      this.add(rail);
    }
    const verticalRail = this.keepGeometry(new BoxGeometry(0.018, 5.9, 0.018));
    for (const x of [-4.1, -2.5, -0.9, 0.7, 2.3, 3.9, 5.5]) {
      const rail = new Mesh(verticalRail, detailMaterial);
      rail.position.set(x, 3.35, -2.13);
      this.add(rail);
    }

    const datum = new Mesh(this.keepGeometry(new RingGeometry(1.75, 1.78, 64)), detailMaterial);
    datum.name = 'Technical measurement datum';
    datum.position.set(0.65, 2.45, -2.08);
    this.add(datum);
  }

  private createPlatform(): void {
    const bodyMaterial = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#d9e2de', roughness: 0.28, metalness: 0.34,
      clearcoat: 0.42, clearcoatRoughness: 0.35,
    }));
    const trimMaterial = this.keepMaterial(new MeshStandardMaterial({
      color: '#284d45', emissive: '#16352f', emissiveIntensity: 0.4,
      roughness: 0.3, metalness: 0.7,
    }));

    const pedestal = new Mesh(this.keepGeometry(new CylinderGeometry(1.7, 1.95, 0.38, 48)), bodyMaterial);
    pedestal.name = 'Professional exhibit pedestal';
    pedestal.position.y = -0.2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.add(pedestal);

    const illuminatedTrim = new Mesh(this.keepGeometry(new RingGeometry(1.62, 1.72, 64)), trimMaterial);
    illuminatedTrim.rotation.x = -Math.PI / 2;
    illuminatedTrim.position.y = 0.005;
    this.add(illuminatedTrim);
  }

  private createLighting(): void {
    const key = new SpotLight('#f3fff8', 82, 14, Math.PI / 6, 0.55, 1.4);
    key.name = 'Exhibit key light';
    key.position.set(-3.4, 6.2, 4.2);
    key.target.position.set(0, 1.1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);

    const rim = new SpotLight('#79d8b2', 48, 12, Math.PI / 5, 0.65, 1.5);
    rim.name = 'Exhibit rim light';
    rim.position.set(3.8, 4.8, -0.8);
    rim.target.position.set(0, 1.25, 0);

    const softbox = new RectAreaLight('#c8f6e5', 10, 3.5, 2.5);
    softbox.name = 'Exhibit soft fill';
    softbox.position.set(3.4, 3.4, 2.8);
    softbox.lookAt(0, 1.2, 0);

    this.add(key, key.target, rim, rim.target, softbox);
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
