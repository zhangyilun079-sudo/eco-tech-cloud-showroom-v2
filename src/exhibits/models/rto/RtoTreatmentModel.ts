import { Group, Material, Mesh, Texture, type Object3D } from 'three';
import type { Exhibit } from '../../Exhibit';
import type { ExhibitDefinition } from '../../ExhibitDefinition';
import { createRtoHighFidelityModel } from './RtoHighFidelityModel';

/**
 * Production three-bed RTO exhibit reconstructed as genuine Three.js geometry.
 *
 * The user-supplied image is the strict front-view design reference. All visible
 * equipment is modeled as volumetric geometry; only unseen rear/side details are
 * inferred until a verified source CAD/GLTF model is supplied.
 */
export class RtoTreatmentModel implements Exhibit {
  public readonly object = new Group();
  public readonly metadata: ExhibitDefinition;
  private readonly ownedTextures: readonly Texture[];
  private disposed = false;

  public constructor(metadata: ExhibitDefinition) {
    this.metadata = metadata;
    this.object.name = 'High-fidelity three-bed RTO exhibit';
    this.object.visible = false;
    this.object.userData.exhibitId = metadata.id;
    this.object.userData.assetMode = 'high-fidelity-reconstruction';
    this.object.userData.sourceFrontViewVerified = true;
    this.object.userData.unseenSurfacesInferred = true;
    this.object.userData.viewerConstraints = {
      heroRotationY: 0,
      minRotationY: -0.55,
      maxRotationY: 0.55,
      minRotationX: -0.12,
      maxRotationX: 0.12,
      autoRotate: false,
    };

    const asset = createRtoHighFidelityModel();
    this.ownedTextures = asset.textures;
    this.object.add(asset.root);
  }

  public update(_deltaSeconds: number): void {}

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.object.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: Material) => {
        const maps = [
          'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap',
          'alphaMap', 'aoMap',
        ] as const;
        maps.forEach((key) => {
          const texture = (material as Material & Record<string, unknown>)[key];
          if (texture instanceof Texture) texture.dispose();
        });
        material.dispose();
      });
    });
    this.ownedTextures.forEach((texture) => texture.dispose());
    this.object.clear();
  }
}
