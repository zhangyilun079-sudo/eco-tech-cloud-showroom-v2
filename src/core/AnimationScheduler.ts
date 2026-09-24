export interface AnimationTask {
  readonly id: string;
  readonly isActive: () => boolean;
  readonly update: (deltaSeconds: number) => void;
}

/** Keeps the frame loop declarative and prevents dormant scene systems from updating. */
export class AnimationScheduler {
  private readonly tasks = new Map<string, AnimationTask>();

  public add(task: AnimationTask): void {
    if (this.tasks.has(task.id)) throw new Error(`Animation task already registered: ${task.id}`);
    this.tasks.set(task.id, task);
  }

  public update(deltaSeconds: number, animationsEnabled = true): void {
    for (const task of this.tasks.values()) {
      // Camera and view-transition updates remain usable while scene animation is
      // disabled for profiling.
      if (!animationsEnabled && !['camera', 'exhibit-viewer', 'component-label'].includes(task.id)) continue;
      if (task.isActive()) task.update(deltaSeconds);
    }
  }

  public getActiveTaskIds(): string[] {
    return [...this.tasks.values()].filter((task) => task.isActive()).map((task) => task.id);
  }

  public clear(): void { this.tasks.clear(); }
}
