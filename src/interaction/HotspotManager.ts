import { Group, PerspectiveCamera, Vector3 } from 'three';
import type { ShowroomZone } from '../showroom/Showroom';
import type { InfoPanel } from '../ui/InfoPanel';
import { Hotspot } from './Hotspot';
import { RaycastManager } from './RaycastManager';

interface ZoneContent {
  readonly title: string;
  readonly description: string;
}

const ZONE_CONTENT: Record<string, ZoneContent> = {
  ZONE_01: { title: '水环境治理', description: '展示方向:\n- 污染控制\n- 资源化利用\n- 智慧处理技术' },
  ZONE_02: { title: '固废资源化利用', description: '展示方向:\n- 智能分选\n- 循环材料\n- 无害化处置' },
  ZONE_03: { title: '清洁能源', description: '展示方向:\n- 可再生能源\n- 智慧储能\n- 低碳管理' },
  ZONE_04: { title: '大气环境治理', description: '展示方向:\n- 精准监测\n- 排放分析\n- 空气质量预警' },
  ZONE_05: { title: '生态修复与智慧监测', description: '展示方向:\n- 土壤修复\n- 水生态重建\n- 生物多样性保护' },
};

export class HotspotManager {
  public readonly group = new Group();
  private readonly hotspots: Hotspot[];
  private readonly raycastManager: RaycastManager;
  private readonly canvas: HTMLCanvasElement;
  private readonly infoPanel: InfoPanel;
  private readonly camera: PerspectiveCamera;
  private readonly projectedPosition = new Vector3();
  private hovered: Hotspot | null = null;
  private enabled = true;

  public constructor(
    zones: readonly ShowroomZone[],
    camera: PerspectiveCamera,
    canvas: HTMLCanvasElement,
    infoPanel: InfoPanel,
    onSelect: (zone: ShowroomZone) => boolean,
  ) {
    this.canvas = canvas;
    this.infoPanel = infoPanel;
    this.camera = camera;
    this.group.name = 'Exhibition zone hotspots';
    this.hotspots = zones.map((zone) => {
      const content = ZONE_CONTENT[zone.id];
      const hotspot = new Hotspot({
        id: zone.id,
        position: zone.hotspotPosition.clone().add(new Vector3(0, 1.7, 0)),
        title: content.title,
        description: content.description,
        onClick: (selected) => {
          if (!onSelect(zone)) infoPanel.showZoneDetails(selected.id, selected.title, selected.description);
        },
      });
      this.group.add(hotspot.object);
      return hotspot;
    });

    this.raycastManager = new RaycastManager({
      camera,
      canvas,
      getTargets: () => this.enabled ? this.hotspots.map((hotspot) => hotspot.target) : [],
      onHover: (target) => {
        const candidate: unknown = target?.userData.hotspot;
        const next = candidate instanceof Hotspot ? candidate : null;
        if (next === this.hovered) return;
        this.hovered?.setHovered(false);
        this.hovered = next;
        this.hovered?.setHovered(true);
        infoPanel.showHotspotLabel(this.hovered?.id ?? null, this.hovered?.title ?? null);
        canvas.classList.toggle('is-hotspot-hovered', this.hovered !== null);
      },
      onClick: (target) => {
        const hotspot: unknown = target.userData.hotspot;
        if (hotspot instanceof Hotspot) hotspot.click();
      },
    });
  }

  public update(deltaSeconds: number): void {
    this.hotspots.forEach((hotspot) => hotspot.update(deltaSeconds));
    this.updateHoveredLabelPosition();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) return;
    this.hovered?.setHovered(false);
    this.hovered = null;
    this.infoPanel.showHotspotLabel(null, null);
    this.canvas.classList.remove('is-hotspot-hovered');
  }

  public dispose(): void {
    this.raycastManager.dispose();
    this.hotspots.forEach((hotspot) => hotspot.dispose());
    this.group.clear();
  }

  private updateHoveredLabelPosition(): void {
    if (!this.hovered) return;

    this.hovered.object.getWorldPosition(this.projectedPosition);
    this.projectedPosition.project(this.camera);

    const rect = this.canvas.getBoundingClientRect();
    const isOnScreen = this.projectedPosition.z >= -1
      && this.projectedPosition.z <= 1
      && this.projectedPosition.x >= -1
      && this.projectedPosition.x <= 1
      && this.projectedPosition.y >= -1
      && this.projectedPosition.y <= 1;
    const x = rect.left + (this.projectedPosition.x + 1) * rect.width / 2;
    const y = rect.top + (1 - this.projectedPosition.y) * rect.height / 2;
    this.infoPanel.positionHotspotLabel(x, y, isOnScreen);
  }
}
