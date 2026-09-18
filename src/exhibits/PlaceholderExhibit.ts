import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { Exhibit } from './Exhibit';

/** A procedural test article for validating the viewer flow; not a final exhibit. */
export class PlaceholderExhibit implements Exhibit {
  public readonly object = new Group();
  public readonly metadata = {
    id: 'zone-01-placeholder',
    title: '水处理技术验证设备',
    description: '用于验证展品查看、旋转与缩放交互的程序化占位设备。',
    category: 'ADVANCED WATER SYSTEMS',
    keyFeatures: ['Modular filtration chamber', 'Real-time quality sensing', 'Low-energy circulation'],
    impactLabel: 'INTERACTION PROTOTYPE',
  } as const;

  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];

  public constructor() {
    this.object.name = 'ZONE_01 procedural equipment placeholder';
    this.object.visible = false;

    const shell = this.keepMaterial(new MeshPhysicalMaterial({
      color: '#d8e2df', roughness: 0.28, metalness: 0.48, clearcoat: 0.3,
    }));
    const frame = this.keepMaterial(new MeshStandardMaterial({
      color: '#173f3a', roughness: 0.3, metalness: 0.72,
    }));
    const signal = this.keepMaterial(new MeshStandardMaterial({
      color: '#8ff5ca', emissive: '#31c990', emissiveIntensity: 2,
      roughness: 0.2, metalness: 0.15,
    }));

    const base = new Mesh(this.keepGeometry(new CylinderGeometry(1.1, 1.25, 0.24, 12)), frame);
    base.position.y = 0.12;
    this.object.add(base);

    const body = new Mesh(this.keepGeometry(new BoxGeometry(1.7, 1.75, 1.25)), shell);
    body.position.y = 1.18;
    body.castShadow = true;
    this.object.add(body);

    for (const x of [-0.64, 0.64]) {
      const rail = new Mesh(this.keepGeometry(new CylinderGeometry(0.045, 0.045, 1.82, 10)), frame);
      rail.position.set(x, 1.2, 0.67);
      this.object.add(rail);
    }

    const chamber = new Mesh(this.keepGeometry(new CylinderGeometry(0.38, 0.38, 1.32, 24)), frame);
    chamber.rotation.z = Math.PI / 2;
    chamber.position.set(0, 1.3, 0.74);
    this.object.add(chamber);

    const statusRing = new Mesh(this.keepGeometry(new TorusGeometry(0.39, 0.045, 10, 32)), signal);
    statusRing.position.set(0, 1.3, 1.13);
    this.object.add(statusRing);

    for (let index = 0; index < 4; index += 1) {
      const indicator = new Mesh(this.keepGeometry(new BoxGeometry(0.2, 0.055, 0.035)), signal);
      indicator.position.set(-0.48 + index * 0.32, 2.2, 0.65);
      this.object.add(indicator);
    }
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.object.clear();
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
