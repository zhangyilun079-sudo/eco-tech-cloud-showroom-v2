import type { ExhibitVector3 } from '../ExhibitDefinition';

export interface RtoAssetAnnotation {
  readonly componentId: string;
  readonly objectName: string;
  readonly anchor: ExhibitVector3;
}

/**
 * Stable semantic anchors for the reconstructed master asset.  Keeping these
 * outside the GLB means a future author-supplied model can replace the file
 * without changing Viewer, process, or technology-mode code.
 */
export const rtoAnnotations: readonly RtoAssetAnnotation[] = [
  { componentId: 'thermal-bed-a', objectName: 'thermal-bed-a', anchor: { x: -2.35, y: 3.7, z: 1.05 } },
  { componentId: 'thermal-bed-b', objectName: 'thermal-bed-b', anchor: { x: 0, y: 3.7, z: 1.05 } },
  { componentId: 'thermal-bed-c', objectName: 'thermal-bed-c', anchor: { x: 2.35, y: 3.7, z: 1.05 } },
  { componentId: 'combustion-chamber', objectName: 'combustion-chamber', anchor: { x: 0, y: 6.05, z: 1.2 } },
  { componentId: 'burner', objectName: 'burner', anchor: { x: -3.7, y: 5.9, z: 1.05 } },
  { componentId: 'blower-fan', objectName: 'blower-fan', anchor: { x: -4.9, y: 2.1, z: 1.65 } },
  { componentId: 'heat-exchanger', objectName: 'heat-exchanger', anchor: { x: -5.18, y: 4.2, z: 0.3 } },
  { componentId: 'valve-manifold', objectName: 'valve-manifold', anchor: { x: 0, y: 1.72, z: 1.55 } },
  { componentId: 'pipeline-network', objectName: 'pipeline-network', anchor: { x: 0, y: 2.2, z: 1.65 } },
  { componentId: 'exhaust-stack', objectName: 'exhaust-stack', anchor: { x: 5.18, y: 4, z: -0.7 } },
] as const;
