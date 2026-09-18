import { Clock, Color, Fog, Scene } from 'three';
import { ExhibitRegistry } from '../exhibits/ExhibitRegistry';
import { ExhibitShowcase } from '../exhibits/ExhibitShowcase';
import { ExhibitViewer } from '../exhibits/ExhibitViewer';
import { ExplosionController } from '../exhibits/explosion/ExplosionController';
import { ComponentInteractionManager } from '../exhibits/components/ComponentInteractionManager';
import { mvrWastewaterTreatmentDefinition } from '../exhibits/data/mvrWastewaterTreatment';
import { MvrWastewaterTreatmentModel } from '../exhibits/models/MvrWastewaterTreatmentModel';
import { HotspotManager } from '../interaction/HotspotManager';
import { Showroom } from '../showroom/Showroom';
import { InfoPanel } from '../ui/InfoPanel';
import { CameraController } from './CameraController';
import { LightingRig } from './LightingRig';
import { RendererManager } from './RendererManager';
import { ViewMode, ViewModeState } from './ViewMode';

export class ShowroomApplication {
  private readonly scene = new Scene();
  private readonly renderer: RendererManager;
  private readonly camera: CameraController;
  private readonly showroom = new Showroom();
  private readonly exhibits = new ExhibitRegistry();
  private readonly exhibitShowcase = new ExhibitShowcase();
  private readonly infoPanel: InfoPanel;
  private readonly hotspots: HotspotManager;
  private readonly exhibitViewer: ExhibitViewer;
  private readonly componentInteractions: ComponentInteractionManager;
  private readonly viewMode = new ViewModeState();
  private readonly explosionController: ExplosionController;
  private readonly clock = new Clock();
  private animationFrameId: number | null = null;

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new RendererManager(container);
    this.camera = new CameraController(this.renderer.renderer.domElement);
    const mvrExhibit = new MvrWastewaterTreatmentModel(mvrWastewaterTreatmentDefinition);
    this.exhibits.register(mvrExhibit);
    this.explosionController = new ExplosionController(mvrExhibit.object, mvrExhibit.metadata);
    this.infoPanel = new InfoPanel(container, {
      onResetView: () => this.camera.reset(),
      onExitExhibit: () => this.exitExhibitMode(),
      onToggleExplosion: () => this.toggleExplodedView(),
    });
    this.componentInteractions = new ComponentInteractionManager(
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
    );
    this.exhibitViewer = new ExhibitViewer(
      this.camera,
      this.renderer.renderer.domElement,
      this.viewMode,
      this.infoPanel,
      this.exhibitShowcase,
      (active) => { this.showroom.group.visible = !active; },
      () => this.hotspots.setEnabled(true),
    );
    this.hotspots = new HotspotManager(
      this.showroom.zones,
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
      (zone) => {
        if (zone.id !== 'ZONE_01') return false;
        this.hotspots.setEnabled(false);
        this.exhibitViewer.enter(mvrExhibit, zone.hotspotPosition);
        this.componentInteractions.activate(mvrExhibit);
        return true;
      },
    );

    this.scene.background = new Color('#07120f');
    this.scene.fog = new Fog('#07120f', 22, 46);
    this.scene.add(
      new LightingRig(),
      this.showroom.group,
      this.exhibitShowcase,
      this.exhibits.group,
      this.hotspots.group,
    );

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  public start(): void {
    if (this.animationFrameId !== null) return;
    this.clock.start();
    this.animate();
  }

  public dispose(): void {
    if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.showroom.dispose();
    this.exhibits.dispose();
    this.exhibitShowcase.dispose();
    this.hotspots.dispose();
    this.componentInteractions.dispose();
    this.exhibitViewer.dispose();
    this.infoPanel.dispose();
    this.camera.dispose();
    this.renderer.dispose();
  }

  private readonly handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.resize(width, height);
    this.renderer.resize(width, height);
  };

  private readonly animate = (): void => {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.camera.update();
    this.exhibitViewer.update(delta);
    this.explosionController.update(delta);
    this.componentInteractions.update();
    this.exhibits.update(delta);
    this.hotspots.update(delta);
    this.renderer.renderer.render(this.scene, this.camera.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private exitExhibitMode(): void {
    this.explosionController.collapse(0);
    this.infoPanel.setExploded(false);
    this.componentInteractions.deactivate();
    this.exhibitViewer.exit();
  }

  private toggleExplodedView(): void {
    if (this.viewMode.mode === ViewMode.EXHIBIT) {
      this.viewMode.set(ViewMode.EXPLODED);
      this.explosionController.explode();
      this.infoPanel.setExploded(true);
    } else if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.viewMode.set(ViewMode.EXHIBIT);
      this.explosionController.collapse();
      this.infoPanel.setExploded(false);
    }
  }
}
