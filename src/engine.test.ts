import { describe, it, expect } from "vitest";
import { lessons } from "./data/lessons";
import { inspect, sampleWires, simulate } from "./engine";
import { validateWires } from "./usePractice";
const motor = lessons[2],
  light = lessons[1],
  dist = lessons[0];
describe("connection validation", () => {
  for (const l of lessons) {
    it(`${l.id} accepts correct wiring and rejects missing wiring`, () => {
      const w = sampleWires(l);
      expect(inspect(l, w).complete).toBe(true);
      expect(inspect(l, []).complete).toBe(false);
      expect(inspect(l, w.slice(1)).complete).toBe(false);
    });
  }
  it("accepts an electrically equivalent star or chain without matching exact wire list", () => {
    const w = sampleWires(motor);
    const target = w.find((v) => v.to === "FU2.1")!;
    target.from = "FU1.1";
    expect(inspect(motor, w).complete).toBe(true);
  });
  it("rejects cross-net wiring even when all correct connections exist", () => {
    const w = sampleWires(motor);
    w.push({
      id: "bad",
      from: "X.L1",
      to: "X.L2",
      color: "#d84843",
      gauge: "2.5",
    });
    expect(inspect(motor, w).complete).toBe(false);
    expect(inspect(motor, w).errors).toHaveLength(1);
    expect(simulate(motor, w, { QF: true }, true).fault).toBe(true);
  });
  it("treats each point of an internal bus as equivalent", () => {
    const w = sampleWires(dist).map((w) => ({
      ...w,
      from: w.from === "X.PE" ? w.from : w.from,
      to: w.to === "PE.1" ? "PE.4" : w.to,
    }));
    expect(inspect(dist, w).complete).toBe(true);
  });
  it("rejects malformed imports", () => {
    expect(validateWires(sampleWires(motor), motor)).toBe(true);
    expect(
      validateWires([{ ...sampleWires(motor)[0], to: "bad.1" }], motor),
    ).toBe(false);
    expect(
      validateWires([{ ...sampleWires(motor)[0], points: [[NaN, 2]] }], motor),
    ).toBe(false);
  });
});
describe("motor simulation", () => {
  const w = sampleWires(motor),
    base = { QF: true };
  it("starts, self holds, stops and does not restart on stop release", () => {
    expect(simulate(motor, w, base, true).motor).toBe(false);
    const started = simulate(motor, w, { ...base, SB2: true }, true);
    expect(started.motor).toBe(true);
    const held = simulate(motor, w, base, true, started.relay);
    expect(held.motor).toBe(true);
    const stopped = simulate(
      motor,
      w,
      { ...base, SB3: true },
      true,
      held.relay,
    );
    expect(stopped.motor).toBe(false);
    expect(simulate(motor, w, base, true, stopped.relay).motor).toBe(false);
  });
  it("jogs only while held with break-before-make release", () => {
    const run = simulate(motor, w, { ...base, SB1: true }, true);
    expect(run.motor).toBe(true);
    expect(
      simulate(motor, w, base, true, run.relay, { ...base, SB1: true }).motor,
    ).toBe(false);
  });
  it("trips on overload and loses hold on power failure", () => {
    expect(
      simulate(motor, w, { ...base, overload: true }, true, true).motor,
    ).toBe(false);
    expect(simulate(motor, w, base, false, true).motor).toBe(false);
    expect(simulate(motor, w, { QF: false }, true, true).motor).toBe(false);
  });
  it("missing auxiliary circuit prevents self holding", () => {
    const bad = w.filter((v) => v.to !== "KM.13");
    const started = simulate(motor, bad, { ...base, SB2: true }, true);
    expect(started.motor).toBe(true);
    expect(simulate(motor, bad, base, true, started.relay).motor).toBe(false);
  });
});
describe("lighting and distribution", () => {
  it("either dual-control switch toggles the lamp", () => {
    const w = sampleWires(light),
      c = { QF1: true, QF2: true, QF3: true };
    expect(simulate(light, w, c, true).lamp).toBe(true);
    expect(simulate(light, w, { ...c, S1: true }, true).lamp).toBe(false);
    expect(simulate(light, w, { ...c, S1: true, S2: true }, true).lamp).toBe(
      true,
    );
    expect(simulate(light, w, { ...c, S3: true }, true).tube).toBe(true);
    expect(simulate(light, w, { ...c, QF2: false }, true).socket).toBe(false);
  });
  it("branch power depends on main and branch breaker", () => {
    const w = sampleWires(dist);
    expect(
      simulate(
        dist,
        w,
        { QF1: true, QF2: true, QF3: true, QF4: true, QF5: true },
        true,
      ).branches,
    ).toHaveLength(4);
    expect(
      simulate(dist, w, { QF1: false, QF2: true }, true).branches,
    ).toHaveLength(0);
    expect(simulate(dist, w, { QF1: true, QF2: true }, true).branches).toEqual([
      "QF2",
    ]);
  });
});
