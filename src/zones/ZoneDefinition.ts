import type { Vector3Tuple } from 'three';
import type { ShowroomZoneId } from '../showroom/Showroom';

export interface ZoneExhibitAnchorDefinition {
  readonly id: string;
  readonly label: string;
  readonly position: Vector3Tuple;
  readonly status: 'connected' | 'placeholder';
}

/** Data-only contract shared by zone navigation and future zone content. */
export interface ZoneDefinition {
  readonly id: ShowroomZoneId;
  readonly title: string;
  readonly englishTitle: string;
  readonly description: string;
  readonly accent: string;
  readonly sceneOrigin: Vector3Tuple;
  /** Offset from the clicked showroom hotspot to the zone threshold. */
  readonly entryPosition: Vector3Tuple;
  /** Normalized direction from the threshold toward the zone interior. */
  readonly entryDirection: Vector3Tuple;
  readonly cameraTarget: Vector3Tuple;
  readonly exhibitAnchors: readonly ZoneExhibitAnchorDefinition[];
}
