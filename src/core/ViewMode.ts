export const ViewMode = {
  SHOWROOM: 'SHOWROOM',
  EXHIBIT: 'EXHIBIT',
} as const;

export type ViewMode = typeof ViewMode[keyof typeof ViewMode];

/** Single source of truth for the interaction mode used by the scene and UI. */
export class ViewModeState {
  private currentMode: ViewMode = ViewMode.SHOWROOM;

  public get mode(): ViewMode {
    return this.currentMode;
  }

  public set(mode: ViewMode): void {
    this.currentMode = mode;
  }
}
