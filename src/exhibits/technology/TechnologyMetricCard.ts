import type { TechnologyMetric } from '../ExhibitDefinition';

/** Compact, reusable data card for a technology performance indicator. */
export class TechnologyMetricCard {
  public readonly element: HTMLElement;

  public constructor(metric: TechnologyMetric) {
    this.element = document.createElement('article');
    this.element.className = 'technology-metric-card';
    this.element.tabIndex = 0;
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('aria-pressed', 'false');
    this.element.dataset.relatedComponents = metric.relatedComponents?.join(',') ?? '';

    const label = document.createElement('p');
    label.className = 'technology-metric-label';
    label.textContent = metric.label;
    const value = document.createElement('strong');
    value.className = 'technology-metric-value';
    value.textContent = metric.value;
    this.element.append(label, value);

    if (metric.note) {
      const note = document.createElement('small');
      note.textContent = metric.note;
      this.element.append(note);
    }
  }
}
