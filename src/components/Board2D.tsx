import { useEffect, useRef, useState } from "react";
import { terminalInfo } from "../data/lessons";
import { DeviceFace } from "./DeviceFace";
import type { Controls, Lesson, Simulation, Wire } from "../types";
import { route } from "../routing";
export interface BoardProps {
  lesson: Lesson;
  wires: Wire[];
  selected: string | null;
  hint: string[];
  controls: Controls;
  simulation: Simulation;
  powered: boolean;
  tool: "wire" | "erase" | "pan";
  onTerminal: (id: string) => void;
  onRemove: (id: string) => void;
  onControl: (id: string, value?: boolean) => void;
  draftPoints: [number, number][];
  onPoint: (point: [number, number]) => void;
  zoom: number;
}
export function deviceActive(id: string, s: Simulation) {
  return id === "KM"
    ? s.relay
    : id === "M"
      ? s.motor
      : id === "EL"
        ? s.lamp
        : id === "FL"
          ? s.tube
          : id === "XS"
            ? s.socket
            : s.branches.includes(id);
}
export default function Board2D(p: BoardProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const drag = useRef<[number, number] | null>(null);
  const size = 960 / p.zoom;
  const height = 690 / p.zoom;
  useEffect(() => {
    if (p.zoom === 1) setPan([0, 0]);
  }, [p.zoom]);
  const pointer = (e: { clientX: number; clientY: number }) => {
    const pt = ref.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const q = pt.matrixTransform(ref.current!.getScreenCTM()!.inverse());
    return [q.x, q.y] as [number, number];
  };
  const source = p.selected ? terminalInfo(p.lesson, p.selected) : null;
  return (
    <svg
      ref={ref}
      className={`board-svg ${p.tool === "pan" ? "pan-mode" : ""}`}
      viewBox={`${(960 - size) / 2 + pan[0]} ${(690 - height) / 2 + pan[1]} ${size} ${height}`}
      aria-label="二维接线练习板"
      onContextMenu={(e) => e.preventDefault()}
      onPointerDownCapture={(e) => {
        if (p.tool === "pan" || e.button === 1 || e.button === 2) {
          e.stopPropagation();
          e.preventDefault();
          ref.current!.setPointerCapture(e.pointerId);
          drag.current = [e.clientX, e.clientY];
        }
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onPointerMove={(e) => {
        if (drag.current) {
          const factor = 1 / ref.current!.getScreenCTM()!.a;
          const dx = (e.clientX - drag.current[0]) * factor,
            dy = (e.clientY - drag.current[1]) * factor;
          setPan(([x, y]) => [
            Math.max(-500, Math.min(500, x - dx)),
            Math.max(-350, Math.min(350, y - dy)),
          ]);
          drag.current = [e.clientX, e.clientY];
        } else setCursor(pointer(e));
      }}
      onPointerLeave={() => setCursor(null)}
      onClick={(e) => {
        if (p.selected && !p.powered && p.tool === "wire")
          p.onPoint(pointer(e));
      }}
    >
      <defs>
        <linearGradient id="case" x2="0.3" y2="1">
          <stop stopColor="#fbfcf6" />
          <stop offset=".7" stopColor="#e3e8df" />
          <stop offset="1" stopColor="#c7d0c5" />
        </linearGradient>
        <linearGradient id="darkCase" x2=".7" y2="1">
          <stop stopColor="#445657" />
          <stop offset="1" stopColor="#203137" />
        </linearGradient>
        <linearGradient id="blueSwitch" x2="0" y2="1">
          <stop stopColor="#498ccd" />
          <stop offset="1" stopColor="#246098" />
        </linearGradient>
        <linearGradient id="motorCase">
          <stop stopColor="#62777d" />
          <stop offset=".45" stopColor="#afbcc0" />
          <stop offset="1" stopColor="#566b73" />
        </linearGradient>
        <pattern
          id="boardDot"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".8" fill="#cbd4d1" />
        </pattern>
        <pattern
          id="earthWire"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="8" height="8" fill="#387e4e" />
          <rect width="4" height="8" fill="#edd248" />
        </pattern>
      </defs>
      <rect x="13" y="14" width="934" height="658" rx="12" fill="#d2dad520" />
      <rect
        x="10"
        y="10"
        width="934"
        height="658"
        rx="10"
        fill="#edf0eb"
        stroke="#c7cfcb"
      />
      <rect
        x="10"
        y="10"
        width="934"
        height="658"
        rx="10"
        fill="url(#boardDot)"
      />
      {[
        [25, 25],
        [928, 25],
        [25, 652],
        [928, 652],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={6} fill="#aab4ad" stroke="#86938b" />
          <path d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke="#eef1e8" />
        </g>
      ))}
      {p.lesson.id === "distribution" && (
        <>
          <rect
            x="35"
            y="350"
            width="882"
            height="35"
            fill="#c5cdca"
            stroke="#9eaaa6"
          />
          <path d="M35 355H917M35 379H917" stroke="#e9edeb" strokeWidth={4} />
          <text
            x="480"
            y="575"
            textAnchor="middle"
            fill="#687e74"
            fontSize={14}
          >
            分路出线端仅作带电状态观察，无需接外部负载
          </text>
        </>
      )}
      {p.lesson.devices.map((d) => (
        <g key={d.id} transform={`translate(${d.x},${d.y})`}>
          <g
            role={
              ["button", "breaker", "switch", "thermal"].includes(d.kind)
                ? "button"
                : undefined
            }
            tabIndex={
              p.powered &&
              ["button", "breaker", "switch", "thermal"].includes(d.kind)
                ? 0
                : undefined
            }
            aria-label={`操作 ${d.id} ${d.name}`}
            className={p.powered ? "operable" : ""}
            onClick={(e) => {
              e.stopPropagation();
              if (p.powered && d.kind !== "button")
                p.onControl(d.kind === "thermal" ? "overload" : d.id);
            }}
            onPointerDown={(e) => {
              if (p.powered && d.kind === "button") {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                p.onControl(d.id, true);
              }
            }}
            onPointerUp={() => {
              if (d.kind === "button") p.onControl(d.id, false);
            }}
            onPointerCancel={() => {
              if (d.kind === "button") p.onControl(d.id, false);
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && p.powered) {
                e.preventDefault();
                p.onControl(
                  d.kind === "thermal" ? "overload" : d.id,
                  d.kind === "button" ? true : undefined,
                );
              }
            }}
            onKeyUp={(e) => {
              if (d.kind === "button" && (e.key === "Enter" || e.key === " "))
                p.onControl(d.id, false);
            }}
          >
            <DeviceFace
              d={d}
              active={deviceActive(d.id, p.simulation)}
              on={!!p.controls[d.kind === "thermal" ? "overload" : d.id]}
            />
          </g>
        </g>
      ))}
      {p.wires.map((w, i) => {
        const pts = route(p.lesson, w, i)
          .map((a) => a.join(","))
          .join(" ");
        return (
          <g
            key={w.id}
            className={p.tool === "erase" ? "wire-erasable" : "wire"}
            onClick={(e) => {
              e.stopPropagation();
              if (p.tool === "erase") p.onRemove(w.id);
            }}
          >
            <polyline
              points={pts}
              fill="none"
              stroke="#29393425"
              strokeWidth={6}
              transform="translate(1,2)"
              strokeLinejoin="round"
            />
            <polyline
              points={pts}
              fill="none"
              stroke={w.color === "#35774a" ? "url(#earthWire)" : w.color}
              strokeWidth={3.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={pts}
              fill="none"
              stroke="transparent"
              strokeWidth={15}
            >
              <title>
                {w.from} → {w.to} · {w.gauge} mm²
              </title>
            </polyline>
          </g>
        );
      })}
      {source && (
        <polyline
          points={[
            [source.x, source.y],
            ...p.draftPoints,
            ...(cursor ? [cursor] : []),
          ]
            .map((a) => a.join(","))
            .join(" ")}
          fill="none"
          stroke="#087f73"
          strokeWidth={3}
          strokeDasharray="7 5"
          pointerEvents="none"
        />
      )}
      {p.lesson.devices.map((d) => (
        <text
          key={`label-${d.id}`}
          x={d.x + d.w / 2}
          y={d.y - 32}
          textAnchor="middle"
          className="device-title"
          pointerEvents="none"
        >
          {d.name}{" "}
          <tspan fill="#698078" fontSize={11}>
            {d.id}
          </tspan>
        </text>
      ))}
      {p.lesson.devices.flatMap((d) =>
        d.terminals.map((t) => {
          const chosen = p.selected === t.id,
            hinted = p.hint.includes(t.id);
          return (
            <g
              key={t.id}
              transform={`translate(${d.x + t.x},${d.y + t.y})`}
              role="button"
              tabIndex={0}
              aria-label={`端子 ${t.id}`}
              data-terminal={t.id}
              className={`terminal ${chosen ? "selected" : ""} ${hinted ? "hinted" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                p.onTerminal(t.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  p.onTerminal(t.id);
                }
              }}
            >
              <title>
                {d.name} · {t.label}
              </title>
              <circle r={14} fill="transparent" />
              {(chosen || hinted) && (
                <circle
                  r={12}
                  fill="#d7f3e8"
                  stroke="#078572"
                  strokeWidth={2}
                />
              )}
              <circle
                r={7}
                fill={chosen ? "#087f73" : "#c0c6b7"}
                stroke={chosen ? "#07594f" : "#697c6f"}
                strokeWidth={1.5}
              />
              <path
                d="M-3 0h6M0 -3v6"
                stroke={chosen ? "white" : "#627061"}
                strokeWidth={1.5}
              />
              <text
                y={t.y === 0 ? -13 : 23}
                textAnchor="middle"
                className="terminal-label"
              >
                {t.label}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
