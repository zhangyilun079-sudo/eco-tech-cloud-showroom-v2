import {
  BoxGeometry, BufferGeometry, CanvasTexture, CatmullRomCurve3, ConeGeometry,
  CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry,
  PointLight, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry,
  Vector3,
} from 'three';

const PART_IDS = [
  'thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c', 'combustion-chamber',
  'burner', 'blower-fan', 'heat-exchanger', 'exhaust-stack', 'valve-manifold',
  'pipeline-network', 'frame-support',
] as const;

type PartId = typeof PART_IDS[number];

const part = (root: Group, id: PartId): Group => {
  const group = new Group();
  group.name = id;
  root.add(group);
  return group;
};

const addMesh = (
  parent: Group,
  geometry: BufferGeometry,
  material: MeshStandardMaterial | MeshPhysicalMaterial | MeshBasicMaterial,
  position: readonly [number, number, number] = [0, 0, 0],
  rotation: readonly [number, number, number] = [0, 0, 0],
  name?: string,
): Mesh => {
  const mesh = new Mesh(geometry, material);
  if (name) mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

const createLabel = (
  text: string,
  width: number,
  height: number,
  position: readonly [number, number, number],
  fontSize = 44,
): Mesh => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('RTO label canvas unavailable.');
  context.fillStyle = 'rgba(250,247,238,.97)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(96,71,132,.22)';
  context.lineWidth = 3;
  context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  context.fillStyle = '#372f2b';
  context.font = `600 ${fontSize}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: DoubleSide });
  return addMesh(new Group(), new PlaneGeometry(width, height), material, position);
};

const createInstrument = (text: string, position: readonly [number, number, number], size = 0.48): Mesh => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('RTO instrument canvas unavailable.');
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = 'rgba(242,237,248,.98)';
  context.strokeStyle = '#4b2f86';
  context.lineWidth = 14;
  context.beginPath();
  context.arc(128, 128, 105, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#392a56';
  context.font = '700 70px Manrope, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 130);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: DoubleSide });
  return addMesh(new Group(), new PlaneGeometry(size, size), material, position);
};

const addInstrument = (parent: Group, text: string, position: readonly [number, number, number], size?: number): void => {
  const marker = createInstrument(text, position, size);
  parent.add(...marker.parent?.children ?? [marker]);
};

const createCeramicTexture = (): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('RTO ceramic texture canvas unavailable.');
  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, '#ffb247');
  gradient.addColorStop(0.45, '#e76627');
  gradient.addColorStop(1, '#bf3b24');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 32) {
      const n = ((x * 19 + y * 13) % 29) / 29;
      context.fillStyle = `rgba(255,220,130,${0.035 + n * 0.055})`;
      context.fillRect(x + 2, y + 2, 28, 28);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

const createRefractoryTexture = (): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('RTO refractory texture canvas unavailable.');
  const gradient = context.createRadialGradient(280, 130, 20, 280, 130, 300);
  gradient.addColorStop(0, '#ffbd55');
  gradient.addColorStop(0.36, '#f06c2c');
  gradient.addColorStop(1, '#a93122');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 256);
  context.strokeStyle = 'rgba(255,177,87,.3)';
  context.lineWidth = 3;
  for (let i = 0; i < 16; i += 1) {
    context.beginPath();
    const x = 30 + i * 28;
    context.moveTo(x, 235);
    context.quadraticCurveTo(x + (i < 8 ? 45 : -45), 120, x + (i < 8 ? 20 : -20), 10);
    context.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

const createFrustumGeometry = (
  topWidth: number,
  topDepth: number,
  bottomWidth: number,
  bottomDepth: number,
  height: number,
): BufferGeometry => {
  const yTop = height / 2;
  const yBottom = -height / 2;
  const vertices = new Float32Array([
    -topWidth / 2, yTop, -topDepth / 2,
    topWidth / 2, yTop, -topDepth / 2,
    topWidth / 2, yTop, topDepth / 2,
    -topWidth / 2, yTop, topDepth / 2,
    -bottomWidth / 2, yBottom, -bottomDepth / 2,
    bottomWidth / 2, yBottom, -bottomDepth / 2,
    bottomWidth / 2, yBottom, bottomDepth / 2,
    -bottomWidth / 2, yBottom, bottomDepth / 2,
  ]);
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0,
  ];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

const createPipe = (
  parent: Group,
  name: string,
  points: readonly (readonly [number, number, number])[],
  radius: number,
  material: MeshStandardMaterial,
): Mesh => {
  const curve = new CatmullRomCurve3(points.map((value) => new Vector3(...value)), false, 'centripetal', 0.25);
  const geometry = new TubeGeometry(curve, Math.max(24, points.length * 16), radius, 12, false);
  return addMesh(parent, geometry, material, [0, 0, 0], [0, 0, 0], name);
};

const createBeam = (
  parent: Group,
  name: string,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  thickness: number,
  material: MeshStandardMaterial,
): void => {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const delta = end.clone().sub(start);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const mesh = addMesh(parent, new BoxGeometry(thickness, thickness, delta.length()), material, [midpoint.x, midpoint.y, midpoint.z], [0, 0, 0], name);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), delta.normalize());
};

const addArrow = (
  parent: Group,
  name: string,
  position: readonly [number, number, number],
  direction: readonly [number, number, number],
  material: MeshStandardMaterial,
): void => {
  const mesh = addMesh(parent, new ConeGeometry(0.13, 0.34, 16), material, position, [0, 0, 0], name);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...direction).normalize());
};

export interface RtoHighFidelityAsset {
  readonly root: Group;
  readonly textures: readonly CanvasTexture[];
}

/**
 * Builds the production RTO exhibit synchronously so component controller
 * bindings exist before any Viewer interaction starts.
 *
 * The supplied image remains the strict front-view design reference. Geometry
 * depth behind that view is inferred because no verified rear/side source exists.
 */
export const createRtoHighFidelityModel = (): RtoHighFidelityAsset => {
  const root = new Group();
  root.name = 'Three-bed RTO high-fidelity 3D exhibit';
  root.userData.assetMode = 'high-fidelity-reconstruction';
  root.userData.sourceFrontViewVerified = true;
  root.userData.unseenSurfacesInferred = true;

  const parts = Object.fromEntries(PART_IDS.map((id) => [id, part(root, id)])) as Record<PartId, Group>;

  const ceramicTexture = createCeramicTexture();
  const refractoryTexture = createRefractoryTexture();
  const textures = [ceramicTexture, refractoryTexture];

  const purple = new MeshPhysicalMaterial({ color: '#3d2b8d', metalness: 0.46, roughness: 0.31, clearcoat: 0.25 });
  const purpleLight = new MeshPhysicalMaterial({ color: '#5b48bb', metalness: 0.38, roughness: 0.3, clearcoat: 0.32 });
  const ceramic = new MeshPhysicalMaterial({ map: ceramicTexture, color: '#f17a32', roughness: 0.62, metalness: 0.02 });
  const ceramicLight = new MeshPhysicalMaterial({ color: '#ffb24f', roughness: 0.55, metalness: 0.02 });
  const refractory = new MeshPhysicalMaterial({ map: refractoryTexture, color: '#f17a32', roughness: 0.55, metalness: 0.02 });
  const hot = new MeshStandardMaterial({ color: '#ff9d35', emissive: '#ff6424', emissiveIntensity: 1.1, roughness: 0.4 });
  const flame = new MeshStandardMaterial({ color: '#ffd95a', emissive: '#ff5d00', emissiveIntensity: 2.3, roughness: 0.2 });
  const silver = new MeshPhysicalMaterial({ color: '#cbd0d4', metalness: 0.9, roughness: 0.22, clearcoat: 0.3 });
  const steel = new MeshStandardMaterial({ color: '#686d73', metalness: 0.76, roughness: 0.36 });
  const darkSteel = new MeshStandardMaterial({ color: '#353a40', metalness: 0.78, roughness: 0.32 });
  const red = new MeshStandardMaterial({ color: '#d63a2d', metalness: 0.34, roughness: 0.32 });
  const yellow = new MeshStandardMaterial({ color: '#e8c729', metalness: 0.28, roughness: 0.33 });
  const violet = new MeshStandardMaterial({ color: '#71329a', metalness: 0.3, roughness: 0.35 });
  const teal = new MeshPhysicalMaterial({ color: '#5bb7ad', metalness: 0.4, roughness: 0.3, clearcoat: 0.28 });
  const green = new MeshPhysicalMaterial({ color: '#5bbda8', metalness: 0.35, roughness: 0.3, clearcoat: 0.35 });
  const grayPipe = new MeshStandardMaterial({ color: '#858b90', metalness: 0.68, roughness: 0.35 });
  const blue = new MeshPhysicalMaterial({ color: '#2e70bf', metalness: 0.42, roughness: 0.38 });

  const bedCenters = [-0.25, 1.65, 3.55] as const;
  const bedIds = ['thermal-bed-a', 'thermal-bed-b', 'thermal-bed-c'] as const;
  const bedWidth = 1.62;
  const bedBottom = 2.25;
  const bedTop = 4.55;

  bedIds.forEach((id, bedIndex) => {
    const group = parts[id];
    const centerX = bedCenters[bedIndex];
    addMesh(group, new BoxGeometry(bedWidth, bedTop - bedBottom, 1.85), purple, [centerX, (bedBottom + bedTop) / 2, -0.25], [0, 0, 0], `${id}-casing`);
    addMesh(group, new BoxGeometry(bedWidth - 0.18, bedTop - bedBottom - 0.16, 0.2), new MeshStandardMaterial({ color: '#c83d25', roughness: 0.58 }), [centerX, (bedBottom + bedTop) / 2, 0.68], [0, 0, 0], `${id}-ceramic-backing`);

    const columns = 5;
    const rows = 5;
    const tileGap = 0.095;
    const usableWidth = bedWidth - 0.28;
    const usableHeight = bedTop - bedBottom - 0.3;
    const tileWidth = (usableWidth - tileGap * (columns - 1)) / columns;
    const tileHeight = (usableHeight - tileGap * (rows - 1)) / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = centerX - usableWidth / 2 + tileWidth / 2 + column * (tileWidth + tileGap);
        const y = bedBottom + 0.15 + tileHeight / 2 + row * (tileHeight + tileGap);
        const tile = addMesh(group, new BoxGeometry(tileWidth, tileHeight, 0.14), row % 2 === column % 2 ? ceramic : ceramicLight, [x, y, 0.83], [0, 0, 0], `${id}-tile-${row}-${column}`);
        tile.castShadow = true;
      }
    }

    for (const x of [centerX - bedWidth / 2, centerX + bedWidth / 2]) {
      addMesh(group, new BoxGeometry(0.11, bedTop - bedBottom + 0.25, 0.24), purpleLight, [x, (bedBottom + bedTop) / 2, 0.9]);
    }
    addMesh(group, new BoxGeometry(bedWidth + 0.08, 0.12, 0.24), purpleLight, [centerX, bedTop + 0.05, 0.9]);
    addMesh(group, new BoxGeometry(bedWidth + 0.08, 0.12, 0.24), purpleLight, [centerX, bedBottom - 0.05, 0.9]);
    addMesh(group, createFrustumGeometry(bedWidth * 0.92, 1.55, 0.54, 0.72, 0.72), purple, [centerX, 1.84, -0.22], [0, 0, 0], `${id}-plenum`);
    const label = createLabel(`蓄热床${'ABC'[bedIndex]}`, 1.22, 0.42, [centerX, 4.38, 1.02], 42);
    group.add(label);
  });

  const chamber = parts['combustion-chamber'];
  const chamberShape = new Shape();
  chamberShape.moveTo(-1.15, 4.5);
  chamberShape.lineTo(-0.78, 5.65);
  chamberShape.lineTo(-0.05, 6.35);
  chamberShape.lineTo(3.95, 6.35);
  chamberShape.lineTo(4.7, 5.65);
  chamberShape.lineTo(5.05, 4.5);
  chamberShape.closePath();
  const chamberGeometry = new ExtrudeGeometry(chamberShape, { depth: 1.7, bevelEnabled: false });
  chamberGeometry.translate(0, 0, -1.25);
  addMesh(chamber, chamberGeometry, refractory, [0, 0, 0], [0, 0, 0], 'combustion-refractory-volume');

  const hotShape = new Shape();
  hotShape.moveTo(0.35, 4.85);
  hotShape.lineTo(0.55, 6.04);
  hotShape.lineTo(3.1, 6.04);
  hotShape.lineTo(3.4, 4.85);
  hotShape.closePath();
  const hotGeometry = new ExtrudeGeometry(hotShape, { depth: 0.16, bevelEnabled: false });
  hotGeometry.translate(0, 0, 0.55);
  addMesh(chamber, hotGeometry, hot, [0, 0, 0], [0, 0, 0], 'combustion-hot-core');

  const roofPoints: readonly (readonly [number, number, number])[] = [
    [-1.15, 4.5, 0.92], [-0.78, 5.65, 0.92], [-0.05, 6.35, 0.92],
    [3.95, 6.35, 0.92], [4.7, 5.65, 0.92], [5.05, 4.5, 0.92],
  ];
  for (let i = 0; i < roofPoints.length - 1; i += 1) {
    createBeam(chamber, `roof-beam-${i}`, roofPoints[i], roofPoints[i + 1], 0.12, purpleLight);
  }
  createBeam(chamber, 'chamber-lower-beam', [-1.14, 4.49, 0.92], [5.04, 4.49, 0.92], 0.12, purpleLight);
  for (const x of [0.7, 2.6]) addMesh(chamber, new BoxGeometry(0.15, 2.55, 0.25), purpleLight, [x, 3.55, 0.94]);

  for (const [base, sign] of [[-0.5, 1], [4.4, -1]] as const) {
    for (let index = 0; index < 7; index += 1) {
      createBeam(
        chamber,
        `refractory-rib-${base}-${index}`,
        [base + sign * index * 0.1, 4.8 + index * 0.07, 0.78],
        [base + sign * (0.35 + index * 0.1), 6.0 - index * 0.02, 0.78],
        0.045,
        new MeshStandardMaterial({ color: '#ffb34f', roughness: 0.55 }),
      );
    }
  }
  chamber.add(createLabel('燃烧室', 1.15, 0.42, [1.98, 5.1, 1.04], 42));
  const chamberGlow = new PointLight('#ff7426', 48, 9, 1.6);
  chamberGlow.position.set(2.0, 5.45, 0.2);
  chamber.add(chamberGlow);

  const burner = parts.burner;
  createPipe(burner, 'burner-feed-left', [[1.95, 6.95, 0.25], [1.95, 5.78, 0.25]], 0.075, grayPipe);
  createPipe(burner, 'burner-feed-right', [[2.15, 6.95, 0.25], [2.15, 5.78, 0.25]], 0.075, grayPipe);
  addMesh(burner, new CylinderGeometry(0.22, 0.22, 0.35, 24), darkSteel, [2.05, 5.7, 0.55], [Math.PI / 2, 0, 0], 'burner-nozzle');
  addMesh(burner, new SphereGeometry(0.22, 20, 14), flame, [2.05, 5.37, 0.82], [0, 0, 0], 'burner-flame-core');
  addMesh(burner, new ConeGeometry(0.2, 0.45, 20), flame, [2.05, 5.56, 0.82], [Math.PI, 0, 0], 'burner-flame');

  const support = parts['frame-support'];
  addMesh(support, new BoxGeometry(6.12, 0.16, 2.05), darkSteel, [1.95, 1.1, -0.25], [0, 0, 0], 'furnace-base');
  bedCenters.forEach((centerX) => {
    for (const deltaX of [-0.62, 0.62]) {
      addMesh(support, new BoxGeometry(0.12, 1.18, 0.12), steel, [centerX + deltaX, 1.1, -0.55]);
      addMesh(support, new BoxGeometry(0.12, 1.18, 0.12), steel, [centerX + deltaX, 1.1, 0.45]);
    }
    createBeam(support, `brace-a-${centerX}`, [centerX - 0.62, 0.55, -0.55], [centerX + 0.62, 1.65, -0.55], 0.08, steel);
    createBeam(support, `brace-b-${centerX}`, [centerX + 0.62, 0.55, -0.55], [centerX - 0.62, 1.65, -0.55], 0.08, steel);
  });
  addMesh(support, new BoxGeometry(0.42, 1.0, 1.5), purpleLight, [5.25, 4.1, -0.45], [0, 0, 0], 'side-control-cabinet');

  const stack = parts['exhaust-stack'];
  addMesh(stack, new CylinderGeometry(0.24, 0.3, 2.3, 28), silver, [-4.45, 3.4, -0.25], [0, 0, 0], 'stack-body');
  addMesh(stack, new ConeGeometry(0.38, 0.45, 28), silver, [-4.45, 2.18, -0.25], [0, 0, Math.PI], 'stack-base');
  addMesh(stack, new ConeGeometry(0.32, 0.35, 28), silver, [-4.45, 4.72, -0.25], [0, 0, 0], 'stack-cap');
  stack.add(createLabel('净化气体', 1.0, 0.34, [-4.45, 5.05, 0.24], 34));

  const blower = parts['blower-fan'];
  addMesh(blower, new BoxGeometry(1.55, 0.16, 1.0), steel, [-4.1, 0.48, 0.3], [0, 0, 0], 'blower-base');
  addMesh(blower, new CylinderGeometry(0.34, 0.34, 0.65, 28), silver, [-4.48, 1.0, 0.3], [0, 0, Math.PI / 2], 'blower-motor');
  for (let index = 0; index < 7; index += 1) {
    addMesh(blower, new TorusGeometry(0.36, 0.025, 8, 24), darkSteel, [-4.72 + index * 0.085, 1.0, 0.3], [0, Math.PI / 2, 0], `motor-fin-${index}`);
  }
  addMesh(blower, new CylinderGeometry(0.48, 0.48, 0.34, 30), darkSteel, [-3.85, 1.0, 0.3], [0, 0, Math.PI / 2], 'fan-housing');
  addMesh(blower, new CylinderGeometry(0.16, 0.16, 0.34, 18), violet, [-3.5, 1.0, 0.3], [0, 0, Math.PI / 2], 'fan-inlet');
  addMesh(blower, new BoxGeometry(0.34, 0.26, 0.3), blue, [-4.45, 0.66, 0.55], [0, 0, 0], 'blower-blue-pump');
  blower.add(createInstrument('P', [-3.72, 1.7, 0.74], 0.44));

  const exchanger = parts['heat-exchanger'];
  addMesh(exchanger, new BoxGeometry(1.05, 1.05, 0.62), purple, [-2.45, 2.85, 0.05], [0, 0, 0], 'heat-exchanger-body');
  addMesh(exchanger, new BoxGeometry(0.82, 0.78, 0.08), new MeshStandardMaterial({ color: '#b23a48', metalness: 0.2, roughness: 0.5 }), [-2.45, 2.85, 0.4], [0, 0, 0], 'heat-exchanger-face');
  createPipe(exchanger, 'heat-exchanger-coil', [[-2.7, 2.05, 0.5], [-2.7, 3.18, 0.5], [-2.22, 3.18, 0.5], [-2.22, 2.05, 0.5]], 0.055, grayPipe);
  exchanger.add(createLabel('热交换器', 1.05, 0.34, [-2.45, 1.8, 0.72], 32));

  const valves = parts['valve-manifold'];
  const branchMaterials = [violet, red, yellow] as const;
  bedCenters.forEach((centerX, bedIndex) => {
    [-0.48, 0, 0.48].forEach((offset, valveIndex) => {
      const x = centerX + offset;
      createPipe(valves, `valve-branch-${bedIndex}-${valveIndex}`, [[x, 1.5, 0.15], [x, 1.12, 0.15]], 0.07, branchMaterials[valveIndex]);
      addMesh(valves, new BoxGeometry(0.34, 0.26, 0.28), teal, [x, 0.95, 0.18], [0, 0, 0], `valve-body-${bedIndex}-${valveIndex}`);
      addMesh(valves, new TorusGeometry(0.16, 0.025, 8, 20), yellow, [x, 1.23, 0.34], [0, 0, 0], `valve-wheel-${bedIndex}-${valveIndex}`);
    });
  });
  addMesh(valves, new TorusGeometry(0.32, 0.05, 10, 28), green, [-0.7, 0.45, 0.75], [0, 0, 0], 'main-switch-wheel');
  createPipe(valves, 'main-switch-stem', [[-0.7, 0.45, 0.2], [-0.7, 0.45, 0.75]], 0.07, green);
  valves.add(createLabel('切换阀', 0.9, 0.3, [-0.15, 0.8, 1.08], 30));

  const pipes = parts['pipeline-network'];
  createPipe(pipes, 'yellow-inlet', [[-5.0, 0.25, 0.55], [-3.9, 0.25, 0.55], [-3.9, 0.45, 0.55], [-0.72, 0.45, 0.55], [4.5, 0.45, 0.55], [4.5, 1.0, 0.55]], 0.07, yellow);
  createPipe(pipes, 'yellow-upper', [[-3.55, 3.8, 0.35], [-2.8, 3.8, 0.35], [-2.8, 3.2, 0.35], [-1.7, 3.2, 0.35], [-1.7, 3.9, 0.35], [-1.0, 3.9, 0.35]], 0.06, yellow);
  createPipe(pipes, 'violet-clean', [[-4.45, 2.1, 0.55], [-3.8, 2.1, 0.55], [-3.8, 0.9, 0.55], [-1.0, 0.9, 0.55], [4.2, 0.9, 0.55]], 0.07, violet);
  createPipe(pipes, 'red-hot', [[-3.6, 3.75, 0.5], [-2.9, 3.75, 0.5], [-2.9, 3.2, 0.5], [-1.3, 3.2, 0.5], [-1.3, 1.0, 0.5], [4.0, 1.0, 0.5]], 0.07, red);
  bedCenters.forEach((centerX, index) => {
    createPipe(pipes, `red-drop-${index}`, [[centerX, 0.95, 0.5], [centerX, 0.5, 0.5]], 0.055, red);
    createPipe(pipes, `violet-drop-${index}`, [[centerX - 0.48, 0.95, 0.62], [centerX - 0.48, 0.68, 0.62]], 0.05, violet);
    createPipe(pipes, `yellow-drop-${index}`, [[centerX + 0.48, 0.95, 0.38], [centerX + 0.48, 0.68, 0.38]], 0.05, yellow);
  });
  createPipe(pipes, 'gray-auxiliary', [[-2.55, 3.0, 0.25], [-3.25, 3.0, 0.25], [-3.25, 2.3, 0.25], [-3.6, 2.3, 0.25]], 0.045, grayPipe);
  createPipe(pipes, 'gray-bottom', [[-1.2, 0.25, 0.25], [-1.2, 0.65, 0.25], [4.9, 0.65, 0.25]], 0.04, grayPipe);
  addArrow(pipes, 'yellow-flow-arrow', [-3.6, 0.25, 0.55], [1, 0, 0], yellow);
  addArrow(pipes, 'violet-flow-arrow', [0.8, 0.9, 0.55], [-1, 0, 0], violet);
  addArrow(pipes, 'red-flow-arrow', [2.3, 1.0, 0.5], [-1, 0, 0], red);
  pipes.add(createLabel('进气阀', 0.85, 0.3, [-4.75, 0.05, 0.95], 30));

  support.add(createInstrument('TT', [-0.3, 6.4, 1.15], 0.48));
  support.add(createInstrument('PI', [4.7, 6.1, 1.1], 0.48));
  support.add(createInstrument('TE', [4.7, 6.7, 1.1], 0.48));
  support.add(createInstrument('TIC', [-2.1, 3.42, 1.1], 0.46));
  support.add(createInstrument('FIC', [-2.1, 2.3, 1.1], 0.46));
  support.add(createInstrument('PE', [-2.4, 0.05, 1.1], 0.44));

  root.scale.setScalar(0.96);
  return { root, textures };
};
