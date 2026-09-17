import {
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

export class Showroom {
  public readonly group = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];

  public constructor() {
    this.group.name = 'Procedural exhibition hall';
    this.createFloor();
    this.createArchitecture();
    this.createEmptyPlinths();
  }

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
  }

  private createFloor(): void {
    const geometry = this.keepGeometry(new PlaneGeometry(28, 24));
    const material = this.keepMaterial(new MeshStandardMaterial({
      color: new Color('#d9ddd7'),
      roughness: 0.72,
      metalness: 0.05,
    }));
    const floor = new Mesh(geometry, material);
    floor.name = 'Polished concrete floor';
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  private createArchitecture(): void {
    const wallMaterial = this.keepMaterial(new MeshStandardMaterial({ color: '#e8ede7', roughness: 0.84 }));
    const accentMaterial = this.keepMaterial(new MeshStandardMaterial({ color: '#163f34', roughness: 0.62 }));
    const wallGeometry = this.keepGeometry(new BoxGeometry(28, 8, 0.35));
    const backWall = new Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 4, -10);
    backWall.receiveShadow = true;

    const beamGeometry = this.keepGeometry(new BoxGeometry(0.3, 0.3, 20));
    for (const x of [-10, -5, 0, 5, 10]) {
      const beam = new Mesh(beamGeometry, accentMaterial);
      beam.position.set(x, 7.7, 0);
      this.group.add(beam);
    }

    const sideGeometry = this.keepGeometry(new BoxGeometry(0.25, 3.5, 20));
    for (const x of [-13.85, 13.85]) {
      const side = new Mesh(sideGeometry, wallMaterial);
      side.position.set(x, 1.75, 0);
      side.receiveShadow = true;
      this.group.add(side);
    }

    this.group.add(backWall);
  }

  private createEmptyPlinths(): void {
    const geometry = this.keepGeometry(new CylinderGeometry(1.55, 1.7, 0.32, 48));
    const material = this.keepMaterial(new MeshStandardMaterial({
      color: '#f1f3ed',
      roughness: 0.5,
      metalness: 0.08,
    }));

    for (const [x, z] of [[-6, -3], [0, -4.6], [6, -3]] as const) {
      const plinth = new Mesh(geometry, material);
      plinth.position.set(x, 0.16, z);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      this.group.add(plinth);
    }
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
