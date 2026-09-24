import { PerspectiveCamera, Vector3 } from 'three';
import type { InfoPanel } from '../../ui/InfoPanel';
import { RaycastManager } from '../../interaction/RaycastManager';
import type { Exhibit } from '../Exhibit';
import { ComponentHotspot } from './ComponentHotspot';

/** Reusable pointer, label, and selection controller for exhibit components. */
export class ComponentInteractionManager {
  private readonly raycastManager: RaycastManager;
  private readonly hotspots: ComponentHotspot[] = [];
  private readonly projectedPosition = new Vector3();
  private hovered: ComponentHotspot | null = null;
  private enabled = false;

  public constructor(
    private readonly camera: PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
    private readonly infoPanel: InfoPanel,
  ) {
    this.raycastManager = new RaycastManager({
      camera,
      canvas,
      getTargets: () => this.enabled ? this.hotspots.flatMap((hotspot) => hotspot.targets) : [],
      onHover: (target) => this.setHovered(target?.userData.componentHotspot instanceof ComponentHotspot
        ? target.userData.componentHotspot as ComponentHotspot
        : null),
      onClick: (target) => {
        const hotspot: unknown = target.userData.componentHotspot;
        if (hotspot instanceof ComponentHotspot) this.infoPanel.showComponent(hotspot.definition);
      },
    });
  }

  public activate(exhibit: Exhibit): void {
    this.clear();
    for (const definition of exhibit.metadata.components) {
      const object = exhibit.object.getObjectByName(definition.id);
      if (object) this.hotspots.push(new ComponentHotspot(definition, object));
    }
    this.enabled = true;
  }

  public deactivate(): void {
    this.enabled = false;
    this.setHovered(null);
    this.infoPanel.hideComponent();
    this.clear();
  }

  public update(): void {
    if (!this.enabled || !this.hovered) return;
    this.hovered.getWorldAnchor(this.projectedPosition).project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    const isOnScreen = Math.abs(this.projectedPosition.x) <= 1
      && Math.abs(this.projectedPosition.y) <= 1
      && this.projectedPosition.z >= -1 && this.projectedPosition.z <= 1;
    this.infoPanel.positionComponentLabel(
      rect.left + (this.projectedPosition.x + 1) * rect.width / 2,
      rect.top + (1 - this.projectedPosition.y) * rect.height / 2,
      isOnScreen,
    );
  }

  public get needsLabelUpdate(): boolean { return this.enabled && this.hovered !== null; }

  public dispose(): void {
    this.deactivate();
    this.raycastManager.dispose();
  }

  private setHovered(next: ComponentHotspot | null): void {
    if (next === this.hovered) return;
    this.hovered?.setHovered(false);
    this.hovered = next;
    this.hovered?.setHovered(true);
    this.infoPanel.showComponentLabel(next?.definition.label.title ?? null);
    this.canvas.classList.toggle('is-component-hovered', next !== null);
  }

  private clear(): void {
    this.hotspots.forEach((hotspot) => hotspot.dispose());
    this.hotspots.length = 0;
  }
}
