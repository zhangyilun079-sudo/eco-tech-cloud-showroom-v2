import { Material, Mesh, MeshStandardMaterial, type Object3D } from 'three';

/** Links achievement content to the physical equipment without changing interaction data. */
export class TechnologyHighlightController {
  private readonly components = new Map<string, Object3D>();
  private readonly originalMaterials = new Map<Mesh, Material | Material[]>();

  public constructor(root: Object3D) {
    root.traverse((object) => {
      const id = object.userData.componentId as string | undefined;
      if (id) this.components.set(id, object);
    });
  }

  public highlight(componentIds: readonly string[]): void {
    this.reset();
    if (componentIds.length === 0) return;
    const active = new Set(componentIds);
    this.components.forEach((component, id) => component.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      this.originalMaterials.set(object, object.material);
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const highlighted = active.has(id);
      const materials = source.map((material) => {
        const clone = material.clone();
        clone.transparent = true;
        clone.opacity = highlighted ? 1 : 0.1;
        clone.depthWrite = highlighted;
        if (highlighted && clone instanceof MeshStandardMaterial) {
          clone.emissive.set('#62e5ae');
          clone.emissiveIntensity = Math.max(clone.emissiveIntensity, 0.48);
        }
        return clone;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0]!;
    }));
  }

  public reset(): void {
    this.originalMaterials.forEach((material, mesh) => {
      const temporary = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      temporary.forEach((item) => item.dispose());
      mesh.material = material;
    });
    this.originalMaterials.clear();
  }

  public dispose(): void { this.reset(); this.components.clear(); }
}
