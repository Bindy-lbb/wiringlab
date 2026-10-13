import { useEffect, useRef, useState } from "react";
import { inspect, off, simulate } from "./engine";
import type { Controls, Lesson, Simulation, Wire } from "./types";
export function validateWires(value: unknown, lesson: Lesson): value is Wire[] {
  if (!Array.isArray(value) || value.length > 500) return false;
  const ids = new Set(
    lesson.devices.flatMap((d) => d.terminals.map((t) => t.id)),
  );
  const seen = new Set<string>();
  return value.every((w) => {
    if (
      !w ||
      typeof w.id !== "string" ||
      seen.has(w.id) ||
      !ids.has(w.from) ||
      !ids.has(w.to) ||
      w.from === w.to ||
      !/^#[0-9a-f]{6}$/i.test(w.color) ||
      !["1.5", "2.5", "4"].includes(w.gauge)
    )
      return false;
    seen.add(w.id);
    return (
      w.points === undefined ||
      (Array.isArray(w.points) &&
        w.points.length <= 100 &&
        w.points.every(
          (p: unknown) =>
            Array.isArray(p) &&
            p.length === 2 &&
            p.every(
              (n) =>
                typeof n === "number" &&
                Number.isFinite(n) &&
                n >= -1000 &&
                n <= 2000,
            ),
        ))
    );
  });
}
function read(lesson: Lesson): Wire[] {
  try {
    const s = JSON.parse(
      localStorage.getItem(`wiring-v1-${lesson.id}`) || "null",
    );
    return s?.version === 1 && validateWires(s.wires, lesson) ? s.wires : [];
  } catch {
    return [];
  }
}
export function usePractice(lesson: Lesson) {
  const [wires, setWires] = useState<Wire[]>(() => read(lesson));
  const [undo, setUndo] = useState<Wire[][]>([]),
    [redo, setRedo] = useState<Wire[][]>([]);
  const [powered, setPowered] = useState(false),
    [controls, setControls] = useState<Controls>({});
  const [simulation, setSimulation] = useState<Simulation>({ ...off });
  const previous = useRef(false);
  const previousControls = useRef<Controls>({});
  const [saveStatus, setSaveStatus] = useState("本地已保存");
  useEffect(() => {
    try {
      localStorage.setItem(
        `wiring-v1-${lesson.id}`,
        JSON.stringify({ version: 1, wires }),
      );
      setSaveStatus("本地已保存");
    } catch {
      setSaveStatus("保存失败，请导出备份");
    }
  }, [wires, lesson.id]);
  useEffect(() => {
    const next = simulate(
      lesson,
      wires,
      controls,
      powered,
      previous.current,
      previousControls.current,
    );
    previous.current = next.relay;
    previousControls.current = controls;
    setSimulation(next);
    if (next.fault) {
      setPowered(false);
      setControls({});
    }
  }, [lesson, wires, controls, powered]);
  useEffect(() => {
    const release = () =>
      setControls((c) => ({ ...c, SB1: false, SB2: false, SB3: false }));
    window.addEventListener("blur", release);
    return () => window.removeEventListener("blur", release);
  }, []);
  function change(next: Wire[]) {
    if (powered) return;
    setUndo((s) => [...s.slice(-49), wires]);
    setRedo([]);
    setWires(next);
  }
  function undoAction() {
    if (powered || !undo.length) return;
    setRedo((r) => [...r, wires]);
    setWires(undo[undo.length - 1]);
    setUndo(undo.slice(0, -1));
  }
  function redoAction() {
    if (powered || !redo.length) return;
    setUndo((u) => [...u, wires]);
    setWires(redo[redo.length - 1]);
    setRedo(redo.slice(0, -1));
  }
  function power() {
    if (powered) {
      setPowered(false);
      setControls({});
      return true;
    }
    if (!inspect(lesson, wires).complete) return false;
    setControls(
      Object.fromEntries(
        lesson.devices
          .filter((d) => d.kind === "breaker")
          .map((d) => [d.id, true]),
      ),
    );
    setPowered(true);
    return true;
  }
  return {
    wires,
    change,
    undoAction,
    redoAction,
    canUndo: !!undo.length,
    canRedo: !!redo.length,
    powered,
    power,
    controls,
    simulation,
    saveStatus,
    control: (id: string, value?: boolean) => {
      if (powered) setControls((c) => ({ ...c, [id]: value ?? !c[id] }));
    },
  };
}
