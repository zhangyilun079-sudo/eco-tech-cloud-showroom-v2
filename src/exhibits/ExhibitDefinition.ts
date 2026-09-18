/** A JSON-friendly 3D vector used by exhibit data before Three.js objects exist. */
export interface ExhibitVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Euler angles in radians, applied in XYZ order by default. */
export interface ExhibitRotation extends ExhibitVector3 {
  readonly order?: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';
}

/** Identifies a model asset and, optionally, a named object within that asset. */
export interface ExhibitObjectReference {
  readonly assetId: string;
  readonly objectName?: string;
}

/** Content and placement data for a component annotation. */
export interface ExhibitLabel {
  readonly title: string;
  readonly description?: string;
  readonly anchorPosition: ExhibitVector3;
}

/**
 * A separately addressable part of an exhibit.
 *
 * `position` is its assembled transform and `explodePosition` is the target for
 * a future exploded-view animation. Model references intentionally remain null
 * until production assets are available.
 */
export interface ExhibitComponentDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly objectReference: ExhibitObjectReference | null;
  readonly position: ExhibitVector3;
  readonly rotation: ExhibitRotation;
  readonly explodePosition: ExhibitVector3;
  readonly label: ExhibitLabel;
}

/** The content and scene contract shared by exhibit UI, viewers, and loaders. */
export interface ExhibitDefinition {
  readonly id: string;
  readonly title: string;
  readonly technologyCategory: string;
  readonly description: string;
  readonly processOverview: string;
  readonly keyFeatures: readonly string[];
  readonly components: readonly ExhibitComponentDefinition[];
  /** Optional presentation copy retained for the current showcase panel. */
  readonly impactLabel?: string;
}
