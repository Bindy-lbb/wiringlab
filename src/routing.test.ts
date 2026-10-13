import { describe, it, expect } from "vitest";
import { lessons, terminalInfo } from "./data/lessons";
import { sampleWires } from "./engine";
import { route } from "./routing";
describe("orthogonal automatic routing", () => {
  for (const lesson of lessons)
    it(`${lesson.id}: connects exact terminals and avoids device interiors`, () => {
      sampleWires(lesson).forEach((wire, index) => {
        const points = route(lesson, wire, index),
          a = terminalInfo(lesson, wire.from)!,
          b = terminalInfo(lesson, wire.to)!;
        expect(points[0]).toEqual([a.x, a.y]);
        expect(points.at(-1)).toEqual([b.x, b.y]);
        for (let i = 1; i < points.length; i++) {
          const p = points[i - 1],
            q = points[i];
          expect(p[0] === q[0] || p[1] === q[1]).toBe(true);
          for (const d of lesson.devices) {
            const crossing =
              p[0] === q[0]
                ? p[0] > d.x &&
                  p[0] < d.x + d.w &&
                  Math.max(p[1], q[1]) > d.y &&
                  Math.min(p[1], q[1]) < d.y + d.h
                : p[1] > d.y &&
                  p[1] < d.y + d.h &&
                  Math.max(p[0], q[0]) > d.x &&
                  Math.min(p[0], q[0]) < d.x + d.w;
            expect(crossing, `${wire.from}→${wire.to} crossed ${d.id}`).toBe(
              false,
            );
          }
        }
      });
    });
});
