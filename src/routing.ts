import type { Lesson, Wire } from "./types";
import { terminalInfo } from "./data/lessons";
type Point = [number, number];
const cache = new WeakMap<Wire, Point[]>();
export function route(l: Lesson, w: Wire, index: number): Point[] {
  const cached = cache.get(w);
  if (cached) return cached;
  const a = terminalInfo(l, w.from)!,
    b = terminalInfo(l, w.to)!;
  if (w.points?.length) {
    const result: Point[] = [[a.x, a.y], ...w.points, [b.x, b.y]];
    cache.set(w, result);
    return result;
  }
  const gap = 18 + (index % 5) * 5,
    ay = a.y + (a.terminal.y === 0 ? -gap : gap),
    by = b.y + (b.terminal.y === 0 ? -gap : gap);
  const boxes = l.devices.map((d) => ({
    x1: d.x - 10,
    y1: d.y - 10,
    x2: d.x + d.w + 10,
    y2: d.y + d.h + 10,
  }));
  const xs = [
    ...new Set([
      25,
      930,
      a.x,
      b.x,
      ...boxes.flatMap((r) => [r.x1 - gap / 3, r.x2 + gap / 3]),
    ]),
  ]
    .filter((n) => n >= 20 && n <= 935)
    .sort((a, b) => a - b);
  const ys = [
    ...new Set([
      22,
      648,
      ay,
      by,
      ...boxes.flatMap((r) => [r.y1 - gap / 3, r.y2 + gap / 3]),
    ]),
  ]
    .filter((n) => n >= 15 && n <= 653)
    .sort((a, b) => a - b);
  const xi = xs.indexOf(a.x),
    yi = ys.indexOf(ay),
    tx = xs.indexOf(b.x),
    ty = ys.indexOf(by);
  const blocked = (p: Point, q: Point) =>
    boxes.some((r) =>
      p[0] === q[0]
        ? p[0] > r.x1 &&
          p[0] < r.x2 &&
          Math.max(p[1], q[1]) > r.y1 &&
          Math.min(p[1], q[1]) < r.y2
        : p[1] > r.y1 &&
          p[1] < r.y2 &&
          Math.max(p[0], q[0]) > r.x1 &&
          Math.min(p[0], q[0]) < r.x2,
    );
  const key = (x: number, y: number, dir: number) => `${x},${y},${dir}`;
  type Node = {
    x: number;
    y: number;
    dir: number;
    cost: number;
    priority: number;
    key: string;
  };
  const start: Node = {
    x: xi,
    y: yi,
    dir: 0,
    cost: 0,
    priority: 0,
    key: key(xi, yi, 0),
  };
  const open = [start],
    costs = new Map([[start.key, 0]]),
    previous = new Map<string, Node>();
  let goal: Node | undefined;
  if (xi >= 0 && yi >= 0 && tx >= 0 && ty >= 0)
    while (open.length) {
      open.sort((a, b) => b.priority - a.priority);
      const current = open.pop()!;
      if (current.cost !== costs.get(current.key)) continue;
      if (current.x === tx && current.y === ty) {
        goal = current;
        break;
      }
      for (const [dx, dy, dir] of [
        [1, 0, 1],
        [-1, 0, 1],
        [0, 1, 2],
        [0, -1, 2],
      ]) {
        const x = current.x + dx,
          y = current.y + dy;
        if (x < 0 || y < 0 || x >= xs.length || y >= ys.length) continue;
        const p: Point = [xs[current.x], ys[current.y]],
          q: Point = [xs[x], ys[y]];
        if (blocked(p, q)) continue;
        const cost =
          current.cost +
          Math.abs(p[0] - q[0]) +
          Math.abs(p[1] - q[1]) +
          (current.dir && current.dir !== dir ? 22 : 0);
        const k = key(x, y, dir);
        if (cost >= (costs.get(k) ?? Infinity)) continue;
        costs.set(k, cost);
        previous.set(k, current);
        open.push({
          x,
          y,
          dir,
          cost,
          key: k,
          priority: cost + Math.abs(q[0] - b.x) + Math.abs(q[1] - by),
        });
      }
    }
  const path: Point[] = [];
  if (goal) {
    let n: Node | undefined = goal;
    while (n) {
      path.unshift([xs[n.x], ys[n.y]]);
      n = previous.get(n.key);
    }
  } else
    path.push(
      [a.x, ay],
      [(a.x + b.x) / 2, ay],
      [(a.x + b.x) / 2, by],
      [b.x, by],
    );
  const full: Point[] = [[a.x, a.y], ...path, [b.x, b.y]];
  const result = full.filter(
    (p, i) =>
      i === 0 ||
      i === full.length - 1 ||
      !(
        (full[i - 1][0] === p[0] && full[i + 1][0] === p[0]) ||
        (full[i - 1][1] === p[1] && full[i + 1][1] === p[1])
      ),
  );
  cache.set(w, result);
  return result;
}
