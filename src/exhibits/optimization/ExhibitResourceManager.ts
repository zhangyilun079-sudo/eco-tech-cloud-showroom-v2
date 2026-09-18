import { Material, Mesh, type Object3D } from 'three';

export type ExhibitResourceScope = 'explosion' | 'process' | 'technology';

/** Central owner for temporary mode resources and mode-exit cleanup hooks. */
export class ExhibitResourceManager {
  private readonly temporaryObjects = new Map<ExhibitResourceScope, Set<Object3D>>();
  private readonly cleanupHandlers = new Map<ExhibitResourceScope, Set<() => void>>();

  public registerCleanup(scope: ExhibitResourceScope, cleanup: () => void): () => void {
    const handlers = this.cleanupHandlers.get(scope) ?? new Set<() => void>();
    handlers.add(cleanup);
    this.cleanupHandlers.set(scope, handlers);
    return () => handlers.delete(cleanup);
  }

  public trackObject(scope: ExhibitResourceScope, object: Object3D): void {
    const objects = this.temporaryObjects.get(scope) ?? new Set<Object3D>();
    objects.add(object);
    this.temporaryObjects.set(scope, objects);
  }

  public cleanup(scope: ExhibitResourceScope): void {
    this.cleanupHandlers.get(scope)?.forEach((cleanup) => cleanup());
    this.temporaryObjects.get(scope)?.forEach((object) => {
      object.removeFromParent();
      object.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        child.geometry.dispose();
        const materials: Material[] = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      });
    });
    this.temporaryObjects.delete(scope);
  }

  public cleanupAll(): void {
    (['explosion', 'process', 'technology'] as const).forEach((scope) => this.cleanup(scope));
  }

  public dispose(): void { this.cleanupAll(); this.cleanupHandlers.clear(); }
}
