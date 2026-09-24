import { Group } from 'three';
import type { Exhibit } from '../../Exhibit';
import type { ExhibitDefinition } from '../../ExhibitDefinition';
import { loadRtoAsset } from '../../loaders/loadRtoAsset';

/** Asset-backed three-bed RTO. No equipment geometry is authored at runtime. */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;
  private disposed = false;

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'Asset-backed three-bed RTO cutaway exhibit';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;
    this.object.userData.viewerConstraints = {
      heroRotationY: 0,
      minRotationY: -0.18,
      maxRotationY: 0.18,
      minRotationX: -0.08,
      maxRotationX: 0.08,
      autoRotate: false,
    };

    void loadRtoAsset().then((asset) => {
      if (!this.disposed) this.object.add(asset);
    }).catch((error: unknown) => {
      console.error('[RtoTreatmentModel] Unable to load master asset.', error);
    });
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    this.disposed = true;
    this.object.clear();
  }
}
