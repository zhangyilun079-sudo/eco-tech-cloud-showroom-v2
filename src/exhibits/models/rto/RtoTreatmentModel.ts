import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
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
  private readonly textures: CanvasTexture[] = [];
  private readonly steel = this.material(new MeshPhysicalMaterial({ color: '#b9c0bf', roughness: 0.28, metalness: 0.78, clearcoat: 0.25 }));
  private readonly darkSteel = this.material(new MeshStandardMaterial({ color: '#263739', roughness: 0.45, metalness: 0.72 }));
  private readonly refractory = this.material(new MeshStandardMaterial({ color: '#d5cab6', roughness: 0.82, metalness: 0.04 }));
  private readonly ceramic = this.material(new MeshStandardMaterial({ color: '#c8864f', roughness: 0.86, metalness: 0.03 }));
  private readonly ceramicDark = this.material(new MeshStandardMaterial({ color: '#855332', roughness: 0.9 }));
  private readonly redPipe = this.material(new MeshStandardMaterial({ color: '#c9483e', roughness: 0.37, metalness: 0.48 }));
  private readonly yellowPipe = this.material(new MeshStandardMaterial({ color: '#e0ae2d', roughness: 0.4, metalness: 0.42 }));
  private readonly purplePipe = this.material(new MeshStandardMaterial({ color: '#76519a', roughness: 0.38, metalness: 0.5 }));
  private readonly purpleFrame = this.material(new MeshStandardMaterial({ color: '#67418b', roughness: 0.31, metalness: 0.48 }));
  private readonly greyPipe = this.material(new MeshStandardMaterial({ color: '#7f898a', roughness: 0.4, metalness: 0.62 }));
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
    this.createCombustionChamber();
    this.createBurner();
    this.createBlowerFan();
    this.createHeatExchanger();
    this.createValveManifold();
    this.createPipelineNetwork();
    this.createExhaustStack();
    this.createAnnotations();
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.object.clear();
  }

  private createThermalBed(id: string, x: number, designation: string): void {
    const group = this.component(id);
    // The drawing is a true front section: only the back skin and purple section
    // frame remain, so the complete ceramic matrix is readable from the hero view.
    this.box(group, [1.82, 3.32, 0.12], this.steel, [x, 3.0, -0.72], true);
    this.box(group, [0.12, 3.42, 1.55], this.purpleFrame, [x - 0.91, 3.0, 0]);
    this.box(group, [0.12, 3.42, 1.55], this.purpleFrame, [x + 0.91, 3.0, 0]);
    this.box(group, [1.94, 0.14, 1.58], this.purpleFrame, [x, 1.3, 0]);
    this.box(group, [1.94, 0.14, 2.02], this.darkSteel, [x, 4.66, 0]);

    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const brick = this.box(group, [0.205, 0.38, 1.38], (row + column) % 3 ? this.ceramic : this.ceramicDark,
          [x - 0.69 + column * 0.23, 1.62 + row * 0.4, 0.02], true);
        brick.name = `${designation} bed ceramic brick ${row + 1}-${column + 1}`;
      }
    }
    // Tapered lower transition shown in the source exhibit.
    const hopper = new Mesh(this.geometry(new ConeGeometry(0.92, 0.78, 4, 1, false, Math.PI / 4)), this.purpleFrame);
    hopper.position.set(x, 0.9, 0); hopper.rotation.y = Math.PI / 4; group.add(hopper);
    this.box(group, [0.44, 0.34, 0.72], this.darkSteel, [x, 0.42, 0]);
    for (const sx of [-0.72, 0.72]) this.box(group, [0.1, 0.9, 0.1], this.darkSteel, [x + sx, 0.45, -0.55]);
  }

  private createCombustionChamber(): void {
    const group = this.component('combustion-chamber');
    this.box(group, [6.78, 0.18, 1.86], this.purpleFrame, [0, 6.2, 0], true);
    this.box(group, [6.72, 1.42, 0.12], this.purpleFrame, [0, 5.49, -0.88], true);
    this.box(group, [0.18, 1.42, 1.86], this.purpleFrame, [-3.3, 5.49, 0]);
    this.box(group, [0.18, 1.42, 1.86], this.purpleFrame, [3.3, 5.49, 0]);
    this.box(group, [6.34, 0.09, 1.62], this.refractory, [0, 6.06, 0]);
    this.box(group, [6.34, 1.12, 0.08], this.refractory, [0, 5.48, -1.02]);
    // Open front reveals the common high-temperature volume and bed throats.
    this.box(group, [6.12, 0.72, 1.48], this.hotGas, [0, 5.45, 0]);
    for (const x of [-2.2, 0, 2.2]) {
      this.box(group, [1.65, 0.08, 1.78], this.darkSteel, [x, 4.78, 0]);
      for (const offset of [-0.55, 0, 0.55]) this.box(group, [0.08, 0.28, 1.7], this.refractory, [x + offset, 4.92, 0]);
    }
  }

  private createBurner(): void {
    const group = this.component('burner');
    this.cylinder(group, 0.26, 0.8, this.darkSteel, [0, 6.56, 0], true);
    this.cylinder(group, 0.4, 0.12, this.yellowPipe, [0, 6.18, 0]);
    this.box(group, [0.72, 0.52, 0.72], this.steel, [0, 6.96, 0], true);
    for (let index = 0; index < 3; index += 1) {
      const fire = new Mesh(this.geometry(new ConeGeometry(0.28 - index * 0.055, 0.78 + index * 0.16, 16)), this.flame);
      fire.position.set((index - 1) * 0.2, 5.77 - index * 0.15, 0.48);
      fire.rotation.z = Math.PI;
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
    this.box(group, [1.25, 2.1, 0.9], this.steel, [-5.18, 3.34, 0], true);
    this.box(group, [1.05, 1.78, 0.06], this.refractory, [-5.18, 3.34, 0.48]);
    for (let index = 0; index < 7; index += 1) {
      const tube = this.cylinder(group, 0.055, 1.62, this.purplePipe, [-5.58 + index * 0.135, 3.34, 0.53]);
      if (index % 2 === 1) tube.position.y += 0.08;
    }
    for (const y of [2.42, 4.26]) this.box(group, [1.42, 0.12, 1.02], this.darkSteel, [-5.18, y, 0]);
    for (const x of [-5.66, -4.7]) this.box(group, [0.12, 0.6, 0.12], this.darkSteel, [x, 2.02, 0]);
  }

  private createValveManifold(): void {
    const group = this.component('valve-manifold');
    const wheelGeometry = this.geometry(new TorusGeometry(0.24, 0.035, 7, 18));
    for (const x of [-2.2, 0, 2.2]) {
      for (const [z, material] of [[1.22, this.redPipe], [-0.92, this.purplePipe]] as const) {
        const valve = this.cylinder(group, 0.25, 0.48, this.valveMetal, [x, 0.42, z], true);
        valve.rotation.x = Math.PI / 2;
        const actuator = this.box(group, [0.42, 0.42, 0.42], material, [x, 0.78, z]);
        actuator.rotation.y = Math.PI / 4;
        const wheel = new Mesh(wheelGeometry, this.yellowPipe);
        wheel.position.set(x, 1.1, z);
        wheel.rotation.x = Math.PI / 2;
        group.add(wheel);
        this.pipeSegment(group, 0.13, material, [x, 0.42, z], [x, 0.42, z > 0 ? 0.45 : -0.45]);
      }
    }
  }

  private createPipelineNetwork(): void {
    const group = this.component('pipeline-network');
    const redRoutes: readonly Point[][] = [
      [[-4.2, 1.56, 1.2], [-3.72, 1.56, 1.2], [-3.72, 0.42, 1.22], [3.35, 0.42, 1.22]],
    ];
    const purpleRoutes: readonly Point[][] = [
      [[-3.35, 0.42, -0.92], [3.65, 0.42, -0.92], [3.65, 1.72, -0.92]],
      [[-5.18, 4.38, 0], [-5.18, 4.78, 0], [-3.35, 4.78, 0], [-3.35, 5.4, 0]],
    ];
    const yellowRoutes: readonly Point[][] = [
      [[-5.8, 1.9, -0.15], [-5.8, 1.9, 0.72], [-4.38, 1.9, 0.72]],
      [[-1.1, 6.83, 0.52], [-1.1, 6.45, 0.52], [-0.35, 6.45, 0.52]],
    ];
    redRoutes.forEach((route) => this.pipeRoute(group, route, 0.16, this.redPipe));
    purpleRoutes.forEach((route) => this.pipeRoute(group, route, 0.17, this.purplePipe));
    yellowRoutes.forEach((route) => this.pipeRoute(group, route, 0.11, this.yellowPipe));
    for (const x of [-2.2, 0, 2.2]) {
      this.pipeRoute(group, [[x, 0.42, 1.22], [x, 0.42, 0.45]], 0.15, this.redPipe);
      this.pipeRoute(group, [[x, 0.42, -0.92], [x, 0.42, -0.45]], 0.15, this.purplePipe);
      this.pipeRoute(group, [[x + 0.48, 0.62, 0.5], [x + 0.48, 1.18, 0.5]], 0.075, this.greyPipe);
    }
  }

  private createExhaustStack(): void {
    const group = this.component('exhaust-stack');
    const stack = this.cylinder(group, 0.38, 2.55, this.steel, [-6.3, 5.1, -0.25], true);
    stack.name = 'Purified gas exhaust stack';
    this.cylinder(group, 0.5, 0.12, this.darkSteel, [-6.3, 3.83, -0.25]);
    this.cylinder(group, 0.5, 0.12, this.darkSteel, [-6.3, 6.34, -0.25]);
    this.cylinder(group, 0.62, 0.12, this.purpleFrame, [-6.3, 6.45, -0.25]);
    this.pipeRoute(group, [[-5.8, 4.3, 0], [-6.3, 4.3, 0], [-6.3, 4.3, -0.25]], 0.17, this.purplePipe);
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
  }

  private createAnnotations(): void {
    const group = this.component('annotations');
    this.label(group, '燃烧室', [0, 5.52, 0.98], 1.25);
    this.label(group, '蓄热床 A', [-2.2, 3.1, 0.88], 1.12);
    this.label(group, '蓄热床 B', [0, 3.1, 0.88], 1.12);
    this.label(group, '蓄热床 C', [2.2, 3.1, 0.88], 1.12);
    this.label(group, '热交换器', [-5.18, 3.35, 0.62], 1.15);
    this.label(group, '净化气体', [-6.3, 6.78, 0.12], 1.05);
    this.label(group, '进气总管', [-3.75, 0.23, 1.42], 1.05);
    this.label(group, '切换阀', [0, 0.92, 1.52], 1.0);

    const instruments: readonly [string, Point][] = [
      ['TE', [-2.65, 4.65, 1.02]], ['TE', [2.65, 4.65, 1.02]],
      ['TIC', [0.72, 6.1, 1.02]], ['PI', [-5.72, 2.52, 0.62]],
      ['PE', [-4.35, 1.65, 1.42]], ['FIC', [-3.05, 0.78, 1.52]],
    ];
    instruments.forEach(([text, position]) => this.instrument(group, text, position));
  }

  private label(group: Group, text: string, position: Point, width: number): void {
    const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 112;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('RTO annotation canvas is unavailable.');
    context.fillStyle = 'rgba(255,255,255,.92)'; context.fillRect(2, 2, 380, 108);
    context.strokeStyle = '#60407c'; context.lineWidth = 6; context.strokeRect(3, 3, 378, 106);
    context.fillStyle = '#30243b'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = '600 44px sans-serif'; context.fillText(text, 192, 58);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; this.textures.push(texture);
    const plate = new Mesh(this.geometry(new PlaneGeometry(width, width * 0.292)), this.material(new MeshBasicMaterial({ map: texture, transparent: true, side: DoubleSide })));
    plate.position.set(...position); group.add(plate);
  }

  private instrument(group: Group, text: string, position: Point): void {
    const ring = new Mesh(this.geometry(new RingGeometry(0.19, 0.225, 28)), this.darkSteel);
    ring.position.set(...position); group.add(ring);
    this.label(group, text, [position[0], position[1], position[2] + 0.005], 0.42);
    this.pipeSegment(group, 0.025, this.greyPipe, [position[0], position[1] - 0.22, position[2]], [position[0], position[1] - 0.55, position[2] - 0.1]);
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
