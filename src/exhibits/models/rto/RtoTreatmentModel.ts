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

/** Reference-driven, front-cutaway model of a three-bed regenerative thermal oxidizer. */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;

  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly steel = this.material(new MeshPhysicalMaterial({ color: '#b7c1bd', roughness: 0.3, metalness: 0.76, clearcoat: 0.2 }));
  private readonly darkSteel = this.material(new MeshStandardMaterial({ color: '#263739', roughness: 0.45, metalness: 0.72 }));
  private readonly refractory = this.material(new MeshStandardMaterial({ color: '#d5cab6', roughness: 0.82, metalness: 0.04 }));
  private readonly ceramic = this.material(new MeshStandardMaterial({ color: '#c8864f', roughness: 0.86, metalness: 0.03 }));
  private readonly ceramicDark = this.material(new MeshStandardMaterial({ color: '#855332', roughness: 0.9 }));
  private readonly redPipe = this.material(new MeshStandardMaterial({ color: '#c9483e', roughness: 0.37, metalness: 0.48 }));
  private readonly yellowPipe = this.material(new MeshStandardMaterial({ color: '#e0ae2d', roughness: 0.4, metalness: 0.42 }));
  private readonly purplePipe = this.material(new MeshStandardMaterial({ color: '#76519a', roughness: 0.38, metalness: 0.5 }));
  private readonly valveMetal = this.material(new MeshStandardMaterial({ color: '#d9e1dc', roughness: 0.32, metalness: 0.74 }));
  private readonly flame = this.material(new MeshStandardMaterial({ color: '#ffae32', emissive: '#ff3f0d', emissiveIntensity: 2.2, roughness: 0.24 }));
  private readonly hotGas = this.material(new MeshStandardMaterial({ color: '#ff6b2f', emissive: '#7f1708', emissiveIntensity: 1.15, roughness: 0.35 }));

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'Reference-driven three-bed RTO cutaway exhibit';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;

    this.createFrameSupport();
    this.createThermalBed('thermal-bed-a', -2.2, 'A');
    this.createThermalBed('thermal-bed-b', 0, 'B');
    this.createThermalBed('thermal-bed-c', 2.2, 'C');
    this.createBedHoppers();
    this.createCombustionChamber();
    this.createBurner();
    this.createBlowerFan();
    this.createHeatExchanger();
    this.createValveManifold();
    this.createPipelineNetwork();
    this.createExhaustStack();
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.object.clear();
  }

  private createThermalBed(id: string, x: number, designation: string): void {
    const group = this.component(id);
    // Rear and side panels remain in place while the front is removed to expose the bed.
    this.box(group, [1.82, 3.72, 0.12], this.steel, [x, 2.8, -0.94], true);
    this.box(group, [0.12, 3.72, 1.94], this.steel, [x - 0.91, 2.8, 0]);
    this.box(group, [0.12, 3.72, 1.94], this.steel, [x + 0.91, 2.8, 0]);
    this.box(group, [1.94, 0.14, 2.02], this.darkSteel, [x, 0.94, 0]);
    this.box(group, [1.94, 0.14, 2.02], this.darkSteel, [x, 4.66, 0]);

    // Stacked honeycomb blocks and thin channel lines communicate the ceramic media.
    for (let row = 0; row < 5; row += 1) {
      const y = 1.42 + row * 0.58;
      this.box(group, [1.55, 0.49, 1.62], row % 2 ? this.ceramicDark : this.ceramic, [x, y, 0.02], true);
      for (let channel = -3; channel <= 3; channel += 1) {
        this.box(group, [0.045, 0.41, 0.025], this.refractory, [x + channel * 0.19, y, 0.845]);
      }
      this.box(group, [1.58, 0.035, 1.66], this.darkSteel, [x, y - 0.27, 0.02]);
    }

    // Front cutaway rim, lower distribution plenum, and a designation plate.
    for (const side of [-0.86, 0.86]) this.box(group, [0.09, 3.6, 0.09], this.darkSteel, [x + side, 2.82, 0.98]);
    this.box(group, [1.8, 0.09, 0.09], this.darkSteel, [x, 4.6, 0.98]);
    this.box(group, [1.62, 0.45, 1.7], this.refractory, [x, 4.35, 0]);
    const plate = this.box(group, [0.58, 0.32, 0.045], this.darkSteel, [x, 4.41, 1.035]);
    plate.name = `BED ${designation}`;

    // Dense, exposed ceramic channels make this a technical section rather
    // than three closed cabinets.
    for (let column = -6; column <= 6; column += 1) {
      for (let row = 0; row < 5; row += 1) {
        this.box(group, [0.035, 0.035, 0.08], this.refractory, [x + column * 0.105, 1.42 + row * 0.58, 0.9]);
      }
    }
  }

  private createBedHoppers(): void {
    const group = this.component('bed-distribution-plenums');
    for (const x of [-2.2, 0, 2.2]) {
      const hopper = new Mesh(this.geometry(new ConeGeometry(0.88, 0.62, 4, 1, true)), this.steel);
      hopper.position.set(x, 0.66, 0);
      hopper.rotation.y = Math.PI / 4;
      hopper.scale.z = 1.12;
      hopper.castShadow = true;
      group.add(hopper);
      this.cylinder(group, 0.23, 0.48, this.darkSteel, [x, 0.28, 0]);
    }
  }

  private createCombustionChamber(): void {
    const group = this.component('combustion-chamber');
    this.box(group, [6.72, 0.12, 2.36], this.steel, [0, 6.2, 0], true);
    this.box(group, [6.72, 1.42, 0.12], this.steel, [0, 5.49, -1.12], true);
    this.box(group, [0.12, 1.42, 2.36], this.steel, [-3.3, 5.49, 0]);
    this.box(group, [0.12, 1.42, 2.36], this.steel, [3.3, 5.49, 0]);
    this.box(group, [6.34, 0.09, 2.06], this.refractory, [0, 6.08, 0]);
    this.box(group, [6.34, 1.12, 0.08], this.refractory, [0, 5.48, -1.02]);
    // Open front reveals the common high-temperature volume and bed throats.
    this.box(group, [5.55, 0.34, 1.75], this.hotGas, [0.15, 5.48, -0.05]);
    for (const x of [-2.2, 0, 2.2]) {
      this.box(group, [1.65, 0.08, 1.78], this.darkSteel, [x, 4.78, 0]);
      for (const offset of [-0.55, 0, 0.55]) this.box(group, [0.08, 0.28, 1.7], this.refractory, [x + offset, 4.92, 0]);
    }
    // Refractory baffles and roof ribs visible in the open front section.
    for (const x of [-2.72, -1.82, -0.92, 0, 0.92, 1.82, 2.72]) {
      this.box(group, [0.07, 0.82, 1.82], this.refractory, [x, 5.55, -0.04]);
    }
    for (const x of [-2.75, -1.65, -0.55, 0.55, 1.65, 2.75]) {
      this.box(group, [0.08, 0.22, 2.2], this.darkSteel, [x, 6.27, 0]);
    }
  }

  private createBurner(): void {
    const group = this.component('burner');
    const barrel = this.cylinder(group, 0.3, 1.2, this.darkSteel, [-3.82, 5.54, 0], true);
    barrel.rotation.z = Math.PI / 2;
    const flange = this.cylinder(group, 0.44, 0.13, this.yellowPipe, [-3.25, 5.54, 0]);
    flange.rotation.z = Math.PI / 2;
    this.box(group, [0.75, 0.72, 0.72], this.steel, [-4.35, 5.54, 0], true);
    for (let index = 0; index < 3; index += 1) {
      const fire = new Mesh(this.geometry(new ConeGeometry(0.28 - index * 0.055, 0.78 + index * 0.16, 16)), this.flame);
      fire.position.set(-2.62 + index * 0.27, 5.54, (index - 1) * 0.18);
      fire.rotation.z = -Math.PI / 2;
      group.add(fire);
    }
  }

  private createBlowerFan(): void {
    const group = this.component('blower-fan');
    this.box(group, [2.25, 0.18, 1.35], this.darkSteel, [-5.25, 0.18, 1.2]);
    const casing = this.cylinder(group, 0.78, 0.55, this.steel, [-4.86, 1.02, 1.2], true);
    casing.rotation.x = Math.PI / 2;
    const rim = new Mesh(this.geometry(new TorusGeometry(0.79, 0.07, 8, 28)), this.darkSteel);
    rim.position.set(-4.86, 1.02, 1.5);
    group.add(rim);
    const hub = this.cylinder(group, 0.16, 0.66, this.yellowPipe, [-4.86, 1.02, 1.2]);
    hub.rotation.x = Math.PI / 2;
    for (let index = 0; index < 8; index += 1) {
      const blade = this.box(group, [0.42, 0.1, 0.055], this.darkSteel, [-4.86, 1.02, 1.54]);
      blade.rotation.z = index * Math.PI / 4;
      blade.position.x += Math.cos(index * Math.PI / 4) * 0.32;
      blade.position.y += Math.sin(index * Math.PI / 4) * 0.32;
    }
    const motor = this.cylinder(group, 0.33, 1.05, this.purplePipe, [-5.9, 0.72, 1.2], true);
    motor.rotation.z = Math.PI / 2;
    this.box(group, [0.58, 0.66, 0.72], this.steel, [-4.2, 1.56, 1.2]);
  }

  private createHeatExchanger(): void {
    const group = this.component('heat-exchanger');
    this.box(group, [1.25, 2.1, 0.9], this.steel, [-5.18, 3.34, -0.62], true);
    this.box(group, [1.05, 1.78, 0.06], this.refractory, [-5.18, 3.34, -0.14]);
    for (let index = 0; index < 7; index += 1) {
      const tube = this.cylinder(group, 0.055, 1.62, this.purplePipe, [-5.58 + index * 0.135, 3.34, -0.08]);
      if (index % 2 === 1) tube.position.y += 0.08;
    }
    for (const y of [2.42, 4.26]) this.box(group, [1.42, 0.12, 1.02], this.darkSteel, [-5.18, y, -0.62]);
    for (const x of [-5.66, -4.7]) this.box(group, [0.12, 0.6, 0.12], this.darkSteel, [x, 2.02, -0.62]);
  }

  private createValveManifold(): void {
    const group = this.component('valve-manifold');
    const wheelGeometry = this.geometry(new TorusGeometry(0.24, 0.035, 7, 18));
    for (const x of [-2.2, 0, 2.2]) {
      for (const [z, material] of [[1.42, this.redPipe], [-1.42, this.purplePipe]] as const) {
        const valve = this.cylinder(group, 0.25, 0.48, this.valveMetal, [x, 0.73, z], true);
        valve.rotation.x = Math.PI / 2;
        const actuator = this.box(group, [0.42, 0.42, 0.42], material, [x, 1.09, z]);
        actuator.rotation.y = Math.PI / 4;
        const wheel = new Mesh(wheelGeometry, this.yellowPipe);
        wheel.position.set(x, 1.42, z);
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
        this.pipeSegment(group, 0.13, material, [x, 0.73, z], [x, 0.73, z > 0 ? 0.98 : -0.98]);
      }
      // Yellow purge line has its own actuator and branch for every bed.
      this.pipeSegment(group, 0.1, this.yellowPipe, [x, 0.43, 0.62], [x, 0.43, -0.62]);
      const purgeValve = this.cylinder(group, 0.18, 0.38, this.valveMetal, [x, 0.43, 0]);
      purgeValve.rotation.x = Math.PI / 2;
      const purgeWheel = new Mesh(wheelGeometry, this.yellowPipe);
      purgeWheel.scale.setScalar(0.72);
      purgeWheel.position.set(x, 0.78, 0);
      purgeWheel.rotation.x = Math.PI / 2;
      group.add(purgeWheel);
    }
  }

  private createPipelineNetwork(): void {
    const group = this.component('pipeline-network');
    const redRoutes: readonly Point[][] = [
      [[-4.2, 1.56, 1.2], [-3.72, 1.56, 1.2], [-3.72, 0.73, 1.42], [3.25, 0.73, 1.42]],
    ];
    const purpleRoutes: readonly Point[][] = [
      [[-3.25, 0.73, -1.42], [3.8, 0.73, -1.42], [3.8, 2.0, -1.42], [4.82, 2.0, -1.42]],
      [[-5.18, 4.38, -0.62], [-5.18, 4.78, -0.62], [-3.72, 4.78, -0.62], [-3.72, 5.4, -0.62]],
    ];
    const yellowRoutes: readonly Point[][] = [
      [[-5.8, 1.9, -0.15], [-5.8, 1.9, 0.45], [-4.38, 1.9, 0.45]],
      [[-3.9, 5.1, 0.66], [-3.9, 4.72, 0.66], [-2.95, 4.72, 0.66]],
      [[-3.25, 0.43, 0], [3.25, 0.43, 0]],
    ];
    redRoutes.forEach((route) => this.pipeRoute(group, route, 0.16, this.redPipe));
    purpleRoutes.forEach((route) => this.pipeRoute(group, route, 0.17, this.purplePipe));
    yellowRoutes.forEach((route) => this.pipeRoute(group, route, 0.11, this.yellowPipe));
    for (const x of [-2.2, 0, 2.2]) {
      this.pipeRoute(group, [[x, 0.73, 1.42], [x, 0.73, 0.98]], 0.15, this.redPipe);
      this.pipeRoute(group, [[x, 0.73, -1.42], [x, 0.73, -0.98]], 0.15, this.purplePipe);
    }
  }

  private createExhaustStack(): void {
    const group = this.component('exhaust-stack');
    const stack = this.cylinder(group, 0.43, 4.6, this.purplePipe, [5.18, 3.15, -1.42], true);
    stack.name = 'Purified gas exhaust stack';
    this.cylinder(group, 0.53, 0.12, this.darkSteel, [5.18, 0.88, -1.42]);
    this.cylinder(group, 0.53, 0.12, this.darkSteel, [5.18, 5.42, -1.42]);
    this.cylinder(group, 0.33, 0.72, this.purplePipe, [5.18, 5.74, -1.42]);
    this.cylinder(group, 0.62, 0.08, this.steel, [5.18, 6.14, -1.42]);
    this.cylinder(group, 0.72, 0.42, this.steel, [5.18, 6.38, -1.42]);
    this.box(group, [1.35, 0.07, 0.07], this.darkSteel, [5.18, 3.55, -1.42]);
  }

  private createFrameSupport(): void {
    const group = this.component('frame-support');
    this.box(group, [7.9, 0.16, 2.65], this.darkSteel, [0, 0.08, 0], true);
    for (const x of [-3.25, -1.1, 1.1, 3.25]) {
      for (const z of [-1.08, 1.08]) this.box(group, [0.13, 0.86, 0.13], this.darkSteel, [x, 0.51, z]);
    }
    for (const x of [-3.25, 3.25]) {
      this.box(group, [0.12, 5.35, 0.12], this.darkSteel, [x, 3.45, -1.1]);
      this.box(group, [0.12, 5.35, 0.12], this.darkSteel, [x, 3.45, 1.1]);
    }
    this.box(group, [6.65, 0.11, 0.11], this.darkSteel, [0, 6.02, 1.1]);
    this.box(group, [6.65, 0.11, 0.11], this.darkSteel, [0, 6.02, -1.1]);
    // Front maintenance platform, guard rail and access ladder shown with the
    // support steelwork in the process drawing.
    this.box(group, [7.05, 0.1, 0.72], this.darkSteel, [0, 4.72, 1.38]);
    for (const x of [-3.35, -2.2, -1.1, 0, 1.1, 2.2, 3.35]) {
      this.box(group, [0.055, 0.8, 0.055], this.darkSteel, [x, 5.12, 1.68]);
    }
    this.box(group, [6.75, 0.055, 0.055], this.darkSteel, [0, 5.48, 1.68]);
    for (let rung = 0; rung < 11; rung += 1) {
      this.box(group, [0.72, 0.045, 0.045], this.darkSteel, [3.72, 0.55 + rung * 0.38, 1.58]);
    }
    for (const x of [3.38, 4.06]) this.box(group, [0.055, 4.25, 0.055], this.darkSteel, [x, 2.45, 1.58]);
  }

  private component(id: string): Group {
    const group = new Group();
    group.name = id;
    group.userData.componentId = id;
    this.object.add(group);
    return group;
  }

  private pipeRoute(group: Group, route: readonly Point[], radius: number, material: Material): void {
    for (let index = 1; index < route.length; index += 1) this.pipeSegment(group, radius, material, route[index - 1], route[index]);
    for (let index = 1; index < route.length - 1; index += 1) {
      const elbow = new Mesh(this.geometry(new SphereGeometry(radius * 1.06, 12, 8)), material);
      elbow.position.set(...route[index]);
      group.add(elbow);
    }
  }

  private pipeSegment(group: Group, radius: number, material: Material, start: Point, end: Point): void {
    const startVector = new Vector3(...start);
    const endVector = new Vector3(...end);
    const mesh = new Mesh(this.geometry(new CylinderGeometry(radius, radius, 1, 14)), material);
    mesh.position.copy(startVector).add(endVector).multiplyScalar(0.5);
    mesh.scale.y = startVector.distanceTo(endVector);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), endVector.clone().sub(startVector).normalize());
    mesh.castShadow = true;
    group.add(mesh);
  }

  private box(group: Group, size: Point, material: Material, position: Point, shadow = false): Mesh {
    const mesh = new Mesh(this.geometry(new BoxGeometry(...size)), material);
    mesh.position.set(...position);
    mesh.castShadow = shadow;
    group.add(mesh);
    return mesh;
  }

  private cylinder(group: Group, radius: number, height: number, material: Material, position: Point, shadow = false): Mesh {
    const mesh = new Mesh(this.geometry(new CylinderGeometry(radius, radius, height, 20)), material);
    mesh.position.set(...position);
    mesh.castShadow = shadow;
    group.add(mesh);
    return mesh;
  }

  private geometry<T extends BufferGeometry>(geometry: T): T { this.geometries.push(geometry); return geometry; }
  private material<T extends Material>(material: T): T { this.materials.push(material); return material; }
}
