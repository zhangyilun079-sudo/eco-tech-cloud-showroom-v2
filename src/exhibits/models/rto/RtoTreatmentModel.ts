import {
  BoxGeometry,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import type { Exhibit } from '../../Exhibit';
import type { ExhibitDefinition } from '../../ExhibitDefinition';

type Point = readonly [number, number, number];

/** Lightweight, programmatic three-bed RTO process equipment for ExhibitViewer. */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;

  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly shell = this.material(new MeshPhysicalMaterial({ color: '#aebbb8', roughness: 0.38, metalness: 0.72, clearcoat: 0.18 }));
  private readonly frame = this.material(new MeshStandardMaterial({ color: '#273d3d', roughness: 0.52, metalness: 0.68 }));
  private readonly insulation = this.material(new MeshStandardMaterial({ color: '#49625d', roughness: 0.62, metalness: 0.34 }));
  private readonly ceramic = this.material(new MeshStandardMaterial({ color: '#b98c5b', roughness: 0.82, metalness: 0.06 }));
  private readonly duct = this.material(new MeshStandardMaterial({ color: '#397b82', roughness: 0.4, metalness: 0.6 }));
  private readonly valve = this.material(new MeshStandardMaterial({ color: '#e1a62c', roughness: 0.48, metalness: 0.4 }));
  private readonly heat = this.material(new MeshStandardMaterial({ color: '#ff7438', emissive: '#c33213', emissiveIntensity: 1.35, roughness: 0.3 }));

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'Three-bed RTO waste gas treatment system';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;

    this.createThermalBed('thermal-bed-a', -2.35, 'A');
    this.createThermalBed('thermal-bed-b', 0, 'B');
    this.createThermalBed('thermal-bed-c', 2.35, 'C');
    this.createCombustionChamber();
    this.createBurner();
    this.createValveSystem();
    this.createFanSystem();
    this.createPipelineSystem();
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.object.clear();
  }

  private createThermalBed(id: string, x: number, designation: string): void {
    const group = this.component(id);
    const body = this.geometry(new BoxGeometry(1.82, 3.72, 2.18));
    this.box(group, body, this.insulation, [x, 2.5, 0], true);
    this.box(group, this.geometry(new BoxGeometry(1.6, 2.35, 1.96)), this.ceramic, [x, 2.35, 0]);
    this.box(group, this.geometry(new BoxGeometry(1.94, 0.13, 2.3)), this.frame, [x, 0.62, 0]);
    this.box(group, this.geometry(new BoxGeometry(1.94, 0.13, 2.3)), this.frame, [x, 4.38, 0]);

    // Repeated horizontal bands and a front access door establish industrial scale.
    for (const y of [1.2, 2.5, 3.8]) {
      this.box(group, this.geometry(new BoxGeometry(1.96, 0.08, 2.3)), this.frame, [x, y, 0]);
    }
    this.box(group, this.geometry(new BoxGeometry(0.72, 1.05, 0.08)), this.shell, [x, 2.18, 1.13]);
    const handle = this.box(group, this.geometry(new BoxGeometry(0.24, 0.06, 0.08)), this.valve, [x, 2.18, 1.2]);
    handle.name = `Bed ${designation} access handle`;
    for (const legX of [x - 0.68, x + 0.68]) {
      for (const z of [-0.78, 0.78]) this.box(group, this.geometry(new BoxGeometry(0.13, 0.62, 0.13)), this.frame, [legX, 0.31, z]);
    }
  }

  private createCombustionChamber(): void {
    const group = this.component('combustion-chamber');
    this.box(group, this.geometry(new BoxGeometry(6.72, 1.18, 2.45)), this.shell, [0, 5.14, 0], true);
    this.box(group, this.geometry(new BoxGeometry(6.34, 0.74, 2.12)), this.insulation, [0, 5.14, 0]);
    for (const x of [-3.1, -1.55, 0, 1.55, 3.1]) {
      this.box(group, this.geometry(new BoxGeometry(0.08, 1.28, 2.55)), this.frame, [x, 5.14, 0]);
    }
    const roof = this.box(group, this.geometry(new BoxGeometry(6.92, 0.12, 2.62)), this.frame, [0, 5.78, 0]);
    roof.receiveShadow = true;
  }

  private createBurner(): void {
    const group = this.component('burner');
    const barrel = this.cylinder(group, this.geometry(new CylinderGeometry(0.33, 0.33, 1.2, 18)), this.frame, [-3.72, 5.22, 0], true);
    barrel.rotation.z = Math.PI / 2;
    const flange = this.cylinder(group, this.geometry(new CylinderGeometry(0.48, 0.48, 0.13, 20)), this.valve, [-3.17, 5.22, 0]);
    flange.rotation.z = Math.PI / 2;
    const flame = new Mesh(this.geometry(new ConeGeometry(0.22, 0.72, 16)), this.heat);
    flame.position.set(-2.72, 5.22, 0);
    flame.rotation.z = -Math.PI / 2;
    group.add(flame);
    this.box(group, this.geometry(new BoxGeometry(0.82, 0.68, 0.82)), this.duct, [-4.18, 5.22, 0]);
  }

  private createValveSystem(): void {
    const group = this.component('valve-system');
    const valveBody = this.geometry(new CylinderGeometry(0.25, 0.25, 0.52, 14));
    const wheel = this.geometry(new TorusGeometry(0.28, 0.035, 7, 20));
    for (const x of [-2.35, 0, 2.35]) {
      for (const z of [-1.48, 1.48]) {
        const body = this.cylinder(group, valveBody, this.valve, [x, 0.73, z], true);
        body.rotation.x = Math.PI / 2;
        const handwheel = new Mesh(wheel, this.valve);
        handwheel.position.set(x, 1.13, z);
        handwheel.rotation.x = Math.PI / 2;
        group.add(handwheel);
      }
    }
  }

  private createFanSystem(): void {
    const group = this.component('fan-system');
    this.box(group, this.geometry(new BoxGeometry(2.05, 0.18, 1.25)), this.frame, [-5.05, 0.16, 1.25]);
    const casing = new Mesh(this.geometry(new CylinderGeometry(0.72, 0.72, 0.55, 24)), this.shell);
    casing.position.set(-4.72, 0.88, 1.25);
    casing.rotation.x = Math.PI / 2;
    casing.castShadow = true;
    group.add(casing);
    const hub = this.cylinder(group, this.geometry(new CylinderGeometry(0.18, 0.18, 0.66, 16)), this.duct, [-4.72, 0.88, 1.25]);
    hub.rotation.x = Math.PI / 2;
    const motor = this.cylinder(group, this.geometry(new CylinderGeometry(0.32, 0.32, 0.92, 16)), this.duct, [-5.62, 0.65, 1.25], true);
    motor.rotation.z = Math.PI / 2;
  }

  private createPipelineSystem(): void {
    const group = this.component('pipeline-system');
    const pipe = this.geometry(new CylinderGeometry(0.15, 0.15, 1, 12));
    const routes: readonly (readonly Point[])[] = [
      [[-5.05, 0.88, 1.25], [-3.72, 0.88, 1.25], [-3.72, 0.73, 1.48], [3.25, 0.73, 1.48]],
      [[-3.25, 0.73, -1.48], [3.9, 0.73, -1.48], [3.9, 2.1, -1.48], [5.2, 2.1, -1.48]],
      [[-2.35, 0.73, 1.48], [-2.35, 0.73, 1.08]], [[0, 0.73, 1.48], [0, 0.73, 1.08]], [[2.35, 0.73, 1.48], [2.35, 0.73, 1.08]],
      [[-2.35, 0.73, -1.48], [-2.35, 0.73, -1.08]], [[0, 0.73, -1.48], [0, 0.73, -1.08]], [[2.35, 0.73, -1.48], [2.35, 0.73, -1.08]],
    ];
    routes.forEach((route) => {
      for (let index = 1; index < route.length; index += 1) this.pipeSegment(group, pipe, route[index - 1], route[index]);
      for (let index = 1; index < route.length - 1; index += 1) {
        const elbow = new Mesh(this.geometry(new SphereGeometry(0.17, 10, 7)), this.duct);
        elbow.position.set(...route[index]);
        group.add(elbow);
      }
    });
    // Exhaust stack and rain cap.
    this.cylinder(group, this.geometry(new CylinderGeometry(0.38, 0.38, 3.75, 18)), this.duct, [5.2, 2.25, -1.48], true);
    this.cylinder(group, this.geometry(new ConeGeometry(0.62, 0.38, 18)), this.shell, [5.2, 4.3, -1.48]);
  }

  private component(id: string): Group {
    const group = new Group();
    group.name = id;
    group.userData.componentId = id;
    this.object.add(group);
    return group;
  }

  private pipeSegment(group: Group, geometry: BufferGeometry, start: Point, end: Point): void {
    const startVector = new Vector3(...start);
    const endVector = new Vector3(...end);
    const mesh = new Mesh(geometry, this.duct);
    mesh.position.copy(startVector).add(endVector).multiplyScalar(0.5);
    mesh.scale.y = startVector.distanceTo(endVector);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), endVector.clone().sub(startVector).normalize());
    mesh.castShadow = true;
    group.add(mesh);
  }

  private box(group: Group, geometry: BufferGeometry, material: Material, position: Point, shadow = false): Mesh {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = shadow;
    group.add(mesh);
    return mesh;
  }

  private cylinder(group: Group, geometry: BufferGeometry, material: Material, position: Point, shadow = false): Mesh {
    return this.box(group, geometry, material, position, shadow);
  }

  private geometry<T extends BufferGeometry>(geometry: T): T { this.geometries.push(geometry); return geometry; }
  private material<T extends Material>(material: T): T { this.materials.push(material); return material; }
}
