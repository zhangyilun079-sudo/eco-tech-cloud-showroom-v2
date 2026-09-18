import type { Object3D } from 'three';
import type { ExhibitDefinition } from './ExhibitDefinition';

export type ExhibitMetadata = ExhibitDefinition;

export interface Exhibit {
  readonly object: Object3D;
  readonly metadata: ExhibitMetadata;
  update(deltaSeconds: number): void;
  dispose(): void;
}
