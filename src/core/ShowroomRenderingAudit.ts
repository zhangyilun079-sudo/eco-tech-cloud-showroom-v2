import {
  AdditiveBlending,
  BufferGeometry,
  Line,
  LineLoop,
  LineSegments,
  Material,
  Mesh,
  Object3D,
  Points,
} from 'three';

export interface RenderingAuditStats {
  objects: number;
  meshes: number;
  lines: number;
  triangles: number;
  estimatedDrawCalls: number;
  materials: number;
}

export interface ShowroomRenderingAuditReport {
  categories: Record<ShowroomAuditCategory, RenderingAuditStats>;
  transparentMaterials: number;
  additiveBlendingMaterials: number;
  lineSegments: number;
}

type ShowroomAuditCategory =
  | 'architecture'
  | 'centralDataCore'
  | 'zonePortals'
  | 'holographicElements'
  | 'digitalScreens'
  | 'decorativeStructures'
  | 'linesWireframeObjects'
  | 'transparentObjects';

const CATEGORY_NAMES: readonly ShowroomAuditCategory[] = [
  'architecture',
  'centralDataCore',
  'zonePortals',
  'holographicElements',
  'digitalScreens',
  'decorativeStructures',
  'linesWireframeObjects',
  'transparentObjects',
];

const SCREEN_PATTERN = /display|screen|signage|indicator|data surface|metric panel|terminal/i;
const HOLOGRAM_PATTERN = /holograph|projection|technical model shell|projector/i;
const DECORATIVE_PATTERN = /ambient data particles|navigation data ring|luminous ceiling ring|guidance light|cadence light|beacon|boundary|threshold/i;

/**
 * Console-only showroom diagnostics. Cross-cutting categories (lines and
 * transparency) deliberately overlap the ownership categories so a costly
 * object remains attributable to both its feature and its render technique.
 */
export function auditShowroomRendering(showroom: Object3D): ShowroomRenderingAuditReport {
  const objects = visibleDescendants(showroom);
  const centralCore = objects.find((object) => object.name === 'Smart ecological data core');
  const categoryObjects = new Map(CATEGORY_NAMES.map((category) => [category, [] as Object3D[]]));
  const allMaterials = new Set<Material>();

  objects.forEach((object) => {
    getMaterials(object).forEach((material) => allMaterials.add(material));
    const path = ancestorNames(object, showroom);
    const inCentralCore = centralCore ? isDescendantOf(object, centralCore) : false;
    const inZone = path.some((name) => /ZONE_\d+ double-height intelligent projection bay/.test(name));
    const inHologram = path.some((name) => HOLOGRAM_PATTERN.test(name));
    const isScreen = path.some((name) => SCREEN_PATTERN.test(name));
    const isDecorative = path.some((name) => DECORATIVE_PATTERN.test(name));
    const materials = getMaterials(object);

    if (!inCentralCore && !inZone && !isDecorative) add(categoryObjects, 'architecture', object);
    if (inCentralCore) add(categoryObjects, 'centralDataCore', object);
    if (inZone && !inHologram && !isScreen && !isDecorative) add(categoryObjects, 'zonePortals', object);
    if (inHologram) add(categoryObjects, 'holographicElements', object);
    if (isScreen) add(categoryObjects, 'digitalScreens', object);
    if (isDecorative) add(categoryObjects, 'decorativeStructures', object);
    if (object instanceof Line || materials.some(isWireframeMaterial)) {
      add(categoryObjects, 'linesWireframeObjects', object);
    }
    if (materials.some((material) => material.transparent)) add(categoryObjects, 'transparentObjects', object);
  });

  return {
    categories: Object.fromEntries(CATEGORY_NAMES.map((category) => [
      category,
      summarize(categoryObjects.get(category) ?? []),
    ])) as Record<ShowroomAuditCategory, RenderingAuditStats>,
    transparentMaterials: [...allMaterials].filter((material) => material.transparent).length,
    additiveBlendingMaterials: [...allMaterials].filter((material) => material.blending === AdditiveBlending).length,
    lineSegments: objects.filter((object) => object instanceof LineSegments).length,
  };
}

function summarize(objects: readonly Object3D[]): RenderingAuditStats {
  const materials = new Set<Material>();
  let meshes = 0;
  let lines = 0;
  let triangles = 0;
  let estimatedDrawCalls = 0;

  objects.forEach((object) => {
    const objectMaterials = getMaterials(object);
    objectMaterials.forEach((material) => materials.add(material));
    if (object instanceof Mesh) {
      meshes += 1;
      if (objectMaterials.some((material) => !isWireframeMaterial(material))) {
        triangles += primitiveCount(object.geometry, 3);
      }
      if (objectMaterials.some(isWireframeMaterial)) lines += wireframeLineCount(object.geometry);
    }
    if (object instanceof Line) lines += renderedLineCount(object);
    if (isRenderable(object)) estimatedDrawCalls += estimateDrawCalls(object, objectMaterials);
  });

  return { objects: objects.length, meshes, lines, triangles, estimatedDrawCalls, materials: materials.size };
}

function visibleDescendants(root: Object3D): Object3D[] {
  if (!root.visible) return [];
  const objects: Object3D[] = [];
  root.traverseVisible((object) => objects.push(object));
  return objects;
}

function ancestorNames(object: Object3D, root: Object3D): string[] {
  const names: string[] = [];
  let current: Object3D | null = object;
  while (current) {
    if (current.name) names.push(current.name);
    if (current === root) break;
    current = current.parent;
  }
  return names;
}

function isDescendantOf(object: Object3D, ancestor: Object3D): boolean {
  let current: Object3D | null = object;
  while (current) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

function getMaterials(object: Object3D): Material[] {
  if (!(object instanceof Mesh || object instanceof Line || object instanceof Points)) return [];
  return Array.isArray(object.material) ? object.material : [object.material];
}

function primitiveCount(geometry: BufferGeometry, verticesPerPrimitive: number): number {
  const vertices = geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0;
  return Math.floor(vertices / verticesPerPrimitive);
}

function renderedLineCount(line: Line): number {
  const vertices = line.geometry.index?.count ?? line.geometry.getAttribute('position')?.count ?? 0;
  if (line instanceof LineSegments) return Math.floor(vertices / 2);
  if (line instanceof LineLoop) return vertices;
  return Math.max(0, vertices - 1);
}

// Mirrors the renderer's indexed wireframe conversion closely enough to make
// the audit's line total directly comparable with renderer.info.render.lines.
function wireframeLineCount(geometry: BufferGeometry): number {
  const index = geometry.index;
  if (!index) return primitiveCount(geometry, 3) * 3;
  const edges = new Set<string>();
  for (let offset = 0; offset + 2 < index.count; offset += 3) {
    const a = index.getX(offset);
    const b = index.getX(offset + 1);
    const c = index.getX(offset + 2);
    for (const [start, end] of [[a, b], [b, c], [c, a]]) {
      edges.add(start < end ? `${start}:${end}` : `${end}:${start}`);
    }
  }
  return edges.size;
}

function isWireframeMaterial(material: Material): boolean {
  return 'wireframe' in material && material.wireframe === true;
}

function isRenderable(object: Object3D): object is Mesh | Line | Points {
  return object instanceof Mesh || object instanceof Line || object instanceof Points;
}

function estimateDrawCalls(object: Mesh | Line | Points, materials: readonly Material[]): number {
  if (materials.length <= 1) return 1;
  return object.geometry.groups.length || materials.length;
}

function add(categories: Map<ShowroomAuditCategory, Object3D[]>, category: ShowroomAuditCategory, object: Object3D): void {
  categories.get(category)?.push(object);
}
