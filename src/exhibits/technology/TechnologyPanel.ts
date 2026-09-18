import type { ExhibitDefinition } from '../ExhibitDefinition';
import { TechnologyMetricCard } from './TechnologyMetricCard';

/** DOM presentation for the structured technology achievement story. */
export class TechnologyPanel {
  private readonly element: HTMLElement;
  private readonly closeButton: HTMLButtonElement;

  public constructor(container: HTMLElement, private readonly onClose: () => void) {
    this.element = document.createElement('section');
    this.element.className = 'technology-panel';
    this.element.setAttribute('aria-label', '技术成果展示');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.innerHTML = '<button class="technology-close" type="button" aria-label="退出技术成果展示">×</button><div class="technology-content"></div>';
    const closeButton = this.element.querySelector<HTMLButtonElement>('.technology-close');
    if (!closeButton) throw new Error('Technology panel close button was not created.');
    this.closeButton = closeButton;
    this.closeButton.addEventListener('click', this.onClose);
    container.append(this.element);
  }

  public render(definition: ExhibitDefinition): void {
    const content = this.element.querySelector<HTMLElement>('.technology-content');
    if (!content) return;
    const overview = definition.technologyOverview;
    content.innerHTML = `
      <header class="technology-header">
        <p class="technology-kicker">TECHNOLOGY ACHIEVEMENT · 技术成果</p>
        <span class="technology-category"></span>
        <h2></h2><p class="technology-summary"></p>
      </header>
      <div class="technology-metrics" aria-label="核心技术指标"></div>
      <div class="technology-detail-grid">
        <section><p class="technology-section-title">技术优势</p><div class="technology-advantages"></div></section>
        <section><p class="technology-section-title">应用领域</p><div class="technology-applications"></div></section>
      </div>
      <section class="technology-economics"><p class="technology-section-title">经济性指标</p><div class="technology-economic-list"></div></section>`;
    content.querySelector<HTMLElement>('.technology-category')!.textContent = overview.category;
    content.querySelector<HTMLElement>('h2')!.textContent = overview.title;
    content.querySelector<HTMLElement>('.technology-summary')!.textContent = overview.summary;
    content.querySelector('.technology-metrics')!.replaceChildren(
      ...definition.technologyMetrics.map((metric) => new TechnologyMetricCard(metric).element),
    );
    content.querySelector('.technology-advantages')!.replaceChildren(...definition.technicalAdvantages.map((advantage, index) => {
      const item = document.createElement('article');
      item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><div><strong></strong><p></p></div>`;
      item.querySelector('strong')!.textContent = advantage.title;
      item.querySelector('p')!.textContent = advantage.description;
      return item;
    }));
    content.querySelector('.technology-applications')!.replaceChildren(...definition.applications.map((application) => {
      const item = document.createElement('span'); item.textContent = application; return item;
    }));
    content.querySelector('.technology-economic-list')!.replaceChildren(...definition.economicIndicators.map((indicator) => {
      const item = document.createElement('article');
      item.innerHTML = '<p></p><strong></strong><small></small>';
      item.querySelector('p')!.textContent = indicator.title;
      item.querySelector('strong')!.textContent = indicator.value;
      item.querySelector('small')!.textContent = indicator.description;
      return item;
    }));
  }

  public show(): void { this.element.classList.add('is-visible'); this.element.setAttribute('aria-hidden', 'false'); }
  public hide(): void { this.element.classList.remove('is-visible'); this.element.setAttribute('aria-hidden', 'true'); }
  public dispose(): void { this.closeButton.removeEventListener('click', this.onClose); this.element.remove(); }
}
