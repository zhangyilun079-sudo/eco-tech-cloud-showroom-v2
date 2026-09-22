import type { ShowroomZoneId } from '../showroom/Showroom';
import type { ZoneDefinition } from './ZoneDefinition';

/** Registry for navigation-level zone metadata; scene implementations remain independent. */
export class ZoneManager {
  private readonly definitions = new Map<ShowroomZoneId, ZoneDefinition>();

  public constructor(definitions: readonly ZoneDefinition[]) {
    definitions.forEach((definition) => {
      if (this.definitions.has(definition.id)) throw new Error(`Duplicate zone: ${definition.id}`);
      this.definitions.set(definition.id, definition);
    });
  }

  public get(id: ShowroomZoneId): ZoneDefinition | undefined {
    return this.definitions.get(id);
  }

  public getAll(): readonly ZoneDefinition[] {
    return [...this.definitions.values()];
  }
}
