import { Clock, Color, Fog, Scene } from 'three';
import { ExhibitRegistry } from '../exhibits/ExhibitRegistry';
import { ExhibitFactory } from '../exhibits/ExhibitFactory';
import { ExhibitShowcase } from '../exhibits/ExhibitShowcase';
import { ExhibitViewer, type ExhibitReturnMode } from '../exhibits/ExhibitViewer';
import { ExplosionController } from '../exhibits/explosion/ExplosionController';
import { ComponentInteractionManager } from '../exhibits/components/ComponentInteractionManager';
import { mvrWastewaterTreatmentDefinition } from '../exhibits/data/mvrWastewaterTreatment';
import { rtoTreatmentDefinition } from '../exhibits/data/rtoTreatment';
import { ProcessController } from '../exhibits/process/ProcessController';
import { TechnologyController } from '../exhibits/technology/TechnologyController';
import { ExhibitModeMenu, type ExhibitNavigationMode } from '../exhibits/navigation/ExhibitModeMenu';
import { ExhibitResourceManager } from '../exhibits/optimization/ExhibitResourceManager';
import { HotspotManager } from '../interaction/HotspotManager';
import { Showroom } from '../showroom/Showroom';
import { InfoPanel } from '../ui/InfoPanel';
import { ZoneManager } from '../zones/ZoneManager';
import { ZoneViewer } from '../zones/ZoneViewer';
import { zoneDefinitions } from '../zones/data/zones';
import { CameraController } from './CameraController';
import { AnimationScheduler } from './AnimationScheduler';
import { LightingRig } from './LightingRig';
import { RendererManager } from './RendererManager';
import { RuntimeProfiler } from './RuntimeProfiler';
import { ViewMode, ViewModeState } from './ViewMode';

interface ExhibitControllerSet {
  readonly explosion: ExplosionController;
  readonly process: ProcessController;
  readonly technology: TechnologyController;
}

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
  private readonly zoneManager = new ZoneManager(zoneDefinitions);
  private readonly zoneViewer: ZoneViewer;
  private explosionController: ExplosionController | null = null;
  private processController: ProcessController | null = null;
  private technologyController: TechnologyController | null = null;
  private activeExhibitId: string | null = null;
  private readonly modeMenu: ExhibitModeMenu;
  private readonly exhibitFactory = new ExhibitFactory();
  private readonly resourceManager = new ExhibitResourceManager();
  private readonly clock = new Clock();
  private readonly animationScheduler = new AnimationScheduler();
  private readonly runtimeProfiler: RuntimeProfiler;
  private animationFrameId: number | null = null;

  public constructor(private readonly container: HTMLElement) {
    this.renderer = new RendererManager(container);
    this.camera = new CameraController(this.renderer.renderer.domElement);
    // Definitions are tiny catalog records. Viewer geometry is created on click.
    this.exhibits.registerMetadata(mvrWastewaterTreatmentDefinition);
    this.exhibits.registerMetadata(rtoTreatmentDefinition);
    this.infoPanel = new InfoPanel(container, {
      onResetView: () => this.camera.reset(),
      onToggleProcess: () => this.toggleProcessMode(),
      onPreviousProcessStep: () => this.processController?.previous(),
      onNextProcessStep: () => this.processController?.next(),
      onToggleProcessAutoPlay: () => this.processController?.toggleAutoPlay(),
    });
    this.componentInteractions = new ComponentInteractionManager(
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
    );
    this.modeMenu = new ExhibitModeMenu(container, (mode) => this.selectExhibitMode(mode));
    this.zoneViewer = new ZoneViewer(
      container,
      this.camera,
      this.renderer.renderer.domElement,
      this.viewMode,
      (active) => {
        this.showroom.group.visible = !active;
        this.hotspots?.setEnabled(!active);
        this.infoPanel.setViewMode(active ? ViewMode.ZONE : ViewMode.SHOWROOM);
      },
      () => this.hotspots.setEnabled(true),
      (viewerId, position) => {
        const exhibit = this.exhibits.acquire(viewerId, this.exhibitFactory);
        if (!exhibit) {
          console.error('[ShowroomApplication] Unregistered zone exhibit', { viewerId });
          return null;
        }
        // Prepare first; ZoneViewer changes modes only after resolution succeeds.
        return () => {
          const origin = this.zoneViewer.exhibitReturnContext;
          if (!origin || !this.exhibitViewer.enter(exhibit, position, origin.showroomCameraState)) {
            this.exhibits.release(exhibit.metadata.id);
            return false;
          }
          this.activateExhibit(exhibit);
          this.hotspots.setEnabled(false);
          this.componentInteractions.activate(exhibit);
          this.modeMenu.setMode(null);
          this.modeMenu.setExploded(false);
          this.modeMenu.setReturnZone(origin.title);
          this.modeMenu.show();
          return true;
        };
      },
    );
    this.resourceManager.registerCleanup('explosion', () => this.explosionController?.cleanupAnimation());
    this.resourceManager.registerCleanup('process', () => this.processController?.cleanupVisualization());
    this.resourceManager.registerCleanup('technology', () => this.technologyController?.resetHighlight());
    this.exhibitViewer = new ExhibitViewer(
      this.camera,
      this.renderer.renderer.domElement,
      this.viewMode,
      this.infoPanel,
      this.exhibitShowcase,
      (active, returnMode) => {
        this.showroom.group.visible = !active && returnMode !== ViewMode.ZONE;
        this.hotspots?.setEnabled(false);
        if (active) this.infoPanel.setViewMode(ViewMode.EXHIBIT);
        else if (returnMode === ViewMode.ZONE) this.zoneViewer.showReturnEnvironment();
      },
      (returnMode) => {
        this.releaseActiveExhibit();
        this.modeMenu.setReturnZone(null);
        if (returnMode === ViewMode.ZONE) {
          this.zoneViewer.resumeFromExhibit();
        } else {
          this.zoneViewer.discardExhibitReturn();
          this.hotspots.setEnabled(true);
          this.infoPanel.setViewMode(ViewMode.SHOWROOM);
        }
      },
    );
    this.hotspots = new HotspotManager(
      this.showroom.zones,
      this.camera.camera,
      this.renderer.renderer.domElement,
      this.infoPanel,
      (zone, hotspotPosition) => {
        const definition = this.zoneManager.get(zone.id);
        return definition ? this.zoneViewer.enter(definition, hotspotPosition) : false;
      },
    );

    this.scene.background = new Color('#02070a');
    this.scene.fog = new Fog('#030b0e', 25, 52);
    this.scene.add(
      new LightingRig(),
      this.showroom.group,
      this.exhibitShowcase,
      this.exhibits.group,
      this.hotspots.group,
      this.zoneViewer.group,
    );
    this.runtimeProfiler = new RuntimeProfiler({
      renderer: this.renderer.renderer,
      scene: this.scene,
      hotspots: this.hotspots.group,
      modules: {
        showroom: this.showroom.group,
        zoneViewer: this.zoneViewer.group,
        exhibits: this.exhibits.group,
        hotspots: this.hotspots.group,
      },
      getAnimationObjects: () => this.animationScheduler.getActiveTaskIds(
        this.runtimeProfiler.animationsEnabled,
        this.runtimeProfiler.hotspotsEnabled,
      ),
      setPostprocessingEnabled: (enabled) => this.renderer.setPostprocessingEnabled(enabled),
    });

    window.addEventListener('resize', this.handleResize);
    this.configureAnimationScheduler();
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
    this.releaseActiveExhibit();
    this.modeMenu.dispose();
    this.resourceManager.dispose();
    this.exhibits.dispose();
    this.exhibitShowcase.dispose();
    this.hotspots.dispose();
    this.zoneViewer.dispose();
    this.componentInteractions.dispose();
    this.exhibitViewer.dispose();
    this.infoPanel.dispose();
    this.camera.dispose();
    this.animationScheduler.clear();
    this.runtimeProfiler.dispose();
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
    this.runtimeProfiler.applyFeatureToggles();
    this.animationScheduler.update(
      delta,
      this.runtimeProfiler.animationsEnabled,
      this.runtimeProfiler.hotspotsEnabled,
    );
    this.renderer.renderer.render(this.scene, this.camera.camera);
    this.runtimeProfiler.update();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private configureAnimationScheduler(): void {
    this.animationScheduler.add({
      id: 'camera', essential: true, isActive: () => this.camera.needsUpdate, update: () => this.camera.update(),
    });
    this.animationScheduler.add({
      id: 'showroom', isActive: () => this.viewMode.mode === ViewMode.SHOWROOM,
      update: (delta) => this.showroom.update(delta),
    });
    this.animationScheduler.add({
      id: 'hotspots', feature: 'hotspots', isActive: () => this.viewMode.mode === ViewMode.SHOWROOM,
      update: (delta) => this.hotspots.update(delta),
    });
    this.animationScheduler.add({
      id: 'zone-viewer', isActive: () => this.viewMode.mode === ViewMode.ZONE,
      update: (delta) => this.zoneViewer.update(delta, this.runtimeProfiler.hotspotsEnabled),
    });
    this.animationScheduler.add({
      id: 'exhibit-viewer', essential: true, isActive: () => this.exhibitViewer.isAnimating,
      update: (delta) => this.exhibitViewer.update(delta),
    });
    this.animationScheduler.add({
      id: 'component-label', essential: true, isActive: () => this.componentInteractions.needsLabelUpdate,
      update: () => this.componentInteractions.update(),
    });
    this.animationScheduler.add({
      id: 'exhibits', isActive: () => this.activeExhibitId !== null,
      update: (delta) => this.exhibits.update(delta),
    });
    this.animationScheduler.add({
      id: 'explosion', isActive: () => this.explosionController?.isAnimating ?? false,
      update: (delta) => this.explosionController?.update(delta),
    });
    this.animationScheduler.add({
      id: 'process', isActive: () => this.processController?.isAnimating ?? false,
      update: (delta) => this.processController?.update(delta),
    });
  }

  private createControllerSet(exhibit: import('../exhibits/Exhibit').Exhibit): ExhibitControllerSet {
    return {
      explosion: new ExplosionController(exhibit.object, exhibit.metadata),
      process: new ProcessController(
        exhibit.object,
        exhibit.metadata,
        this.viewMode,
        (step) => this.infoPanel.showProcessStep(step),
        (active) => {
          this.infoPanel.setProcessMode(active);
          this.modeMenu.setMode(active ? 'process' : null);
        },
        (active) => this.infoPanel.setProcessAutoPlaying(active),
      ),
      technology: new TechnologyController(
        this.container,
        exhibit.object,
        exhibit.metadata,
        this.viewMode,
        (active) => {
          this.infoPanel.setTechnologyMode(active);
          this.modeMenu.setMode(active ? 'technology' : null);
        },
      ),
    };
  }

  private activateExhibit(exhibit: import('../exhibits/Exhibit').Exhibit): void {
    const controllers = this.createControllerSet(exhibit);
    this.explosionController = controllers.explosion;
    this.processController = controllers.process;
    this.technologyController = controllers.technology;
    this.activeExhibitId = exhibit.metadata.id;
  }

  private releaseActiveExhibit(): void {
    this.processController?.dispose();
    this.technologyController?.dispose();
    this.explosionController = null;
    this.processController = null;
    this.technologyController = null;
    if (this.activeExhibitId) this.exhibits.release(this.activeExhibitId);
    this.activeExhibitId = null;
  }

  private exitExhibitMode(destination: ExhibitReturnMode = ViewMode.SHOWROOM): void {
    if (!this.exhibitViewer.canExit) return;
    const origin = this.zoneViewer.exhibitReturnContext;
    if (destination === ViewMode.ZONE && !origin) return;
    this.technologyController?.exit();
    this.processController?.exit();
    this.explosionController?.collapse(0);
    this.modeMenu.setExploded(false);
    this.componentInteractions.deactivate();
    this.resourceManager.cleanupAll();
    this.modeMenu.hide();
    this.exhibitViewer.exit(destination === ViewMode.ZONE && origin
      ? { mode: ViewMode.ZONE, cameraState: origin.cameraState }
      : undefined);
  }

  private toggleExplodedView(): void {
    if (this.viewMode.mode === ViewMode.EXHIBIT) {
      this.viewMode.set(ViewMode.EXPLODED);
      this.explosionController?.explode();
      this.modeMenu.setExploded(true);
      this.modeMenu.setMode('exploded');
    } else if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.viewMode.set(ViewMode.EXHIBIT);
      this.explosionController?.collapse();
      this.modeMenu.setExploded(false);
      this.modeMenu.setMode(null);
    }
  }

  private toggleProcessMode(): void {
    if (this.viewMode.mode === ViewMode.PROCESS) {
      this.processController?.exit();
      return;
    }
    if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.explosionController?.collapse();
      this.modeMenu.setExploded(false);
      this.viewMode.set(ViewMode.EXHIBIT);
    }
    this.processController?.enter();
  }

  private selectExhibitMode(mode: ExhibitNavigationMode): void {
    if (!this.exhibitViewer.canExit) return;
    if (mode === 'return' || mode === 'return-zone') {
      this.exitExhibitMode(mode === 'return-zone' ? ViewMode.ZONE : ViewMode.SHOWROOM);
      return;
    }
    if (mode === 'exploded' && this.viewMode.mode === ViewMode.EXPLODED) {
      this.toggleExplodedView();
      return;
    }
    if (mode === 'process' && this.viewMode.mode === ViewMode.PROCESS) {
      this.processController?.exit();
      return;
    }
    if (mode === 'technology' && this.viewMode.mode === ViewMode.TECHNOLOGY) {
      this.technologyController?.exit();
      return;
    }
    if (this.viewMode.mode === ViewMode.PROCESS) this.processController?.exit();
    if (this.viewMode.mode === ViewMode.TECHNOLOGY) this.technologyController?.exit();
    if (this.viewMode.mode === ViewMode.EXPLODED) {
      this.resourceManager.cleanup('explosion');
      this.modeMenu.setExploded(false);
      this.viewMode.set(ViewMode.EXHIBIT);
    }
    this.resourceManager.cleanup('process');
    this.resourceManager.cleanup('technology');
    if (mode === 'exploded') {
      this.viewMode.set(ViewMode.EXPLODED);
      this.explosionController?.explode();
      this.modeMenu.setExploded(true);
    } else if (mode === 'process') this.processController?.enter();
    else if (mode === 'technology') this.technologyController?.enter();
    this.modeMenu.setMode(mode);
  }
}
