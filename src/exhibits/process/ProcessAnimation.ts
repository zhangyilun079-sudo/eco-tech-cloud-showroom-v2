import type { Object3D } from 'three';
import type { ExhibitProcessStepDefinition } from '../ExhibitDefinition';

export interface ProcessAnimationStage {
  readonly stepId: string;
  readonly components: readonly Object3D[];
}

/** Prepares the component sequence that later phases can enhance with fluid effects. */
export class ProcessAnimation {
  private stages: readonly ProcessAnimationStage[] = [];
  private activeStageIndex = -1;

  public prepare(root: Object3D, steps: readonly ExhibitProcessStepDefinition[]): void {
    this.stages = steps.map((step) => ({
      stepId: step.id,
      components: step.relatedComponents.flatMap((id) => {
        const component = root.getObjectByName(id);
        return component ? [component] : [];
      }),
    }));
    this.activeStageIndex = -1;
  }

  public showStage(index: number): void {
    this.activeStageIndex = index >= 0 && index < this.stages.length ? index : -1;
  }

  public reset(): void { this.activeStageIndex = -1; }

  public get activeStage(): ProcessAnimationStage | null {
    return this.stages[this.activeStageIndex] ?? null;
  }
}
