import { ViewMode, type ViewMode as ViewModeValue } from '../core/ViewMode';
import type { ExhibitMetadata } from '../exhibits/Exhibit';
import type { ExhibitComponentDefinition } from '../exhibits/ExhibitDefinition';
import type { ProcessStep } from '../exhibits/process/ProcessStep';

export class InfoPanel {
  private readonly element: HTMLElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly navigationList: HTMLUListElement;
  private readonly hotspotLabel: HTMLElement;
  private readonly zonePanel: HTMLElement;
  private readonly zoneCode: HTMLElement;
  private readonly zoneTitle: HTMLElement;
  private readonly zoneDescription: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly exhibitPanel: HTMLElement;
  private readonly exhibitTitle: HTMLElement;
  private readonly exhibitCategory: HTMLElement;
  private readonly exhibitDescription: HTMLElement;
  private readonly exhibitFeatures: HTMLElement;
  private readonly processPanel: HTMLElement;
  private readonly processProgress: HTMLElement;
  private readonly processTitle: HTMLElement;
  private readonly processDescription: HTMLElement;
  private readonly processPreviousButton: HTMLButtonElement;
  private readonly processNextButton: HTMLButtonElement;
  private readonly processExitButton: HTMLButtonElement;
  private readonly processAutoButton: HTMLButtonElement;
  private readonly componentLabel: HTMLElement;
  private readonly componentPanel: HTMLElement;
  private readonly componentName: HTMLElement;
  private readonly componentRole: HTMLElement;
  private readonly componentDescription: HTMLElement;
  private readonly componentFeatures: HTMLElement;
  private readonly componentCloseButton: HTMLButtonElement;
  private readonly onResetView: () => void;
  private readonly onToggleProcess: () => void;
  private readonly onPreviousProcessStep: () => void;
  private readonly onNextProcessStep: () => void;
  private readonly onToggleProcessAutoPlay: () => void;
  private hasHoveredHotspot = false;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'r' || event.repeat || this.isTypingTarget(event.target)) return;
    this.onResetView();
  };

  public constructor(container: HTMLElement, callbacks: {
    onResetView: () => void;
    onToggleProcess: () => void;
    onPreviousProcessStep: () => void;
    onNextProcessStep: () => void;
    onToggleProcessAutoPlay: () => void;
  }) {
    this.onResetView = callbacks.onResetView;
    this.onToggleProcess = callbacks.onToggleProcess;
    this.onPreviousProcessStep = callbacks.onPreviousProcessStep;
    this.onNextProcessStep = callbacks.onNextProcessStep;
    this.onToggleProcessAutoPlay = callbacks.onToggleProcessAutoPlay;
    this.element = document.createElement('aside');
    this.element.className = 'info-panel';
    this.element.setAttribute('aria-label', '展厅信息');
    this.element.innerHTML = `
      <div class="brand"><span class="brand-mark" aria-hidden="true">◒</span><span>生态科技云展厅</span></div>
      <div class="controls-hint">
        <div class="navigation-help">
          <span class="mouse-icon" aria-hidden="true"></span>
          <div>
            <strong>操作指引</strong>
            <ul aria-label="展厅操作方式">
              <li><kbd>鼠标左键：</kbd><span>旋转视角</span></li>
              <li><kbd>鼠标右键：</kbd><span>平移视角</span></li>
              <li><kbd>滚轮：</kbd><span>缩放视图</span></li>
            </ul>
          </div>
        </div>
        <button type="button" class="reset-button">恢复视角 <span>↗</span></button>
      </div>
      <div class="hotspot-label" role="status" aria-live="polite">
        <span class="hotspot-label-code"></span>
        <strong class="hotspot-label-title"></strong>
        <small>点击探索</small>
      </div>
      <section class="zone-panel" aria-label="展区详情" aria-hidden="true">
        <button class="zone-panel-close" type="button" aria-label="关闭展区详情">×</button>
        <p class="zone-panel-code"></p>
        <h2 class="zone-panel-title"></h2>
        <p class="zone-panel-description"></p>
      </section>
      <section class="exhibit-panel" aria-label="展品展示与操作" aria-hidden="true">
        <p class="exhibit-mode-label">展品展示模式 · 01 号展区</p>
        <p class="exhibit-category"></p>
        <h2 class="exhibit-title"></h2>
        <p class="exhibit-description"></p>
        <div class="exhibit-feature-section">
          <p class="exhibit-section-label">核心特点</p>
          <ul class="exhibit-features"></ul>
        </div>
      </section>
      <section class="process-panel" aria-label="工艺流程" aria-hidden="true">
        <button class="process-exit" type="button" aria-label="退出工艺流程">×</button>
        <p class="process-kicker">工艺流程 · <span class="process-progress"></span></p>
        <h2 class="process-title"></h2>
        <p class="process-description"></p>
        <div class="process-navigation">
          <button class="process-previous" type="button">← 上一步</button>
          <button class="process-auto" type="button" aria-pressed="false">自动演示</button>
          <button class="process-next" type="button">下一步 →</button>
        </div>
      </section>
      <div class="component-label" role="status" aria-live="polite">
        <span class="component-label-marker" aria-hidden="true"></span>
        <strong class="component-label-title"></strong>
        <small>点击查看详情</small>
      </div>
      <section class="component-panel" aria-label="部件信息" aria-hidden="true">
        <button class="component-panel-close" type="button" aria-label="关闭部件信息">×</button>
        <p class="component-panel-kicker">系统部件</p>
        <h2 class="component-panel-name"></h2>
        <p class="component-panel-role"></p>
        <p class="component-panel-description"></p>
        <p class="component-panel-feature-label">核心特点</p>
        <ul class="component-panel-features"></ul>
      </section>
    `;
    container.append(this.element);

    const resetButton = this.element.querySelector<HTMLButtonElement>('.reset-button');
    if (!resetButton) throw new Error('Reset view button was not created.');
    this.resetButton = resetButton;
    const navigationList = this.element.querySelector<HTMLUListElement>('.navigation-help ul');
    if (!navigationList) throw new Error('Navigation guide was not created.');
    this.navigationList = navigationList;
    this.hotspotLabel = this.getRequiredElement('.hotspot-label');
    this.zonePanel = this.getRequiredElement('.zone-panel');
    this.zoneCode = this.getRequiredElement('.zone-panel-code');
    this.zoneTitle = this.getRequiredElement('.zone-panel-title');
    this.zoneDescription = this.getRequiredElement('.zone-panel-description');
    const closeButton = this.element.querySelector<HTMLButtonElement>('.zone-panel-close');
    if (!closeButton) throw new Error('Zone detail close button was not created.');
    this.closeButton = closeButton;
    this.exhibitPanel = this.getRequiredElement('.exhibit-panel');
    this.exhibitCategory = this.getRequiredElement('.exhibit-category');
    this.exhibitTitle = this.getRequiredElement('.exhibit-title');
    this.exhibitDescription = this.getRequiredElement('.exhibit-description');
    this.exhibitFeatures = this.getRequiredElement('.exhibit-features');
    this.processPanel = this.getRequiredElement('.process-panel');
    this.processProgress = this.getRequiredElement('.process-progress');
    this.processTitle = this.getRequiredElement('.process-title');
    this.processDescription = this.getRequiredElement('.process-description');
    const processPreviousButton = this.element.querySelector<HTMLButtonElement>('.process-previous');
    const processNextButton = this.element.querySelector<HTMLButtonElement>('.process-next');
    const processExitButton = this.element.querySelector<HTMLButtonElement>('.process-exit');
    const processAutoButton = this.element.querySelector<HTMLButtonElement>('.process-auto');
    if (!processPreviousButton || !processNextButton || !processExitButton || !processAutoButton) throw new Error('Process controls were not created.');
    this.processPreviousButton = processPreviousButton;
    this.processNextButton = processNextButton;
    this.processExitButton = processExitButton;
    this.processAutoButton = processAutoButton;
    this.componentLabel = this.getRequiredElement('.component-label');
    this.componentPanel = this.getRequiredElement('.component-panel');
    this.componentName = this.getRequiredElement('.component-panel-name');
    this.componentRole = this.getRequiredElement('.component-panel-role');
    this.componentDescription = this.getRequiredElement('.component-panel-description');
    this.componentFeatures = this.getRequiredElement('.component-panel-features');
    const componentCloseButton = this.element.querySelector<HTMLButtonElement>('.component-panel-close');
    if (!componentCloseButton) throw new Error('Component close button was not created.');
    this.componentCloseButton = componentCloseButton;
    this.resetButton.addEventListener('click', callbacks.onResetView);
    this.closeButton.addEventListener('click', this.hideZoneDetails);
    this.processPreviousButton.addEventListener('click', callbacks.onPreviousProcessStep);
    this.processNextButton.addEventListener('click', callbacks.onNextProcessStep);
    this.processExitButton.addEventListener('click', callbacks.onToggleProcess);
    this.processAutoButton.addEventListener('click', callbacks.onToggleProcessAutoPlay);
    this.componentCloseButton.addEventListener('click', this.hideComponent);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public showHotspotLabel(id: string | null, title: string | null): void {
    const code = this.hotspotLabel.querySelector<HTMLElement>('.hotspot-label-code');
    const name = this.hotspotLabel.querySelector<HTMLElement>('.hotspot-label-title');
    if (code) code.textContent = id ?? '';
    if (name) name.textContent = title ?? '';
    this.hasHoveredHotspot = id !== null;
    if (!this.hasHoveredHotspot) this.hotspotLabel.classList.remove('is-visible');
  }

  public setViewMode(mode: ViewModeValue): void {
    const isShowroom = mode === ViewMode.SHOWROOM;
    const isZone = mode === ViewMode.ZONE;
    this.element.classList.toggle('is-zone-mode', isZone);
    this.navigationList.setAttribute('aria-label', isShowroom ? '展厅操作方式' : '展品操作方式');
    this.navigationList.innerHTML = isShowroom
      ? '<li><kbd>鼠标左键：</kbd><span>旋转视角</span></li><li><kbd>鼠标右键：</kbd><span>平移视角</span></li><li><kbd>滚轮：</kbd><span>缩放视图</span></li>'
      : isZone
        ? '<li><kbd>独立展区</kbd><span>智慧监测场景</span></li>'
        : '<li><kbd>拖动鼠标：</kbd><span>旋转设备</span></li><li><kbd>滚轮：</kbd><span>缩放设备</span></li>';
  }

  /** Positions the HTML label at a hotspot's projected viewport coordinates. */
  public positionHotspotLabel(x: number, y: number, isOnScreen: boolean): void {
    this.hotspotLabel.style.left = `${x}px`;
    this.hotspotLabel.style.top = `${y}px`;
    this.hotspotLabel.classList.toggle('is-visible', this.hasHoveredHotspot && isOnScreen);
  }

  public showZoneDetails(id: string, title: string, description: string): void {
    this.zoneCode.textContent = id;
    this.zoneTitle.textContent = title;
    this.zoneDescription.textContent = description;
    this.zonePanel.classList.add('is-visible');
    this.zonePanel.setAttribute('aria-hidden', 'false');
  }

  public showExhibit(metadata: ExhibitMetadata): void {
    this.hideZoneDetails();
    this.showHotspotLabel(null, null);
    this.exhibitTitle.textContent = metadata.title;
    this.exhibitCategory.textContent = metadata.technologyCategory;
    this.exhibitDescription.textContent = metadata.description;
    this.exhibitFeatures.replaceChildren(...(metadata.keyFeatures ?? []).map((feature) => {
      const item = document.createElement('li');
      item.textContent = feature;
      return item;
    }));
    this.exhibitPanel.classList.add('is-visible');
    this.exhibitPanel.setAttribute('aria-hidden', 'false');
    this.element.classList.add('is-exhibit-mode');
  }

  public hideExhibit(): void {
    this.hideComponent();
    this.showComponentLabel(null);
    this.exhibitPanel.classList.remove('is-visible');
    this.exhibitPanel.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('is-exhibit-mode');
    this.setProcessMode(false);
    this.setTechnologyMode(false);
  }

  public setProcessMode(active: boolean): void {
    this.processPanel.classList.toggle('is-visible', active);
    this.processPanel.setAttribute('aria-hidden', String(!active));
    this.exhibitPanel.classList.toggle('is-process-mode', active);
    if (active) this.hideComponent();
  }

  public setTechnologyMode(active: boolean): void {
    this.exhibitPanel.classList.toggle('is-technology-mode', active);
    if (active) this.hideComponent();
  }

  public showProcessStep(step: ProcessStep): void {
    this.processProgress.textContent = `${String(step.index + 1).padStart(2, '0')} / ${String(step.total).padStart(2, '0')}`;
    this.processTitle.textContent = step.definition.title;
    this.processDescription.textContent = step.definition.description;
    this.processPreviousButton.disabled = step.isFirst;
    this.processNextButton.disabled = step.isLast;
  }

  public setProcessAutoPlaying(active: boolean): void {
    this.processAutoButton.textContent = active ? '暂停演示' : '自动演示';
    this.processAutoButton.setAttribute('aria-pressed', String(active));
    this.processAutoButton.classList.toggle('is-active', active);
  }

  public showComponentLabel(title: string | null): void {
    this.componentLabel.querySelector<HTMLElement>('.component-label-title')!.textContent = title ?? '';
    this.componentLabel.classList.toggle('has-component', title !== null);
    if (title === null) this.componentLabel.classList.remove('is-visible');
  }

  public positionComponentLabel(x: number, y: number, isOnScreen: boolean): void {
    this.componentLabel.style.left = `${x}px`;
    this.componentLabel.style.top = `${y}px`;
    this.componentLabel.classList.toggle('is-visible', isOnScreen && this.componentLabel.classList.contains('has-component'));
  }

  public showComponent(component: ExhibitComponentDefinition): void {
    this.componentName.textContent = component.title;
    this.componentRole.textContent = component.technicalRole;
    this.componentDescription.textContent = component.description;
    this.componentFeatures.replaceChildren(...component.keyFeatures.map((feature) => {
      const item = document.createElement('li');
      item.textContent = feature;
      return item;
    }));
    this.componentPanel.classList.add('is-visible');
    this.componentPanel.setAttribute('aria-hidden', 'false');
  }

  public readonly hideComponent = (): void => {
    this.componentPanel.classList.remove('is-visible');
    this.componentPanel.setAttribute('aria-hidden', 'true');
  };

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.resetButton.replaceWith(this.resetButton.cloneNode(true));
    this.closeButton.removeEventListener('click', this.hideZoneDetails);
    this.processPreviousButton.removeEventListener('click', this.onPreviousProcessStep);
    this.processNextButton.removeEventListener('click', this.onNextProcessStep);
    this.processExitButton.removeEventListener('click', this.onToggleProcess);
    this.processAutoButton.removeEventListener('click', this.onToggleProcessAutoPlay);
    this.componentCloseButton.removeEventListener('click', this.hideComponent);
    this.element.remove();
  }

  private readonly hideZoneDetails = (): void => {
    this.zonePanel.classList.remove('is-visible');
    this.zonePanel.setAttribute('aria-hidden', 'true');
  };

  private getRequiredElement(selector: string): HTMLElement {
    const element = this.element.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Info panel element was not created: ${selector}`);
    return element;
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable);
  }
}
