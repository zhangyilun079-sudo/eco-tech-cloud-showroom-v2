import type { Object3D } from 'three';

export interface ExhibitMetadata {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly impactLabel?: string;
}

export interface Exhibit {
  readonly object: Object3D;
  readonly metadata: ExhibitMetadata;
  update(deltaSeconds: number): void;
  dispose(): void;
}
