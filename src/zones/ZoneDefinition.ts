import type { Vector3Tuple } from 'three';
import type { ShowroomZoneId } from '../showroom/Showroom';

export interface ZoneExhibitAnchorDefinition {
  readonly id: string;
  readonly label: string;
  readonly position: Vector3Tuple;
}

/** Data-only contract shared by zone navigation and future zone content. */
export interface ZoneDefinition {
  readonly id: ShowroomZoneId;
  readonly title: string;
  readonly englishTitle: string;
  readonly description: string;
  readonly accent: string;
  readonly sceneOrigin: Vector3Tuple;
  readonly cameraPosition: Vector3Tuple;
  readonly cameraTarget: Vector3Tuple;
  readonly exhibitAnchors: readonly ZoneExhibitAnchorDefinition[];
}
