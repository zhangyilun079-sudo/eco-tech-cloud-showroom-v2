import { Group, Material, Mesh, Texture, type Object3D } from 'three';
import type { Exhibit } from '../../Exhibit';
import type { ExhibitDefinition } from '../../ExhibitDefinition';
import { loadRtoAsset } from '../../loaders/loadRtoAsset';

/**
 * RTO exhibit backed by the user-supplied original exhibit image.
 * Until a verified source 3D model exists, the front view is intentionally
 * locked so the visitor sees the real exhibit rather than guessed geometry.
 */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;
  private disposed = false;

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'Reference-image three-bed RTO exhibit';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;
    this.object.userData.viewerConstraints = {
      heroRotationY: 0,
      minRotationY: 0,
      maxRotationY: 0,
      minRotationX: 0,
      maxRotationX: 0,
      autoRotate: false,
    };

    void loadRtoAsset().then((asset) => {
      if (!this.disposed) this.object.add(asset);
      else this.disposeAsset(asset);
    }).catch((error: unknown) => {
      console.error('[RtoTreatmentModel] Unable to load RTO reference asset.', error);
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
      const ownedTexture = object.userData.ownedDiagnosticTexture as Texture | undefined;
      ownedTexture?.dispose();
    });
  }
}
