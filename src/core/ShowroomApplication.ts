import { Clock, Color, Fog, Scene } from 'three';
import { ExhibitRegistry } from '../exhibits/ExhibitRegistry';
import { ExhibitShowcase } from '../exhibits/ExhibitShowcase';
import { ExhibitViewer } from '../exhibits/ExhibitViewer';
import { ExplosionController } from '../exhibits/explosion/ExplosionController';
import { ComponentInteractionManager } from '../exhibits/components/ComponentInteractionManager';
import { mvrWastewaterTreatmentDefinition } from '../exhibits/data/mvrWastewaterTreatment';
import { MvrWastewaterTreatmentModel } from '../exhibits/models/MvrWastewaterTreatmentModel';
import { ProcessController } from '../exhibits/process/ProcessController';
import { TechnologyController } from '../exhibits/technology/TechnologyController';
import { ExhibitModeMenu, type ExhibitNavigationMode } from '../exhibits/navigation/ExhibitModeMenu';
import { ExhibitResourceManager } from '../exhibits/optimization/ExhibitResourceManager';
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
  private readonly processController: ProcessController;
  private readonly technologyController: TechnologyController;
  private readonly modeMenu: ExhibitModeMenu;
  private readonly resourceManager = new ExhibitResourceManager();
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
      onToggleProcess: () => this.toggleProcessMode(),
      onPreviousProcessStep: () => this.processController.previous(),
      onNextProcessStep: () => this.processController.next(),
      onToggleProcessAutoPlay: () => this.processController.toggleAutoPlay(),
    });
    this.processController = new ProcessController(
      mvrExhibit.object,
      mvrExhibit.metadata,
      this.viewMode,
      (step) => this.infoPanel.showProcessStep(step),
      (active) => {
        this.infoPanel.setProcessMode(active);
        this.modeMenu?.setMode(active ? 'process' : null);
      },
      (active) => this.infoPanel.setProcessAutoPlaying(active),
    );
    this.componentInteractions = new ComponentInteractionManager(
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
    );
    this.technologyController = new TechnologyController(
      container,
      mvrExhibit.object,
      mvrExhibit.metadata,
      this.viewMode,
      (active) => {
        this.infoPanel.setTechnologyMode(active);
        this.modeMenu?.setMode(active ? 'technology' : null);
      },
    );
    this.modeMenu = new ExhibitModeMenu(container, (mode) => this.selectExhibitMode(mode));
    this.resourceManager.registerCleanup('explosion', () => this.explosionController.cleanupAnimation());
    this.resourceManager.registerCleanup('process', () => this.processController.cleanupVisualization());
    this.resourceManager.registerCleanup('technology', () => this.technologyController.resetHighlight());
    this.exhibitViewer = new ExhibitViewer(
      this.camera,
      this.renderer.renderer.domElement,
      this.viewMode,
      this.infoPanel,
      this.exhibitShowcase,
      (active) => {
        this.showroom.group.visible = !active;
        if (active) this.infoPanel.setViewMode(ViewMode.EXHIBIT);
      },
      () => {
        this.hotspots.setEnabled(true);
        this.infoPanel.setViewMode(ViewMode.SHOWROOM);
      },
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
        this.modeMenu.setMode(null);
        this.modeMenu.setExploded(false);
        this.modeMenu.show();
        this.componentInteractions.activate(mvrExhibit);
        return true;
      },
    );

    this.scene.background = new Color('#dceff2');
    this.scene.fog = new Fog('#dceff2', 30, 58);
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
    this.processController.dispose();
    this.technologyController.dispose();
    this.modeMenu.dispose();
    this.resourceManager.dispose();
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
    this.showroom.update(delta);
    this.exhibitViewer.update(delta);
    this.explosionController.update(delta);
    this.processController.update(delta);
    this.componentInteractions.update();
    this.exhibits.update(delta);
    this.hotspots.update(delta);
    this.renderer.renderer.render(this.scene, this.camera.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private exitExhibitMode(): void {
    this.technologyController.exit();
    this.processController.exit();
    this.explosionController.collapse(0);
    this.modeMenu.setExploded(false);
    this.componentInteractions.deactivate();
    this.resourceManager.cleanupAll();
    this.modeMenu.hide();
    this.exhibitViewer.exit();
  }

  private toggleExplodedView(): void {
    if (this.viewMode.mode === ViewMode.EXHIBIT) {
      this.viewMode.set(ViewMode.EXPLODED);
      this.explosionController.explode();
      this.modeMenu.setExploded(true);
      this.modeMenu.setMode('exploded');
    } else if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.viewMode.set(ViewMode.EXHIBIT);
      this.explosionController.collapse();
      this.modeMenu.setExploded(false);
      this.modeMenu.setMode(null);
    }
  }

  private toggleProcessMode(): void {
    if (this.viewMode.mode === ViewMode.PROCESS) {
      this.processController.exit();
      return;
    }
    if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.explosionController.collapse();
      this.modeMenu.setExploded(false);
      this.viewMode.set(ViewMode.EXHIBIT);
    }
    this.processController.enter();
  }

  private selectExhibitMode(mode: ExhibitNavigationMode): void {
    if (mode === 'return') {
      this.exitExhibitMode();
      return;
    }
    if (mode === 'exploded' && this.viewMode.mode === ViewMode.EXPLODED) {
      this.toggleExplodedView();
      return;
    }
    if (mode === 'process' && this.viewMode.mode === ViewMode.PROCESS) {
      this.processController.exit();
      return;
    }
    if (mode === 'technology' && this.viewMode.mode === ViewMode.TECHNOLOGY) {
      this.technologyController.exit();
      return;
    }
    if (this.viewMode.mode === ViewMode.PROCESS) this.processController.exit();
    if (this.viewMode.mode === ViewMode.TECHNOLOGY) this.technologyController.exit();
    if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.resourceManager.cleanup('explosion');
      this.modeMenu.setExploded(false);
      this.viewMode.set(ViewMode.EXHIBIT);
    }
    this.resourceManager.cleanup('process');
    this.resourceManager.cleanup('technology');
    if (mode === 'exploded') {
      this.viewMode.set(ViewMode.EXPLODED);
      this.explosionController.explode();
      this.modeMenu.setExploded(true);
    } else if (mode === 'process') this.processController.enter();
    else if (mode === 'technology') this.technologyController.enter();
    this.modeMenu.setMode(mode);
  }
}
