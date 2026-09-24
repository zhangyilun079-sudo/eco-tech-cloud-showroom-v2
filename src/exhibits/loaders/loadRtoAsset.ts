import {
  BufferGeometry, Float32BufferAttribute, Group, Material, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Texture, TextureLoader,
} from 'three';
import { rtoAnnotations } from '../annotations/rtoAnnotations';

export type RtoAssetMode = 'reference-relief' | 'real-gltf';

/**
 * Current source of truth: the user-supplied exhibit image itself.
 *
 * Unlike the previous flat-image implementation, this route reconstructs a
 * genuine multi-part 3D relief mesh from the source image at runtime. The
 * verified front view stays faithful to the exhibit image while shallow depth,
 * separate semantic parts, side walls and limited rotation provide real 3D
 * parallax. A future verified source model can replace this provider without
 * changing Viewer, Zone, hotspot or navigation code.
 */
export const RTO_ASSET_MODE: RtoAssetMode = 'reference-relief';
export const RTO_REFERENCE_IMAGE_URL = '/assets/images/rto-three-bed-reference.png';

const MODEL_WIDTH = 12;
const GRID_COLUMNS = 180;

interface GridData {
  readonly columns: number;
  readonly rows: number;
  readonly modelHeight: number;
  readonly assignment: readonly string[];
}

const frontDepth: Readonly<Record<string, number>> = {
  'thermal-bed-a': 0.58,
  'thermal-bed-b': 0.60,
  'thermal-bed-c': 0.58,
  'combustion-chamber': 0.53,
  burner: 0.68,
  'blower-fan': 0.66,
  'heat-exchanger': 0.63,
  'exhaust-stack': 0.57,
  'valve-manifold': 0.65,
  'pipeline-network': 0.69,
  'frame-support': 0.50,
};

const bodyThickness: Readonly<Record<string, number>> = {
  'thermal-bed-a': 0.62,
  'thermal-bed-b': 0.62,
  'thermal-bed-c': 0.62,
  'combustion-chamber': 0.78,
  burner: 0.42,
  'blower-fan': 0.72,
  'heat-exchanger': 0.50,
  'exhaust-stack': 0.58,
  'valve-manifold': 0.42,
  'pipeline-network': 0.28,
  'frame-support': 0.40,
};

let masterAsset: Promise<Group> | null = null;
let referenceTexture: Promise<Texture> | null = null;

function getReferenceTexture(): Promise<Texture> {
  referenceTexture ??= new TextureLoader().loadAsync(RTO_REFERENCE_IMAGE_URL).then((texture) => {
    texture.name = 'RTO original exhibit texture';
    return texture;
  });
  return referenceTexture;
}

function imageSize(texture: Texture): { width: number; height: number } {
  const image = texture.image as {
    naturalWidth?: number;
    naturalHeight?: number;
    width?: number;
    height?: number;
  } | undefined;
  return {
    width: image?.naturalWidth ?? image?.width ?? 1677,
    height: image?.naturalHeight ?? image?.height ?? 1280,
  };
}

function isNearWhite(r: number, g: number, b: number): boolean {
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  return min > 224 && max - min < 24;
}

function buildGrid(texture: Texture): GridData {
  const source = texture.image as CanvasImageSource;
  const size = imageSize(texture);
  const columns = GRID_COLUMNS;
  const rows = Math.max(2, Math.round(columns * size.height / size.width));
  const canvas = document.createElement('canvas');
  canvas.width = columns;
  canvas.height = rows;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('RTO relief reconstruction canvas is unavailable.');
  context.drawImage(source, 0, 0, columns, rows);
  const pixels = context.getImageData(0, 0, columns, rows).data;

  // Only border-connected near-white pixels are treated as background. This
  // preserves internal white labels and instrument plates from the real exhibit.
  const candidate = new Uint8Array(columns * rows);
  for (let i = 0; i < candidate.length; i += 1) {
    const offset = i * 4;
    candidate[i] = isNearWhite(pixels[offset], pixels[offset + 1], pixels[offset + 2]) ? 1 : 0;
  }
  const background = new Uint8Array(columns * rows);
  const queue = new Int32Array(columns * rows);
  let head = 0;
  let tail = 0;
  const enqueue = (x: number, y: number): void => {
    if (x < 0 || x >= columns || y < 0 || y >= rows) return;
    const index = y * columns + x;
    if (!candidate[index] || background[index]) return;
    background[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < columns; x += 1) {
    enqueue(x, 0);
    enqueue(x, rows - 1);
  }
  for (let y = 0; y < rows; y += 1) {
    enqueue(0, y);
    enqueue(columns - 1, y);
  }
  while (head < tail) {
    const index = queue[head++];
    const x = index % columns;
    const y = Math.floor(index / columns);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  const annotations = [...rtoAnnotations].sort(
    (a, b) => (b.interactionLayer ?? 1) - (a.interactionLayer ?? 1),
  );
  const assignment = Array<string>(columns * rows).fill('');
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const index = y * columns + x;
      if (background[index]) continue;
      const u = (x + 0.5) / columns;
      const v = (y + 0.5) / rows;
      const annotation = annotations.find(({ bounds }) => (
        u >= bounds.x && u <= bounds.x + bounds.width
        && v >= bounds.y && v <= bounds.y + bounds.height
      ));
      assignment[index] = annotation?.componentId ?? 'frame-support';
    }
  }

  return {
    columns,
    rows,
    modelHeight: MODEL_WIDTH * size.height / size.width,
    assignment,
  };
}

function createFrontGeometry(
  componentId: string,
  grid: GridData,
  z: number,
): BufferGeometry {
  const { columns, rows, modelHeight, assignment } = grid;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const vertexMap = new Map<number, number>();

  const vertex = (x: number, y: number): number => {
    const key = y * (columns + 1) + x;
    const existing = vertexMap.get(key);
    if (existing !== undefined) return existing;
    const u = x / columns;
    const v = y / rows;
    const index = vertices.length / 3;
    vertices.push((u - 0.5) * MODEL_WIDTH, (1 - v) * modelHeight, z);
    uvs.push(u, 1 - v);
    vertexMap.set(key, index);
    return index;
  };

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (assignment[y * columns + x] !== componentId) continue;
      const a = vertex(x, y);
      const b = vertex(x + 1, y);
      const c = vertex(x + 1, y + 1);
      const d = vertex(x, y + 1);
      indices.push(a, d, c, a, c, b);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function createBodyGeometry(
  componentId: string,
  grid: GridData,
  frontZ: number,
  thickness: number,
): BufferGeometry {
  const { columns, rows, modelHeight, assignment } = grid;
  const backZ = frontZ - thickness;
  const vertices: number[] = [];
  const indices: number[] = [];

  const pushQuad = (
    ax: number, ay: number,
    bx: number, by: number,
  ): void => {
    const x1 = (ax / columns - 0.5) * MODEL_WIDTH;
    const y1 = (1 - ay / rows) * modelHeight;
    const x2 = (bx / columns - 0.5) * MODEL_WIDTH;
    const y2 = (1 - by / rows) * modelHeight;
    const base = vertices.length / 3;
    vertices.push(
      x1, y1, frontZ,
      x2, y2, frontZ,
      x2, y2, backZ,
      x1, y1, backZ,
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  // Side walls only along semantic/silhouette boundaries. This is what turns
  // the original front image into a true 3D relief instead of another flat card.
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (assignment[y * columns + x] !== componentId) continue;
      const neighbor = (nx: number, ny: number): boolean => (
        nx >= 0 && nx < columns && ny >= 0 && ny < rows
        && assignment[ny * columns + nx] === componentId
      );
      if (!neighbor(x, y - 1)) pushQuad(x, y, x + 1, y);
      if (!neighbor(x + 1, y)) pushQuad(x + 1, y, x + 1, y + 1);
      if (!neighbor(x, y + 1)) pushQuad(x + 1, y + 1, x, y + 1);
      if (!neighbor(x - 1, y)) pushQuad(x, y + 1, x, y);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function cloneMaterial(material: Material | Material[]): Material | Material[] {
  return Array.isArray(material) ? material.map((item) => item.clone()) : material.clone();
}

function cloneAsset(source: Group): Group {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry = object.geometry.clone();
    object.material = cloneMaterial(object.material);
  });
  return clone;
}

async function buildMasterAsset(): Promise<Group> {
  const texture = await getReferenceTexture();
  const grid = buildGrid(texture);
  const root = new Group();
  root.name = 'RTO high-fidelity single-view relief master';

  const frontMaterial = new MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  });
  const bodyMaterial = new MeshStandardMaterial({
    color: '#332b3f',
    roughness: 0.52,
    metalness: 0.22,
  });

  const componentIds = [...rtoAnnotations.map(({ componentId }) => componentId), 'frame-support'];
  componentIds.forEach((componentId) => {
    const z = frontDepth[componentId] ?? 0.5;
    const thickness = bodyThickness[componentId] ?? 0.4;
    const group = new Group();
    group.name = componentId;

    const front = new Mesh(
      createFrontGeometry(componentId, grid, z),
      frontMaterial.clone(),
    );
    front.name = `${componentId}-textured-front`;
    front.userData.rtoReliefFront = true;

    const body = new Mesh(
      createBodyGeometry(componentId, grid, z, thickness),
      bodyMaterial.clone(),
    );
    body.name = `${componentId}-relief-depth`;
    body.userData.rtoReliefDepth = true;

    const annotation = rtoAnnotations.find((item) => item.componentId === componentId);
    if (annotation) {
      const centerX = (annotation.bounds.x + annotation.bounds.width / 2 - 0.5) * MODEL_WIDTH;
      const centerY = (1 - annotation.bounds.y - annotation.bounds.height / 2) * grid.modelHeight;
      group.userData.componentLabelAnchor = { x: centerX, y: centerY, z: z + 0.08 };
    }

    group.add(front, body);
    root.add(group);
  });

  root.userData.assetMode = 'reference-relief';
  root.userData.assetUrl = RTO_REFERENCE_IMAGE_URL;
  root.userData.sourceViewVerified = true;
  root.userData.unseenSurfacesInferred = true;
  root.userData.modelSize = { width: MODEL_WIDTH, height: grid.modelHeight };
  return root;
}

function getMasterAsset(): Promise<Group> {
  masterAsset ??= buildMasterAsset();
  return masterAsset;
}

/**
 * Creates an independently transformable real 3D relief instance.
 * A future verified GLTF can replace the implementation behind this same API.
 */
export async function loadRtoAsset(mode: RtoAssetMode = RTO_ASSET_MODE): Promise<Group> {
  if (mode === 'real-gltf') {
    throw new Error('RTO real-gltf mode is reserved until a verified source model is supplied.');
  }
  return cloneAsset(await getMasterAsset());
}
