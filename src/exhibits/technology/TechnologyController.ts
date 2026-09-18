import type { ViewModeState } from '../../core/ViewMode';
import { ViewMode } from '../../core/ViewMode';
import type { ExhibitDefinition } from '../ExhibitDefinition';
import type { Object3D } from 'three';
import { TechnologyHighlightController } from './TechnologyHighlightController';
import { TechnologyPanel } from './TechnologyPanel';

/** Coordinates technology-mode state without coupling it to the 3D exhibit viewer. */
export class TechnologyController {
  private readonly panel: TechnologyPanel;
  private readonly highlights: TechnologyHighlightController;

  public constructor(
    container: HTMLElement,
    root: Object3D,
    private readonly definition: ExhibitDefinition,
    private readonly viewMode: ViewModeState,
    private readonly onModeChange: (active: boolean) => void,
  ) {
    this.highlights = new TechnologyHighlightController(root);
    this.panel = new TechnologyPanel(container, () => this.exit(), (ids) => {
      if (ids.length > 0) this.highlights.highlight(ids);
      else this.highlights.reset();
    });
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
  public resetHighlight(): void { this.highlights.reset(); }
  public dispose(): void { this.panel.dispose(); this.highlights.dispose(); }
}
