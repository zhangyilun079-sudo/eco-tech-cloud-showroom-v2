import type { ExhibitProcessStepDefinition } from '../ExhibitDefinition';

/** Runtime process step with presentation position metadata. */
export class ProcessStep {
  public constructor(
    public readonly definition: ExhibitProcessStepDefinition,
    public readonly index: number,
    public readonly total: number,
  ) {}

  public get isFirst(): boolean { return this.index === 0; }
  public get isLast(): boolean { return this.index === this.total - 1; }
}
