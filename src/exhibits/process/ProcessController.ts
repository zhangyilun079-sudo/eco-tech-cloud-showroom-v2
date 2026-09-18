import type { Object3D } from 'three';
import { ViewMode, type ViewModeState } from '../../core/ViewMode';
import type { ExhibitDefinition } from '../ExhibitDefinition';
import { ProcessAnimation } from './ProcessAnimation';
import { ProcessStep } from './ProcessStep';

/** Owns process-mode lifecycle, navigation, and the prepared presentation sequence. */
export class ProcessController {
  private readonly steps: readonly ProcessStep[];
  private readonly animation = new ProcessAnimation();
  private currentIndex = 0;

  public constructor(
    root: Object3D,
    definition: ExhibitDefinition,
    private readonly viewMode: ViewModeState,
    private readonly onStepChange: (step: ProcessStep) => void,
    private readonly onModeChange: (active: boolean) => void,
  ) {
    this.steps = definition.processSteps.map((step, index) => new ProcessStep(step, index, definition.processSteps.length));
    this.animation.prepare(root, definition.processSteps);
  }

  public enter(): void {
    if (this.viewMode.mode !== ViewMode.EXHIBIT || this.steps.length === 0) return;
    this.viewMode.set(ViewMode.PROCESS);
    this.currentIndex = 0;
    this.onModeChange(true);
    this.presentCurrentStep();
  }

  public exit(): void {
    if (this.viewMode.mode !== ViewMode.PROCESS) return;
    this.animation.reset();
    this.viewMode.set(ViewMode.EXHIBIT);
    this.onModeChange(false);
  }

  public next(): void {
    if (this.viewMode.mode !== ViewMode.PROCESS || this.currentIndex >= this.steps.length - 1) return;
    this.currentIndex += 1;
    this.presentCurrentStep();
  }

  public previous(): void {
    if (this.viewMode.mode !== ViewMode.PROCESS || this.currentIndex === 0) return;
    this.currentIndex -= 1;
    this.presentCurrentStep();
  }

  private presentCurrentStep(): void {
    const step = this.steps[this.currentIndex];
    if (!step) return;
    this.animation.showStage(this.currentIndex);
    this.onStepChange(step);
  }
}
