export type Kind =
  | "supply"
  | "breaker"
  | "fuse"
  | "contactor"
  | "thermal"
  | "button"
  | "motor"
  | "bus"
  | "spd"
  | "meter"
  | "socket"
  | "switch"
  | "lamp"
  | "ballast"
  | "tube";
export interface Terminal {
  id: string;
  label: string;
  x: number;
  y: number;
}
export interface Device {
  id: string;
  name: string;
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  terminals: Terminal[];
  color?: string;
  role?: string;
}
export interface Lesson {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  short: string;
  description: string;
  pdf: string;
  devices: Device[];
  nets: string[][];
  fixed: [string, string][];
}
export interface Wire {
  id: string;
  from: string;
  to: string;
  color: string;
  gauge: string;
  points?: [number, number][];
}
export interface Controls {
  [key: string]: boolean;
}
export interface Inspection {
  complete: boolean;
  connected: number;
  required: number;
  errors: { message: string; wireId?: string }[];
  missing: [string, string][];
}
export interface Simulation {
  relay: boolean;
  motor: boolean;
  lamp: boolean;
  tube: boolean;
  socket: boolean;
  branches: string[];
  fault: boolean;
}
export const COLORS = [
  { value: "#d84843", name: "红色" },
  { value: "#d1a823", name: "黄色" },
  { value: "#2479c9", name: "蓝色" },
  { value: "#35774a", name: "黄绿双色" },
  { value: "#434b55", name: "黑色" },
];
