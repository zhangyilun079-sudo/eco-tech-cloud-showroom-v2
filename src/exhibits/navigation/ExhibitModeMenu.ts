export type ExhibitNavigationMode = 'exploded' | 'process' | 'technology' | 'return';

const items: readonly { id: ExhibitNavigationMode; label: string; hint: string }[] = [
  { id: 'exploded', label: '拆解展示', hint: '查看系统装配关系' },
  { id: 'process', label: '工艺流程', hint: '逐步演示处理流程' },
  { id: 'technology', label: '技术成果', hint: '指标与设备联动展示' },
  { id: 'return', label: '返回展厅', hint: '返回云展厅' },
];

/** A compact action bar that keeps the exhibit itself unobstructed. */
export class ExhibitModeMenu {
  private readonly element = document.createElement('nav');
  private readonly buttons = new Map<ExhibitNavigationMode, HTMLButtonElement>();

  public constructor(container: HTMLElement, private readonly onSelect: (mode: ExhibitNavigationMode) => void) {
    this.element.className = 'exhibit-mode-menu';
    this.element.setAttribute('aria-label', '展品操作');
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
    this.setMode(null);
  }

  public show(): void { this.element.classList.add('is-visible'); }
  public hide(): void { this.element.classList.remove('is-visible'); }

  public setMode(mode: Exclude<ExhibitNavigationMode, 'return'> | null): void {
    this.buttons.forEach((button, id) => {
      const active = id === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  public setExploded(exploded: boolean): void {
    const button = this.buttons.get('exploded');
    if (!button) return;
    const label = button.querySelector('strong');
    if (label) label.textContent = exploded ? '恢复结构' : '拆解展示';
    button.title = exploded ? '恢复设备组装结构' : '查看系统装配关系';
  }

  public dispose(): void {
    this.buttons.forEach((button) => button.removeEventListener('click', this.handleClick));
    this.element.remove();
  }

  private readonly handleClick = (event: Event): void => {
    const mode = (event.currentTarget as HTMLButtonElement).dataset.mode as ExhibitNavigationMode;
    this.onSelect(mode);
  };
}
