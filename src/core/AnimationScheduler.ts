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

  public update(deltaSeconds: number): void {
    for (const task of this.tasks.values()) {
      if (task.isActive()) task.update(deltaSeconds);
    }
  }

  public clear(): void { this.tasks.clear(); }
}
