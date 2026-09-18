import type { ViewModeState } from '../../core/ViewMode';
import { ViewMode } from '../../core/ViewMode';
import type { ExhibitDefinition } from '../ExhibitDefinition';
import { TechnologyPanel } from './TechnologyPanel';

/** Coordinates technology-mode state without coupling it to the 3D exhibit viewer. */
export class TechnologyController {
  private readonly panel: TechnologyPanel;

  public constructor(
    container: HTMLElement,
    private readonly definition: ExhibitDefinition,
    private readonly viewMode: ViewModeState,
    private readonly onModeChange: (active: boolean) => void,
  ) {
    this.panel = new TechnologyPanel(container, () => this.exit());
  }

  public enter(): void {
    if (this.viewMode.mode !== ViewMode.EXHIBIT) return;
    this.viewMode.set(ViewMode.TECHNOLOGY);
    this.panel.render(this.definition);
    this.panel.show();
    this.onModeChange(true);
  }

  public exit(): void {
    if (this.viewMode.mode !== ViewMode.TECHNOLOGY) return;
    this.panel.hide();
    this.viewMode.set(ViewMode.EXHIBIT);
    this.onModeChange(false);
  }

  public toggle(): void { this.viewMode.mode === ViewMode.TECHNOLOGY ? this.exit() : this.enter(); }
  public dispose(): void { this.panel.dispose(); }
}
