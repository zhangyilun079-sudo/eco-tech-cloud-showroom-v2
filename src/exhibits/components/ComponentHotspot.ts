import { Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import type { ExhibitComponentDefinition } from '../ExhibitDefinition';

/** Connects component metadata to its model objects and hover visualization. */
export class ComponentHotspot {
  public readonly targets: Object3D[] = [];
  public readonly anchor = new Vector3();
  public isHovered = false;
  private readonly materials: { mesh: Mesh; original: Material | Material[]; interactive: Material | Material[] }[] = [];

  public constructor(
    public readonly definition: ExhibitComponentDefinition,
    public readonly object: Object3D,
  ) {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        const original = child.material as Material | Material[];
        const interactive = Array.isArray(original)
          ? original.map((material) => material.clone())
          : original.clone();
        child.material = interactive;
        this.materials.push({ mesh: child, original, interactive });
        child.userData.componentHotspot = this;
        this.targets.push(child);
      }
    });
  }

  public setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    for (const entry of this.materials) {
      const materials = Array.isArray(entry.interactive) ? entry.interactive : [entry.interactive];
      materials.forEach((material) => {
        if (material instanceof MeshStandardMaterial) {
          material.emissive.set(hovered ? '#55dca0' : '#000000');
          material.emissiveIntensity = hovered ? 0.42 : 1;
        }
        if (entry.mesh.userData.rtoReferenceRegion && material instanceof MeshBasicMaterial) {
          material.color.set('#55dca0');
          material.opacity = hovered ? 0.14 : 0;
          material.transparent = true;
          material.needsUpdate = true;
        }
        if (entry.mesh.userData.rtoReliefFront && material instanceof MeshBasicMaterial) {
          material.color.set(hovered ? '#c8ffdf' : '#ffffff');
          material.needsUpdate = true;
        }
      });
    }
  }

  public getWorldAnchor(target: Vector3): Vector3 {
    const imageAnchor = this.object.userData.componentLabelAnchor as { x: number; y: number; z: number } | undefined;
    if (imageAnchor) {
      return target.set(imageAnchor.x, imageAnchor.y, imageAnchor.z).applyMatrix4(this.object.matrixWorld);
    }
    const position = this.definition.label.anchorPosition;
    // Component definitions use model-local coordinates. Applying the component's
    // own matrix makes the label follow it while the exploded view is in motion.
    return target.set(position.x, position.y, position.z).applyMatrix4(this.object.matrixWorld);
  }

  public dispose(): void {
    this.targets.forEach((target) => { delete target.userData.componentHotspot; });
    this.materials.forEach(({ mesh, original, interactive }) => {
      mesh.material = original;
      (Array.isArray(interactive) ? interactive : [interactive]).forEach((material) => material.dispose());
    });
  }
}
