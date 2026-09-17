export class InfoPanel {
  private readonly element: HTMLElement;
  private readonly resetButton: HTMLButtonElement;

  public constructor(container: HTMLElement, onResetView: () => void) {
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
        <div><span class="mouse-icon" aria-hidden="true"></span><p><strong>Explore the space</strong><br>Drag to look · Scroll to zoom</p></div>
        <button type="button" class="reset-button">Reset view <span>↗</span></button>
      </div>
    `;
    container.append(this.element);

    const resetButton = this.element.querySelector<HTMLButtonElement>('.reset-button');
    if (!resetButton) throw new Error('Reset view button was not created.');
    this.resetButton = resetButton;
    this.resetButton.addEventListener('click', onResetView);
  }

  public dispose(): void {
    this.resetButton.replaceWith(this.resetButton.cloneNode(true));
    this.element.remove();
  }
}
