import type { Controls, Inspection, Lesson, Simulation, Wire } from "./types";
export class Connectivity {
  parent = new Map<string, string>();
  root(a: string): string {
    if (!this.parent.has(a)) this.parent.set(a, a);
    const p = this.parent.get(a)!;
    if (p !== a) this.parent.set(a, this.root(p));
    return this.parent.get(a)!;
  }
  join(a: string, b: string) {
    this.parent.set(this.root(a), this.root(b));
  }
  same(a: string, b: string) {
    return this.root(a) === this.root(b);
  }
}
const terminals = (l: Lesson) =>
  l.devices.flatMap((d) => d.terminals.map((t) => t.id));
function expected(l: Lesson) {
  const g = new Connectivity();
  for (const net of l.nets) for (const t of net.slice(1)) g.join(net[0], t);
  return g;
}
export function inspect(l: Lesson, wires: Wire[]): Inspection {
  const target = expected(l),
    actual = new Connectivity(),
    valid = new Set(terminals(l));
  const errors: Inspection["errors"] = [];
  for (const [a, b] of l.fixed) actual.join(a, b);
  for (const w of wires) {
    if (!valid.has(w.from) || !valid.has(w.to)) {
      errors.push({ message: "导线包含不存在的端子", wireId: w.id });
      continue;
    }
    if (w.from === w.to) {
      errors.push({ message: "导线两端不能是同一端子", wireId: w.id });
      continue;
    }
    if (!target.same(w.from, w.to)) {
      errors.push({
        message: `${w.from} → ${w.to}：跨接了不同电气节点`,
        wireId: w.id,
      });
      continue;
    }
    actual.join(w.from, w.to);
  }
  const missing: Inspection["missing"] = [];
  let required = 0,
    connected = 0;
  const fixedGraph = new Connectivity();
  for (const [a, b] of l.fixed) fixedGraph.join(a, b);
  for (const net of l.nets) {
    const unique = net.filter(
      (t, i) => net.findIndex((u) => fixedGraph.same(t, u)) === i,
    );
    required += Math.max(0, unique.length - 1);
    const components: string[] = [];
    for (const t of unique)
      if (!components.some((u) => actual.same(u, t))) components.push(t);
    connected += Math.max(0, unique.length - components.length);
    for (let i = 1; i < components.length; i++)
      missing.push([components[0], components[i]]);
  }
  return {
    complete: errors.length === 0 && missing.length === 0,
    connected,
    required,
    errors,
    missing,
  };
}
export function sampleWires(l: Lesson): Wire[] {
  const g = new Connectivity();
  for (const [a, b] of l.fixed) g.join(a, b);
  const out: Wire[] = [];
  for (const [n, net] of l.nets.entries())
    for (const to of net.slice(1)) {
      if (g.same(net[0], to)) continue;
      g.join(net[0], to);
      out.push({
        id: `demo-${n}-${to}`,
        from: net[0],
        to,
        color: net.some((t) => t.includes("PE"))
          ? "#35774a"
          : net.some((t) => t === "X.N" || t.startsWith("N.") || t === "DD.4")
            ? "#2479c9"
            : n % 3 === 1
              ? "#d1a823"
              : "#d84843",
        gauge: "2.5",
      });
    }
  return out;
}
export const off: Simulation = {
  relay: false,
  motor: false,
  lamp: false,
  tube: false,
  socket: false,
  branches: [],
  fault: false,
};
export function simulate(
  l: Lesson,
  wires: Wire[],
  controls: Controls,
  powered: boolean,
  previousRelay = false,
  previousControls: Controls = {},
): Simulation {
  if (!powered) return { ...off };
  const graph = (relay: boolean, jogReleasing = false) => {
    const g = new Connectivity();
    for (const w of wires) g.join(w.from, w.to);
    for (const e of l.fixed) g.join(...e);
    for (const d of l.devices) {
      const join = (a: string, b: string) =>
        g.join(`${d.id}.${a}`, `${d.id}.${b}`);
      if (d.kind === "breaker" && controls[d.id])
        for (const t of d.terminals.filter((t) => t.y === 0))
          join(t.label, String(Number(t.label) + 1));
      if (d.kind === "fuse" || d.kind === "thermal")
        for (const t of d.terminals.filter((t) =>
          ["1", "3", "5"].includes(t.label),
        ))
          join(t.label, String(Number(t.label) + 1));
      if (d.kind === "thermal" && !controls.overload) join("95", "96");
      if (d.kind === "contactor" && relay) {
        join("1", "2");
        join("3", "4");
        join("5", "6");
        join("13", "14");
      }
      if (d.kind === "button") {
        const pressed = !!controls[d.id];
        if (d.role === "stop" && !pressed) join("21", "22");
        if (d.role !== "stop" && pressed) join("13", "14");
        if (d.role === "jog" && !pressed && !jogReleasing) join("21", "22");
      }
      if (d.kind === "meter") {
        join("1", "2");
        join("3", "4");
      }
      if (d.kind === "switch") {
        if (d.id === "S3") {
          if (controls[d.id]) join("1", "2");
        } else join("C", controls[d.id] ? "2" : "1");
      }
    }
    return g;
  };
  const source =
    l.id === "motor"
      ? ["X.L1", "X.L2", "X.L3", "X.PE"]
      : ["X.L", "X.N", "X.PE"];
  const fault = (g: Connectivity) =>
    source.some((a, i) => source.slice(i + 1).some((b) => g.same(a, b)));
  const coilLive = (g: Connectivity) =>
    l.id === "motor" &&
    ((g.same("KM.A1", "X.L1") && g.same("KM.A2", "X.L2")) ||
      (g.same("KM.A2", "X.L1") && g.same("KM.A1", "X.L2")));
  // Compound jog contact: the NO opens before the NC closes on release.
  // Evaluate that intermediate network so the relay drops before self-hold can reconnect.
  let relay = previousRelay;
  if (previousControls.SB1 && !controls.SB1)
    relay = coilLive(graph(relay, true));
  let g = graph(relay);
  for (let i = 0; i < 8; i++) {
    if (fault(g)) return { ...off, fault: true };
    const next = coilLive(g);
    if (next === relay) break;
    relay = next;
    g = graph(relay);
  }
  const live = (a: string, b: string) => g.same(a, "X.L") && g.same(b, "X.N");
  const motor =
    l.id === "motor" &&
    ["U", "V", "W"].every((t, i) => g.same(`M.${t}`, `X.L${i + 1}`));
  const lamp = l.id === "lighting" && live("EL.L", "EL.N");
  const tube =
    l.id === "lighting" &&
    live("ZL.L", "ZL.N") &&
    ["1", "2", "3", "4"].every((i) => g.same(`ZL.T${i}`, `FL.${i}`));
  const branches =
    l.id === "distribution"
      ? ["QF2", "QF3", "QF4", "QF5"].filter(
          (id) =>
            g.same(`${id}.2`, "X.L") &&
            (id === "QF4" || id === "QF5" || g.same(`${id}.4`, "X.N")),
        )
      : [];
  return {
    relay,
    motor,
    lamp,
    tube,
    socket: l.id === "lighting" && live("XS.L", "XS.N"),
    branches,
    fault: false,
  };
}
