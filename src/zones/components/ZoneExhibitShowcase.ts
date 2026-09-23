import { Group } from 'three';
import type { Camera, Object3D } from 'three';
import { RaycastManager } from '../../interaction/RaycastManager';
import type { ExhibitEntry } from '../data/zoneExhibits';
import { ZoneExhibitStand } from './ZoneExhibitStand';

export interface ZoneExhibitShowcaseOptions {
  readonly camera: Camera;
  readonly canvas: HTMLCanvasElement;
  readonly isInteractive: () => boolean;
  readonly onSelect: (entry: ExhibitEntry) => void;
}

/** Owns only the spatial displays and a single picker, never navigation or Viewers. */
export class ZoneExhibitShowcase {
  public readonly group = new Group();
  private readonly raycastManager: RaycastManager;
  private readonly stands = new Map<Object3D, ZoneExhibitStand>();
  private elapsed = 0;
  private disposed = false;

  public constructor(private readonly options: ZoneExhibitShowcaseOptions) {
    this.group.name = 'Zone exhibit showcase';
    this.raycastManager = new RaycastManager({
      camera: options.camera,
      canvas: options.canvas,
      getTargets: () => this.canInteract ? this.targets : [],
      onHover: (target) => this.setHovered(this.canInteract ? target : null),
      onClick: (target) => {
        if (!this.canInteract) return;
        const stand = this.stands.get(target);
        if (stand) options.onSelect(stand.entry);
      },
    });
  }

  public get targets(): readonly Object3D[] { return [...this.stands.keys()]; }
  private get canInteract(): boolean { return !this.disposed && this.group.visible && this.options.isInteractive(); }

  /** Replace one active zone's displays, disposing only this component's resources. */
  public setEntries(entries: readonly ExhibitEntry[]): void {
    if (this.disposed) throw new Error('Cannot populate a disposed zone showcase.');
    const ids = new Set<string>();
    for (const entry of entries) {
      if (ids.has(entry.id)) throw new Error(`Duplicate zone exhibit entry: ${entry.id}`);
      ids.add(entry.id);
    }
    const next: ZoneExhibitStand[] = [];
    try {
      entries.forEach((entry, index) => next.push(new ZoneExhibitStand(entry, index)));
    } catch (error) {
      next.forEach((stand) => stand.dispose());
      throw error;
    }
    // Construction succeeded: retire the old set rather than leaking its GPU assets.
    this.clear();
    next.forEach((stand) => {
      this.stands.set(stand.target, stand);
      this.group.add(stand.group);
    });
  }

  public clearHover(): void { this.setHovered(null); }

  public update(delta: number): void {
    if (this.disposed || !this.group.visible) return;
    if (!this.canInteract) this.clearHover();
    this.elapsed += delta;
    this.stands.forEach((stand) => stand.update(delta, this.elapsed, this.options.camera));
  }

  public clear(): void {
    this.clearHover();
    this.stands.forEach((stand) => stand.dispose());
    this.stands.clear();
    this.group.clear();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.raycastManager.dispose();
    this.clear();
    this.group.removeFromParent();
  }

  private setHovered(target: Object3D | null): void {
    const hovered = target ? this.stands.get(target) : undefined;
    this.stands.forEach((stand) => stand.setHovered(stand === hovered));
    this.options.canvas.classList.toggle('is-zone-exhibit-hovered', hovered !== undefined);
  }
}
