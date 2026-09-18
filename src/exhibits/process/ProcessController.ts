import type { Object3D } from 'three';
import { ViewMode, type ViewModeState } from '../../core/ViewMode';
import type { ExhibitDefinition } from '../ExhibitDefinition';
import { ProcessStep } from './ProcessStep';
import { ProcessVisualizer } from './ProcessVisualizer';

const AUTO_STEP_SECONDS = 5;

/** Owns process-mode lifecycle, navigation, and the prepared presentation sequence. */
export class ProcessController {
  private readonly steps: readonly ProcessStep[];
  private readonly visualizer: ProcessVisualizer;
  private currentIndex = 0;
  private autoPlaying = false;
  private autoElapsed = 0;

  public constructor(
    root: Object3D,
    definition: ExhibitDefinition,
    private readonly viewMode: ViewModeState,
    private readonly onStepChange: (step: ProcessStep) => void,
    private readonly onModeChange: (active: boolean) => void,
    private readonly onAutoPlayChange: (active: boolean) => void,
  ) {
    this.steps = definition.processSteps.map((step, index) => new ProcessStep(step, index, definition.processSteps.length));
    this.visualizer = new ProcessVisualizer(root);
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
    this.setAutoPlaying(false);
    this.visualizer.reset();
    this.viewMode.set(ViewMode.EXHIBIT);
    this.onModeChange(false);
  }

  public next(): void {
    if (this.viewMode.mode !== ViewMode.PROCESS) return;
    this.currentIndex = (this.currentIndex + 1) % this.steps.length;
    this.autoElapsed = 0;
    this.presentCurrentStep();
  }

  public previous(): void {
    if (this.viewMode.mode !== ViewMode.PROCESS || this.currentIndex === 0) return;
    this.currentIndex -= 1;
    this.autoElapsed = 0;
    this.presentCurrentStep();
  }

  public toggleAutoPlay(): void { this.setAutoPlaying(!this.autoPlaying); }

  public update(deltaSeconds: number): void {
    this.visualizer.update(deltaSeconds);
    if (!this.autoPlaying || this.viewMode.mode !== ViewMode.PROCESS) return;
    this.autoElapsed += deltaSeconds;
    if (this.autoElapsed >= AUTO_STEP_SECONDS) this.next();
  }

  public dispose(): void { this.visualizer.dispose(); }

  private presentCurrentStep(): void {
    const step = this.steps[this.currentIndex];
    if (!step) return;
    this.visualizer.show(step.definition);
    this.onStepChange(step);
  }

  private setAutoPlaying(active: boolean): void {
    this.autoPlaying = active;
    this.autoElapsed = 0;
    this.onAutoPlayChange(active);
  }
}
