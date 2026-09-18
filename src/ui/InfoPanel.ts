export class InfoPanel {
  private readonly element: HTMLElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly onResetView: () => void;
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'r' || event.repeat || this.isTypingTarget(event.target)) return;
    this.onResetView();
  };

  public constructor(container: HTMLElement, onResetView: () => void) {
    this.onResetView = onResetView;
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
    `;
    container.append(this.element);

    const resetButton = this.element.querySelector<HTMLButtonElement>('.reset-button');
    if (!resetButton) throw new Error('Reset view button was not created.');
    this.resetButton = resetButton;
    this.resetButton.addEventListener('click', onResetView);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.resetButton.replaceWith(this.resetButton.cloneNode(true));
    this.element.remove();
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || (target instanceof HTMLElement && target.isContentEditable);
  }
}
