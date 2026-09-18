import type { ExhibitMetadata } from '../exhibits/Exhibit';

export class InfoPanel {
  private readonly element: HTMLElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly hotspotLabel: HTMLElement;
  private readonly zonePanel: HTMLElement;
  private readonly zoneCode: HTMLElement;
  private readonly zoneTitle: HTMLElement;
  private readonly zoneDescription: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly exhibitPanel: HTMLElement;
  private readonly exhibitTitle: HTMLElement;
  private readonly exhibitDescription: HTMLElement;
  private readonly exhibitCloseButton: HTMLButtonElement;
  private readonly onResetView: () => void;
  private readonly onExitExhibit: () => void;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'r' || event.repeat || this.isTypingTarget(event.target)) return;
    this.onResetView();
  };

  public constructor(container: HTMLElement, callbacks: { onResetView: () => void; onExitExhibit: () => void }) {
    this.onResetView = callbacks.onResetView;
    this.onExitExhibit = callbacks.onExitExhibit;
    this.element = document.createElement('aside');
    this.element.className = 'info-panel';
    this.element.setAttribute('aria-label', 'Showroom information');
    this.element.innerHTML = `
      <div class="brand"><span class="brand-mark" aria-hidden="true">◒</span><span>ECOSPHERE</span></div>
      <div class="intro">
        <p class="eyebrow">Virtual exhibition · 01</p>
        <h1>Ideas for a<br><em>living planet.</em></h1>
        <p class="description">A digital space for technologies that help restore, renew, and reimagine our shared future.</p>
        <div class="status"><span></span> Showroom foundation online</div>
      </div>
      <div class="controls-hint">
        <div class="navigation-help">
          <span class="mouse-icon" aria-hidden="true"></span>
          <div>
            <strong>Navigation</strong>
            <ul aria-label="Showroom controls">
              <li><kbd>LMB</kbd><span>Rotate view</span></li>
              <li><kbd>RMB</kbd><span>Pan view</span></li>
              <li><kbd>Wheel</kbd><span>Zoom</span></li>
              <li><kbd>R</kbd><span>Reset view</span></li>
            </ul>
          </div>
        </div>
        <button type="button" class="reset-button">Reset view <span>↗</span></button>
      </div>
      <div class="hotspot-label" role="status" aria-live="polite">
        <span class="hotspot-label-code"></span>
        <strong class="hotspot-label-title"></strong>
        <small>点击探索</small>
      </div>
      <section class="zone-panel" aria-label="Exhibition zone details" aria-hidden="true">
        <button class="zone-panel-close" type="button" aria-label="Close zone details">×</button>
        <p class="zone-panel-code"></p>
        <h2 class="zone-panel-title"></h2>
        <p class="zone-panel-description"></p>
      </section>
      <section class="exhibit-panel" aria-label="Exhibit viewing controls" aria-hidden="true">
        <p class="exhibit-mode-label">EXHIBIT VIEW · ZONE_01</p>
        <h2 class="exhibit-title"></h2>
        <p class="exhibit-description"></p>
        <div class="exhibit-controls"><span>Drag</span> rotate equipment <span>Wheel</span> zoom</div>
        <button class="exhibit-close" type="button"><span>←</span> Return to showroom</button>
      </section>
    `;
    container.append(this.element);

    const resetButton = this.element.querySelector<HTMLButtonElement>('.reset-button');
    if (!resetButton) throw new Error('Reset view button was not created.');
    this.resetButton = resetButton;
    this.hotspotLabel = this.getRequiredElement('.hotspot-label');
    this.zonePanel = this.getRequiredElement('.zone-panel');
    this.zoneCode = this.getRequiredElement('.zone-panel-code');
    this.zoneTitle = this.getRequiredElement('.zone-panel-title');
    this.zoneDescription = this.getRequiredElement('.zone-panel-description');
    const closeButton = this.element.querySelector<HTMLButtonElement>('.zone-panel-close');
    if (!closeButton) throw new Error('Zone detail close button was not created.');
    this.closeButton = closeButton;
    this.exhibitPanel = this.getRequiredElement('.exhibit-panel');
    this.exhibitTitle = this.getRequiredElement('.exhibit-title');
    this.exhibitDescription = this.getRequiredElement('.exhibit-description');
    const exhibitCloseButton = this.element.querySelector<HTMLButtonElement>('.exhibit-close');
    if (!exhibitCloseButton) throw new Error('Exhibit close button was not created.');
    this.exhibitCloseButton = exhibitCloseButton;
    this.resetButton.addEventListener('click', callbacks.onResetView);
    this.closeButton.addEventListener('click', this.hideZoneDetails);
    this.exhibitCloseButton.addEventListener('click', callbacks.onExitExhibit);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public showHotspotLabel(id: string | null, title: string | null): void {
    const code = this.hotspotLabel.querySelector<HTMLElement>('.hotspot-label-code');
    const name = this.hotspotLabel.querySelector<HTMLElement>('.hotspot-label-title');
    if (code) code.textContent = id ?? '';
    if (name) name.textContent = title ?? '';
    this.hotspotLabel.classList.toggle('is-visible', id !== null);
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
    this.exhibitDescription.textContent = metadata.description;
    this.exhibitPanel.classList.add('is-visible');
    this.exhibitPanel.setAttribute('aria-hidden', 'false');
    this.element.classList.add('is-exhibit-mode');
  }

  public hideExhibit(): void {
    this.exhibitPanel.classList.remove('is-visible');
    this.exhibitPanel.setAttribute('aria-hidden', 'true');
    this.element.classList.remove('is-exhibit-mode');
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.resetButton.replaceWith(this.resetButton.cloneNode(true));
    this.closeButton.removeEventListener('click', this.hideZoneDetails);
    this.exhibitCloseButton.removeEventListener('click', this.onExitExhibit);
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
