import type { Vector3Tuple } from 'three';
import type { ShowroomZoneId } from '../../showroom/Showroom';

export type ExhibitStatus = 'available' | 'coming';
export type ExhibitPreviewType = 'interactive' | 'holographic';

/** Catalog entry shared by zone directories and exhibit-viewer routing. */
export interface ExhibitEntry {
  readonly id: string;
  readonly zoneId: ShowroomZoneId;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly status: ExhibitStatus;
  readonly previewType: ExhibitPreviewType;
  readonly viewerId: string | null;
  /** Authored placement for the lightweight zone-directory projection. */
  readonly previewPosition: Vector3Tuple;
  /** Short label used by the existing in-scene projection. */
  readonly previewLabel: string;
}

export const zone01Exhibits: readonly ExhibitEntry[] = [
  {
    id: 'MVR_WASTEWATER',
    zoneId: 'ZONE_01',
    name: '高盐有机废水MVR蒸发分盐及资源化利用技术',
    category: '工业废水处理与资源化',
    description: '通过MVR蒸发浓缩、分盐与回收利用，实现高盐有机废水的减量化和资源化。',
    status: 'available',
    previewType: 'interactive',
    viewerId: 'mvr',
    previewPosition: [-7.2, 0, -42],
    previewLabel: '高盐有机废水 MVR',
  },
  {
    id: 'MEMBRANE_SEPARATION',
    zoneId: 'ZONE_01',
    name: '膜分离处理技术',
    category: '水处理与分离技术',
    description: '利用选择性膜分离实现水体净化、物质分离与回用。',
    status: 'coming',
    previewType: 'holographic',
    viewerId: null,
    previewPosition: [0, 0, -45],
    previewLabel: '膜分离处理技术',
  },
  {
    id: 'SMART_WATER_MONITORING',
    zoneId: 'ZONE_01',
    name: '智慧水务监测技术',
    category: '智慧水务',
    description: '融合在线感知、数据分析与智能预警，持续监测水务系统运行状态。',
    status: 'coming',
    previewType: 'holographic',
    viewerId: null,
    previewPosition: [7.2, 0, -42],
    previewLabel: '智慧水务监测技术',
  },
] as const;

export const zoneExhibits: readonly ExhibitEntry[] = [...zone01Exhibits];
