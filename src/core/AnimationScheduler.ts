export interface AnimationTask {
  readonly id: string;
  readonly isActive: () => boolean;
  readonly update: (deltaSeconds: number) => void;
  /** Navigation work which must remain available when ambient animation is paused. */
  readonly essential?: boolean;
  readonly feature?: 'hotspots';
}

/** Keeps the frame loop declarative and prevents dormant scene systems from updating. */
export class AnimationScheduler {
  private readonly tasks = new Map<string, AnimationTask>();

  public add(task: AnimationTask): void {
    if (this.tasks.has(task.id)) throw new Error(`Animation task already registered: ${task.id}`);
    this.tasks.set(task.id, task);
  }

  public update(deltaSeconds: number, animationsEnabled = true, hotspotsEnabled = true): void {
    for (const task of this.tasks.values()) {
      if (!animationsEnabled && !task.essential) continue;
      if (task.feature === 'hotspots' && !hotspotsEnabled) continue;
      if (task.isActive()) task.update(deltaSeconds);
    }
  }

  public getActiveTaskIds(animationsEnabled = true, hotspotsEnabled = true): string[] {
    return [...this.tasks.values()].filter((task) => (
      (animationsEnabled || task.essential)
      && (task.feature !== 'hotspots' || hotspotsEnabled)
      && task.isActive()
    )).map((task) => task.id);
  }

  public clear(): void { this.tasks.clear(); }
}
