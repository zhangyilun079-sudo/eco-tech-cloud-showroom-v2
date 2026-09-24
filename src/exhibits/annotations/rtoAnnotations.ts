export interface NormalizedImageRect {
  /** Left edge measured from the source image's left edge, in the range 0..1. */
  readonly x: number;
  /** Top edge measured from the source image's top edge, in the range 0..1. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RtoAssetAnnotation {
  readonly componentId: string;
  readonly objectName: string;
  /**
   * Interactive region on the original RTO exhibit image. Coordinates use the
   * original image's top-left origin and remain valid at any display scale.
   */
  readonly bounds: NormalizedImageRect;
  /**
   * Larger background regions stay behind focused component regions so specific
   * parts win raycast selection when rectangles overlap.
   */
  readonly interactionLayer?: number;
}

/**
 * Image-space annotations for the user-supplied RTO exhibit itself.
 * These are deliberately independent from any future real 3D model. When a
 * verified GLTF is supplied, the asset provider can change without rewriting
 * the component metadata or Viewer navigation.
 */
export const rtoAnnotations: readonly RtoAssetAnnotation[] = [
  { componentId: 'thermal-bed-a', objectName: 'thermal-bed-a', bounds: { x: 0.374, y: 0.290, width: 0.135, height: 0.232 }, interactionLayer: 3 },
  { componentId: 'thermal-bed-b', objectName: 'thermal-bed-b', bounds: { x: 0.518, y: 0.290, width: 0.137, height: 0.232 }, interactionLayer: 3 },
  { componentId: 'thermal-bed-c', objectName: 'thermal-bed-c', bounds: { x: 0.661, y: 0.290, width: 0.135, height: 0.232 }, interactionLayer: 3 },
  { componentId: 'combustion-chamber', objectName: 'combustion-chamber', bounds: { x: 0.363, y: 0.108, width: 0.433, height: 0.210 }, interactionLayer: 2 },
  { componentId: 'burner', objectName: 'burner', bounds: { x: 0.548, y: 0.156, width: 0.080, height: 0.142 }, interactionLayer: 4 },
  { componentId: 'blower-fan', objectName: 'blower-fan', bounds: { x: 0.012, y: 0.532, width: 0.116, height: 0.212 }, interactionLayer: 3 },
  { componentId: 'heat-exchanger', objectName: 'heat-exchanger', bounds: { x: 0.185, y: 0.345, width: 0.100, height: 0.136 }, interactionLayer: 3 },
  { componentId: 'exhaust-stack', objectName: 'exhaust-stack', bounds: { x: 0.040, y: 0.230, width: 0.075, height: 0.278 }, interactionLayer: 3 },
  { componentId: 'valve-manifold', objectName: 'valve-manifold', bounds: { x: 0.372, y: 0.536, width: 0.420, height: 0.198 }, interactionLayer: 2 },
  { componentId: 'pipeline-network', objectName: 'pipeline-network', bounds: { x: 0.090, y: 0.252, width: 0.700, height: 0.700 }, interactionLayer: 1 },
] as const;
