import { Group } from 'three';
import type { Exhibit } from './Exhibit';
import type { ExhibitDefinition } from './ExhibitDefinition';
import type { ExhibitFactory } from './ExhibitFactory';

export class ExhibitRegistry {
  public readonly group = new Group();
  private readonly exhibits = new Map<string, Exhibit>();
  private readonly definitions = new Map<string, ExhibitDefinition>();

  public constructor() {
    this.group.name = 'Exhibits';
  }

  public registerMetadata(definition: ExhibitDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Exhibit id already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, definition);
  }

  /** Materialize one registered exhibit and attach it to the scene on demand. */
  public acquire(id: string, factory: ExhibitFactory): Exhibit | undefined {
    const existing = this.exhibits.get(id);
    if (existing) return existing;
    const definition = this.definitions.get(id);
    if (!definition) return undefined;
    const exhibit = factory.create(definition);
    this.exhibits.set(id, exhibit);
    this.group.add(exhibit.object);
    return exhibit;
  }

  /** Viewer models are not cached: release their GPU resources after exit. */
  public release(id: string): void {
    const exhibit = this.exhibits.get(id);
    if (!exhibit) return;
    exhibit.object.removeFromParent();
    exhibit.dispose();
    this.exhibits.delete(id);
  }

  public update(deltaSeconds: number): void {
    this.exhibits.forEach((exhibit) => exhibit.update(deltaSeconds));
  }

  public dispose(): void {
    this.exhibits.forEach((exhibit) => exhibit.dispose());
    this.exhibits.clear();
    this.definitions.clear();
    this.group.clear();
  }
}
