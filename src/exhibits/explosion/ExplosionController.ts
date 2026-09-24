import { Object3D, Vector3 } from 'three';
import type { ExhibitDefinition } from '../ExhibitDefinition';
import { ExplosionAnimation, type ExplosionTransformTransition } from './ExplosionAnimation';

interface ComponentTransform {
  readonly object: Object3D;
  readonly assembledPosition: Vector3;
  readonly explodedPosition: Vector3;
}

/** Coordinates component transforms for the current and future exploded-view UI. */
export class ExplosionController {
  public get isAnimating(): boolean { return this.animation.isRunning; }
  private readonly animation = new ExplosionAnimation();
  private readonly transforms: readonly ComponentTransform[];
  private exploded = false;

  public constructor(root: Object3D, definition: ExhibitDefinition) {
    this.transforms = definition.components.flatMap((component) => {
      const object = root.getObjectByName(component.id);
      if (!object) return [];
      return [{
        object,
        assembledPosition: object.position.clone(),
        explodedPosition: new Vector3(
          component.explodePosition.x,
          component.explodePosition.y,
          component.explodePosition.z,
        ),
      }];
    });
  }

  public get isExploded(): boolean {
    return this.exploded;
  }

  public explode(durationSeconds?: number): void {
    this.exploded = true;
    this.transitionTo((transform) => transform.explodedPosition, durationSeconds);
  }

  public collapse(durationSeconds?: number): void {
    this.exploded = false;
    this.transitionTo((transform) => transform.assembledPosition, durationSeconds);
  }

  public update(deltaSeconds: number): void {
    this.animation.update(deltaSeconds);
  }

  public finishTransition(): void {
    this.animation.finish();
  }

  /** Releases animation references and restores the assembled transform immediately. */
  public cleanupAnimation(): void {
    this.collapse(0);
    this.exploded = false;
  }

  private transitionTo(
    getTarget: (transform: ComponentTransform) => Vector3,
    durationSeconds?: number,
  ): void {
    const transitions: ExplosionTransformTransition[] = this.transforms.map((transform, index) => ({
      object: transform.object,
      from: transform.object.position.clone(),
      to: getTarget(transform).clone(),
      delay: this.transforms.length > 1 ? index / (this.transforms.length - 1) * 0.24 : 0,
    }));
    this.animation.start(transitions, durationSeconds);
  }
}
