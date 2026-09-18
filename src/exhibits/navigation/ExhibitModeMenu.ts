import { ViewMode, type ViewMode as ViewModeValue } from '../../core/ViewMode';

export type ExhibitNavigationMode = 'equipment' | 'components' | 'exploded' | 'process' | 'technology';

const items: readonly { id: ExhibitNavigationMode; label: string; hint: string }[] = [
  { id: 'equipment', label: '设备展示', hint: '整体设备与自由视角' },
  { id: 'components', label: '部件查看', hint: '悬停并查看设备部件' },
  { id: 'exploded', label: '拆解展示', hint: '查看系统装配关系' },
  { id: 'process', label: '工艺流程', hint: '逐步演示处理流程' },
  { id: 'technology', label: '技术成果', hint: '指标与设备联动展示' },
];

/** A single, persistent mode selector layered over the existing controllers. */
export class ExhibitModeMenu {
  private readonly element = document.createElement('nav');
  private readonly buttons = new Map<ExhibitNavigationMode, HTMLButtonElement>();
  private current: ExhibitNavigationMode = 'equipment';

  public constructor(container: HTMLElement, private readonly onSelect: (mode: ExhibitNavigationMode) => void) {
    this.element.className = 'exhibit-mode-menu';
    this.element.setAttribute('aria-label', '展品展示模式');
    const heading = document.createElement('p');
    heading.innerHTML = '<span>EXHIBIT MODE</span><strong>设备展示</strong>';
    this.element.append(heading);
    const list = document.createElement('div');
    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.mode = item.id;
      button.title = item.hint;
      button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${item.label}</strong>`;
      button.addEventListener('click', this.handleClick);
      this.buttons.set(item.id, button);
      list.append(button);
    });
    this.element.append(list);
    container.append(this.element);
    this.setMode('equipment');
  }

  public show(): void { this.element.classList.add('is-visible'); }
  public hide(): void { this.element.classList.remove('is-visible'); }

  public setMode(mode: ExhibitNavigationMode): void {
    this.current = mode;
    this.buttons.forEach((button, id) => {
      const active = id === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    const label = items.find((item) => item.id === mode)?.label ?? '';
    const current = this.element.querySelector('p strong');
    if (current) current.textContent = label;
  }

  public syncViewMode(mode: ViewModeValue): void {
    if (mode === ViewMode.EXPLODED) this.setMode('exploded');
    else if (mode === ViewMode.PROCESS) this.setMode('process');
    else if (mode === ViewMode.TECHNOLOGY) this.setMode('technology');
  }

  public dispose(): void {
    this.buttons.forEach((button) => button.removeEventListener('click', this.handleClick));
    this.element.remove();
  }

  private readonly handleClick = (event: Event): void => {
    const mode = (event.currentTarget as HTMLButtonElement).dataset.mode as ExhibitNavigationMode;
    if (mode === this.current && mode !== 'components' && mode !== 'equipment') return;
    this.onSelect(mode);
  };
}
