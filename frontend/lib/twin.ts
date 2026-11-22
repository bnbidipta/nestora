export interface ColorWall {
  name: string;
  rgb: string;
  cmyk: string;
  lrv: number;
  hex?: string;
}

export interface Room {
  name: string;
  length_ft: number;
  width_ft: number;
  area_sqft: number;
  window_area_sqft: number;
  door_width_mm: number;
  color_wall_A: ColorWall;
  color_accent?: ColorWall;
  material_floor: string;
  x: number;
  y: number;
  is_ground_floor?: boolean;
  type?: string;
  exterior?: boolean;
  compass?: string;
}

export interface Floor {
  floor_no: number;
  floor_height_ft: number;
  clear_height_ft: number;
  area_sqft: number;
  rooms: Room[];
}

export interface Column {
  x: number;
  y: number;
  size_mm: number;
  size_y_mm?: number;
  load_tons: number;
  reason?: string;
}

export interface Beam {
  span_m: number;
  depth_mm: number;
  width_mm?: number;
  reason?: string;
}

export interface Foundation {
  type: string;
  depth_ft: number;
  bearing_capacity_kn_m2: number;
  reason?: string;
}

export interface Structure {
  columns: Column[];
  beams: Beam[];
  foundation: Foundation;
  safety_factor: number;
  wall_load_bearing_mm: number;
  wall_partition_mm: number;
}

export interface WastePipe {
  type: string;
  dia_mm: number;
  slope: string;
}

export interface ACUnit {
  type: string;
  tonnage: number;
  room: string;
}

export interface MEP {
  electrical_points: number;
  waste_pipes: WastePipe[];
  pump_head_m: number;
  electrical_water_separation_mm: number;
  ac_units: ACUnit[];
}

export interface StyleInfo {
  primary_style: string;
  secondary_style: string;
  mix_pct: string;
  taste_vector: number[];
}

export interface BOQ {
  cement_bags: number;
  steel_kg: number;
  sand_tons?: number;
  aggregate_tons?: number;
  bricks_count?: number;
  cost_breakdown: Record<string, number>;
  total_cost_inr: number;
  monthly_emi_inr?: number;
}

export interface PlotInfo {
  address: string;
  plot_width_ft: number;
  plot_depth_ft: number;
  plot_area_sqft: number;
  orientation: string;
  road_width_ft: number;
  soil_type: string;
  water_table_m: number;
}

export interface BudgetInfo {
  total_budget_inr: number;
  contingency_pct: number;
  construction_cost_sqft_inr?: number;
}

export interface HouseTwin {
  house_id: string;
  version: string;
  status: string;
  plot: PlotInfo;
  family: any;
  budget: BudgetInfo;
  floors: Floor[];
  structure: Structure;
  mep: MEP;
  style: StyleInfo;
  boq: BOQ;
  swipe_history: any[];
  metadata: Record<string, any>;
}

export interface JudgeIssue {
  rule_id: string;
  message: string;
}

/** Shape of twin.metadata.final_judge, written by backend JudgeResult.to_dict(). */
export interface JudgeSummary {
  pass: boolean;
  failures: JudgeIssue[];
  warnings: JudgeIssue[];
}

/** Judge check categories, keyed by rule_id prefix (backend/app/services/judge.py). */
export const JUDGE_CATEGORIES: { prefix: string; title: string }[] = [
  { prefix: 'A_', title: 'Area & dimension math' },
  { prefix: 'B_', title: 'Building rules (setbacks, FSI, room sizes, doors)' },
  { prefix: 'C_', title: 'Structure (columns, beams, safety factor)' },
  { prefix: 'D_', title: 'Plumbing & electrical (slopes, separation, pump)' },
  { prefix: 'E_', title: 'Ergonomics (circulation, kitchen work triangle)' },
];

export function getJudge(twin: HouseTwin): JudgeSummary | null {
  const j = twin.metadata?.final_judge;
  return j && typeof j.pass === 'boolean' ? (j as JudgeSummary) : null;
}

export function builtUpSqft(twin: HouseTwin): number {
  return twin.floors.reduce((sum, f) => sum + f.area_sqft, 0);
}

export function formatINR(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
