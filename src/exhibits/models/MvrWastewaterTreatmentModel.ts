import {
  BoxGeometry,
  BufferGeometry,
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
import type { Exhibit } from '../Exhibit';
import type { ExhibitDefinition } from '../ExhibitDefinition';

type Point = readonly [number, number, number];

/**
 * A deliberately compact process plant model. Its proportions follow a real
 * skid-mounted MVR line while remaining light enough to rotate in a browser.
 */
export class MvrWastewaterTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;

  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly stainless = this.material(new MeshPhysicalMaterial({
    color: '#b9c4c2', roughness: 0.32, metalness: 0.78, clearcoat: 0.16,
  }));
  private readonly darkSteel = this.material(new MeshStandardMaterial({
    color: '#29423f', roughness: 0.4, metalness: 0.72,
  }));
  private readonly platform = this.material(new MeshStandardMaterial({
    color: '#61736e', roughness: 0.68, metalness: 0.6,
  }));
  private readonly processBlue = this.material(new MeshStandardMaterial({
    color: '#287e8b', roughness: 0.32, metalness: 0.58,
  }));
  private readonly safety = this.material(new MeshStandardMaterial({
    color: '#e1a72c', roughness: 0.52, metalness: 0.32,
  }));
  private readonly cabinet = this.material(new MeshStandardMaterial({
    color: '#d8ded8', roughness: 0.48, metalness: 0.28,
  }));
  private readonly indicator = this.material(new MeshStandardMaterial({
    color: '#76e1b6', emissive: '#30b987', emissiveIntensity: 1.4, roughness: 0.25,
  }));

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'MVR wastewater treatment process plant';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;

    this.createStructuralFrame();
    this.createEvaporator();
    this.createHeatExchanger();
    this.createCrystallizer();
    this.createPumps();
    this.createPipeNetwork();
    this.createControlCabinet();
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.object.clear();
  }

  private createStructuralFrame(): void {
    const group = this.component('steel-support-frame');
    const columnGeometry = this.geometry(new BoxGeometry(0.14, 4.65, 0.14));
    const beamX = this.geometry(new BoxGeometry(6.25, 0.13, 0.13));
    const beamZ = this.geometry(new BoxGeometry(0.13, 0.13, 3.15));
    for (const x of [-3, 0, 3]) {
      for (const z of [-1.45, 1.45]) {
        const column = new Mesh(columnGeometry, this.darkSteel);
        column.position.set(x, 2.33, z);
        column.castShadow = true;
        group.add(column);
      }
    }
    for (const y of [0.42, 2.25, 4.55]) {
      for (const z of [-1.45, 1.45]) this.box(group, beamX, this.darkSteel, [0, y, z]);
      for (const x of [-3, 0, 3]) this.box(group, beamZ, this.darkSteel, [x, y, 0]);
    }

    const deckGeometry = this.geometry(new BoxGeometry(6.1, 0.08, 3));
    for (const y of [2.18, 4.48]) {
      const deck = new Mesh(deckGeometry, this.platform);
      deck.position.y = y;
      deck.receiveShadow = true;
      group.add(deck);
      this.addGuardRails(group, y + 0.46);
    }

    // Front access stair gives an immediate human-scale reference.
    const tread = this.geometry(new BoxGeometry(0.72, 0.08, 0.24));
    for (let index = 0; index < 9; index += 1) {
      this.box(group, tread, this.platform, [-2.58, 0.16 + index * 0.23, 1.75 + index * 0.18]);
    }
  }

  private addGuardRails(group: Group, railY: number): void {
    const post = this.geometry(new CylinderGeometry(0.025, 0.025, 0.88, 6));
    const longRail = this.geometry(new CylinderGeometry(0.025, 0.025, 6.05, 6));
    const sideRail = this.geometry(new CylinderGeometry(0.025, 0.025, 2.85, 6));
    for (const x of [-3, -1.5, 0, 1.5, 3]) {
      for (const z of [-1.45, 1.45]) this.cylinder(group, post, this.safety, [x, railY, z]);
    }
    for (const z of [-1.45, 1.45]) {
      const rail = this.cylinder(group, longRail, this.safety, [0, railY + 0.42, z]);
      rail.rotation.z = Math.PI / 2;
    }
    for (const x of [-3, 3]) {
      const rail = this.cylinder(group, sideRail, this.safety, [x, railY + 0.42, 0]);
      rail.rotation.x = Math.PI / 2;
    }
  }

  private createEvaporator(): void {
    const group = this.component('mvr-evaporation-unit');
    const shell = this.geometry(new CylinderGeometry(0.72, 0.72, 3.75, 24));
    this.cylinder(group, shell, this.stainless, [0.75, 2.45, -0.15], true);
    this.cylinder(group, this.geometry(new CylinderGeometry(0.72, 0.18, 0.72, 24)), this.stainless, [0.75, 0.22, -0.15], true);
    this.cylinder(group, this.geometry(new CylinderGeometry(0.18, 0.72, 0.55, 24)), this.stainless, [0.75, 4.6, -0.15], true);

    const band = this.geometry(new TorusGeometry(0.735, 0.045, 7, 24));
    for (const y of [0.72, 2.2, 3.72]) {
      const flange = new Mesh(band, this.darkSteel);
      flange.rotation.x = Math.PI / 2;
      flange.position.set(0.75, y, -0.15);
      group.add(flange);
    }
    const inspection = this.cylinder(group, this.geometry(new CylinderGeometry(0.22, 0.22, 0.18, 16)), this.darkSteel, [0.75, 2.75, 0.64]);
    inspection.rotation.x = Math.PI / 2;
  }

  private createHeatExchanger(): void {
    const group = this.component('heat-exchanger-module');
    for (const y of [0.92, 1.55]) {
      const barrel = this.cylinder(group, this.geometry(new CylinderGeometry(0.32, 0.32, 2.25, 18)), this.stainless, [-1.72, y, -0.45], true);
      barrel.rotation.z = Math.PI / 2;
      for (const x of [-2.85, -0.59]) {
        const flange = this.cylinder(group, this.geometry(new CylinderGeometry(0.4, 0.4, 0.09, 18)), this.processBlue, [x, y, -0.45]);
        flange.rotation.z = Math.PI / 2;
      }
    }
    for (const x of [-2.45, -1,]) this.box(group, this.geometry(new BoxGeometry(0.12, 0.82, 0.65)), this.darkSteel, [x, 0.58, -0.45]);
  }

  private createCrystallizer(): void {
    const group = this.component('crystallization-salt-separation-unit');
    this.cylinder(group, this.geometry(new CylinderGeometry(0.58, 0.58, 2.2, 20)), this.stainless, [2.15, 1.72, 0.05], true);
    this.cylinder(group, this.geometry(new CylinderGeometry(0.58, 0.14, 0.85, 20)), this.stainless, [2.15, 0.2, 0.05], true);
    this.cylinder(group, this.geometry(new CylinderGeometry(0.16, 0.58, 0.38, 20)), this.stainless, [2.15, 3.02, 0.05], true);
    const motor = this.cylinder(group, this.geometry(new CylinderGeometry(0.21, 0.21, 0.55, 12)), this.processBlue, [2.15, 3.48, 0.05]);
    motor.castShadow = true;
    this.box(group, this.geometry(new BoxGeometry(1.4, 0.28, 1.2)), this.darkSteel, [2.15, 0.18, 0.05]);
  }

  private createPumps(): void {
    const group = this.component('pump-system');
    const baseGeometry = this.geometry(new BoxGeometry(1.15, 0.12, 0.52));
    const motorGeometry = this.geometry(new CylinderGeometry(0.23, 0.23, 0.62, 12));
    const voluteGeometry = this.geometry(new SphereGeometry(0.28, 12, 8));
    for (const [x, z] of [[-1.9, 0.75], [-0.55, 0.75]] as const) {
      this.box(group, baseGeometry, this.darkSteel, [x, 0.17, z]);
      const motor = this.cylinder(group, motorGeometry, this.processBlue, [x - 0.18, 0.48, z], true);
      motor.rotation.z = Math.PI / 2;
      const volute = new Mesh(voluteGeometry, this.stainless);
      volute.position.set(x + 0.35, 0.48, z);
      volute.scale.set(0.75, 1, 1);
      volute.castShadow = true;
      group.add(volute);
    }
  }

  private createPipeNetwork(): void {
    const group = this.component('piping-system');
    const routes: readonly (readonly Point[])[] = [
      [[-2.85, 1.55, -0.45], [-3.15, 1.55, -0.45], [-3.15, 3.72, -0.45], [0.75, 3.72, -0.45]],
      [[0.75, 4.72, -0.15], [0.75, 5.08, -0.15], [2.15, 5.08, -0.15], [2.15, 3.25, 0.05]],
      [[2.15, 0.62, 0.05], [2.15, 0.62, 1.05], [-0.55, 0.62, 1.05]],
      [[-1.9, 0.62, 0.75], [-1.9, 1.08, 0.75], [-0.59, 1.08, 0.75]],
    ];
    const pipeGeometry = this.geometry(new CylinderGeometry(0.065, 0.065, 1, 10));
    for (const route of routes) {
      for (let index = 1; index < route.length; index += 1) {
        this.pipeSegment(group, pipeGeometry, route[index - 1], route[index]);
      }
      for (let index = 1; index < route.length - 1; index += 1) {
        const joint = new Mesh(this.geometry(new SphereGeometry(0.075, 10, 6)), this.processBlue);
        joint.position.set(...route[index]);
        group.add(joint);
      }
    }
  }

  private createControlCabinet(): void {
    const group = this.component('electrical-control-cabinet');
    this.box(group, this.geometry(new BoxGeometry(1.15, 1.65, 0.48)), this.cabinet, [2.25, 1.02, 1.18], true);
    this.box(group, this.geometry(new BoxGeometry(0.025, 1.5, 0.38)), this.darkSteel, [2.25, 1.02, 1.435]);
    this.box(group, this.geometry(new BoxGeometry(0.54, 0.32, 0.025)), this.processBlue, [2.25, 1.38, 1.46]);
    const light = this.geometry(new SphereGeometry(0.045, 8, 6));
    for (const x of [2.05, 2.25, 2.45]) {
      const lamp = new Mesh(light, this.indicator);
      lamp.position.set(x, 0.86, 1.47);
      group.add(lamp);
    }
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
    const pipe = new Mesh(geometry, this.processBlue);
    pipe.position.copy(startVector).add(endVector).multiplyScalar(0.5);
    pipe.scale.y = startVector.distanceTo(endVector);
    pipe.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), endVector.clone().sub(startVector).normalize());
    pipe.castShadow = true;
    group.add(pipe);
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

  private geometry<T extends BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private material<T extends Material>(material: T): T {
    this.materials.push(material);
    return material;
  }
}
