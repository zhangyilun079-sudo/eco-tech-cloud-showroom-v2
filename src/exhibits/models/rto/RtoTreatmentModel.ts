import { Group, Material, Mesh, type Object3D } from 'three';
import type { Exhibit } from '../../Exhibit';
import type { ExhibitDefinition } from '../../ExhibitDefinition';
import { loadRtoAsset } from '../../loaders/loadRtoAsset';

/**
 * RTO exhibit reconstructed as a genuine multi-part 3D relief from the
 * user-supplied exhibit image. The verified front view remains the visual
 * source of truth; limited rotation exposes depth without pretending that an
 * unseen back view is known.
 */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;
  private disposed = false;

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'High-fidelity three-bed RTO relief exhibit';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;
    this.object.userData.viewerConstraints = {
      heroRotationY: 0,
      minRotationY: -0.24,
      maxRotationY: 0.24,
      minRotationX: -0.08,
      maxRotationX: 0.08,
      autoRotate: false,
    };

    void loadRtoAsset().then((asset) => {
      if (!this.disposed) this.object.add(asset);
      else this.disposeAsset(asset);
    }).catch((error: unknown) => {
      console.error('[RtoTreatmentModel] Unable to build RTO relief asset.', error);
    });
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.object.children.forEach((child) => this.disposeAsset(child));
    this.object.clear();
  }

  private disposeAsset(root: Object3D): void {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: Material) => material.dispose());
    });
  }
}
