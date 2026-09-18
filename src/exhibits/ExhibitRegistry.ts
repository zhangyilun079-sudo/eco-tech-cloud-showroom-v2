import { Group } from 'three';
import type { Exhibit } from './Exhibit';

export class ExhibitRegistry {
  public readonly group = new Group();
  private readonly exhibits = new Map<string, Exhibit>();

  public constructor() {
    this.group.name = 'Exhibits';
  }

  public register(exhibit: Exhibit): void {
    if (this.exhibits.has(exhibit.metadata.id)) {
      throw new Error(`Exhibit id already registered: ${exhibit.metadata.id}`);
    }
    this.exhibits.set(exhibit.metadata.id, exhibit);
    this.group.add(exhibit.object);
  }

  public get(id: string): Exhibit | undefined {
    return this.exhibits.get(id);
  }

  public update(deltaSeconds: number): void {
    this.exhibits.forEach((exhibit) => exhibit.update(deltaSeconds));
  }

  public dispose(): void {
    this.exhibits.forEach((exhibit) => exhibit.dispose());
    this.exhibits.clear();
    this.group.clear();
  }
}
