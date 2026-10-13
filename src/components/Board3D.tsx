import { SceneLabel as Html } from "./SceneLabel";
import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Line, RoundedBox } from "@react-three/drei";
import type { OrthographicCamera } from "three";
import type { Device } from "../types";
import { deviceActive, type BoardProps } from "./Board2D";
import { route } from "../routing";
import { terminalInfo } from "../data/lessons";
const pos = (x: number, y: number, z = 0.38): [number, number, number] => [
  (x - 480) / 100,
  z,
  (y - 345) / 100,
];
function CameraReset({ reset }: { reset: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    camera.position.set(0, 12, 6);
    (camera as OrthographicCamera).zoom = Math.min(
      size.width / 10.3,
      size.height / 7.6,
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [reset, camera, size.width, size.height]);
  return null;
}
function Label({
  x,
  y,
  height = 0.65,
  children,
}: {
  x: number;
  y: number;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <Html
      position={pos(x, y, height)}
      center
      zIndexRange={[3, 0]}
      style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
    >
      {children}
    </Html>
  );
}
function Box({
  x,
  y,
  w,
  h,
  depth = 0.35,
  color = "#e5e9df",
  elevation = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  depth?: number;
  color?: string;
  elevation?: number;
}) {
  return (
    <RoundedBox
      args={[w / 100, depth, h / 100]}
      radius={0.025}
      smoothness={2}
      position={pos(x + w / 2, y + h / 2, elevation + depth / 2 + 0.06)}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.62} metalness={0.12} />
    </RoundedBox>
  );
}
function Model({ d, on, active }: { d: Device; on: boolean; active: boolean }) {
  const { x, y, w, h, kind } = d;
  const dark = ["contactor", "supply", "bus"].includes(kind);
  return (
    <group>
      <Box
        x={x}
        y={y}
        w={w}
        h={h}
        color={dark ? "#30433f" : "#e5e9df"}
        depth={kind === "motor" ? 0.6 : 0.35}
      />
      {kind === "breaker" && (
        <>
          {d.terminals
            .filter((t) => t.y === 0)
            .map((t) => (
              <Box
                key={t.id}
                x={x + t.x - 14}
                y={y + 19}
                w={28}
                h={h - 36}
                elevation={0.35}
                depth={0.035}
                color="#cad3c8"
              />
            ))}
          <Box
            x={x + 8}
            y={y + h * (on ? 0.34 : 0.53)}
            w={w - 16}
            h={16}
            depth={0.17}
            elevation={0.37}
            color="#387eb5"
          />
        </>
      )}
      {kind === "fuse" &&
        d.terminals
          .filter((t) => t.y === 0)
          .map((t) => (
            <group key={t.id}>
              <Box
                x={x + t.x - 10}
                y={y + 16}
                w={20}
                h={h - 32}
                depth={0.08}
                elevation={0.35}
                color="#65756e"
              />
              <Box
                x={x + t.x - 6}
                y={y + 23}
                w={12}
                h={h - 46}
                depth={0.1}
                elevation={0.43}
                color="#c9cabc"
              />
            </group>
          ))}
      {kind === "contactor" && (
        <>
          <Box
            x={x + 9}
            y={y + 13}
            w={w - 18}
            h={22}
            depth={0.045}
            elevation={0.35}
            color="#e1e6db"
          />
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              x={x + 23 + i * 48}
              y={y + 52}
              w={33}
              h={29}
              depth={active ? 0.07 : 0.16}
              elevation={0.35}
              color={active ? "#239b82" : "#40759b"}
            />
          ))}
          <Box
            x={x + 9}
            y={y + h - 29}
            w={w - 18}
            h={19}
            depth={0.045}
            elevation={0.35}
            color="#e1e6db"
          />
        </>
      )}
      {kind === "button" && (
        <mesh position={pos(x + w / 2, y + h / 2, on ? 0.43 : 0.55)} castShadow>
          <cylinderGeometry args={[0.23, 0.26, 0.2, 32]} />
          <meshStandardMaterial color={d.color} />
        </mesh>
      )}
      {kind === "thermal" && (
        <>
          <mesh position={pos(x + w * 0.31, y + h * 0.45, 0.46)}>
            <cylinderGeometry args={[0.22, 0.22, 0.1, 24]} />
            <meshStandardMaterial color="#5b95b1" />
          </mesh>
          <Box
            x={x + w * 0.65}
            y={y + h * 0.4}
            w={19}
            h={17}
            depth={0.1}
            elevation={0.35}
            color={on ? "#e84838" : "#b05e43"}
          />
        </>
      )}
      {kind === "motor" && (
        <>
          {Array.from({ length: 14 }, (_, i) => (
            <Box
              key={i}
              x={x + 28 + i * 15}
              y={y + 4}
              w={5}
              h={h - 8}
              depth={0.1}
              elevation={0.6}
              color="#627879"
            />
          ))}
          <Box
            x={x + w * 0.3}
            y={y + 6}
            w={w * 0.4}
            h={27}
            depth={0.18}
            elevation={0.7}
            color="#314a48"
          />
          <mesh
            position={pos(x + w + 10, y + h / 2, 0.4)}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.32, 24]} />
            <meshStandardMaterial
              color={active ? "#2bad80" : "#82928e"}
              metalness={0.6}
            />
          </mesh>
        </>
      )}
      {kind === "meter" && (
        <>
          <Box
            x={x + 13}
            y={y + 15}
            w={w - 26}
            h={h - 45}
            depth={0.08}
            elevation={0.35}
            color="#b6cec0"
          />
          <Box
            x={x + 25}
            y={y + 30}
            w={w - 50}
            h={25}
            depth={0.025}
            elevation={0.43}
            color="#455e50"
          />
          <Label x={x + w / 2} y={y + 42} height={0.5}>
            <span className="meter-3d">00012.8</span>
          </Label>
        </>
      )}
      {kind === "bus" && (
        <Box
          x={x + 8}
          y={y + 6}
          w={w - 16}
          h={h - 12}
          depth={0.05}
          elevation={0.35}
          color={d.color || "#aab8b0"}
        />
      )}
      {kind === "switch" && (
        <Box
          x={x + 13}
          y={y + 13}
          w={w - 26}
          h={h - 26}
          depth={on ? 0.045 : 0.11}
          elevation={0.35}
          color="#cfd9ce"
        />
      )}
      {kind === "spd" &&
        [0.25, 0.75].map((t) => (
          <Box
            key={t}
            x={x + w * t - 9}
            y={y + h * 0.55}
            w={18}
            h={12}
            depth={0.03}
            elevation={0.35}
            color="#41a77c"
          />
        ))}
      {kind === "socket" && (
        <>
          {[
            [w / 2, h / 2 - 14],
            [w / 2 - 18, h / 2 + 12],
            [w / 2 + 18, h / 2 + 12],
          ].map(([a, b], i) => (
            <Box
              key={i}
              x={x + a - 3}
              y={y + b - 8}
              w={6}
              h={16}
              depth={0.01}
              elevation={0.35}
              color="#43594d"
            />
          ))}
        </>
      )}
      {kind === "lamp" && (
        <mesh position={pos(x + w / 2, y + h / 2, 0.47)}>
          <sphereGeometry args={[0.29, 32, 16]} />
          <meshStandardMaterial
            color={active ? "#fff0a4" : "#f5f3df"}
            emissive={active ? "#ffc756" : "#000000"}
            emissiveIntensity={active ? 0.7 : 0}
          />
        </mesh>
      )}
      {kind === "tube" &&
        [35, w - 35].map((a) => (
          <mesh
            key={a}
            position={pos(x + a, y + h / 2, 0.48)}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.085, 0.085, (h - 22) / 100, 16]} />
            <meshStandardMaterial
              color={active ? "#fffac6" : "#eaf1e2"}
              emissive={active ? "#ffe3a1" : "#000000"}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      {kind === "ballast" && (
        <Box
          x={x + 9}
          y={y + 12}
          w={w - 18}
          h={h - 24}
          depth={0.02}
          elevation={0.35}
          color="#f1f0d7"
        />
      )}
    </group>
  );
}
function Scene(p: BoardProps & { reset: number }) {
  const orbit = useRef<any>(null);
  useEffect(() => {
    orbit.current?.target.set(0, 0, 0);
    orbit.current?.update();
  }, [p.reset]);
  return (
    <>
      <CameraReset reset={p.reset} />
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[-4, 9, 3]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[5, 6, -4]} intensity={0.7} />
      <Box
        x={10}
        y={10}
        w={934}
        h={658}
        depth={0.14}
        elevation={-0.22}
        color="#e0e6da"
      />
      {p.lesson.devices.map((d) => (
        <group
          key={d.id}
          onClick={(e) => {
            e.stopPropagation();
            if (p.powered && d.kind !== "button")
              p.onControl(d.kind === "thermal" ? "overload" : d.id);
          }}
        >
          <Model
            d={d}
            on={!!p.controls[d.kind === "thermal" ? "overload" : d.id]}
            active={deviceActive(d.id, p.simulation)}
          />
          <Label
            x={d.x + d.w / 2}
            y={d.y - 45}
            height={d.kind === "motor" ? 1 : 0.6}
          >
            <span className="label-3d">
              {d.name} <b>{d.id}</b>
            </span>
          </Label>
          {p.powered &&
            ["button", "breaker", "switch", "thermal"].includes(d.kind) && (
              <Html
                position={pos(d.x + d.w / 2, d.y + d.h / 2, 0.68)}
                center
                zIndexRange={[5, 0]}
              >
                <button
                  className="control-3d"
                  aria-label={`三维操作 ${d.id}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (d.kind === "button") {
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (d.kind !== "button")
                      p.onControl(d.kind === "thermal" ? "overload" : d.id);
                  }}
                >
                  {d.kind === "button"
                    ? "按住"
                    : d.kind === "thermal"
                      ? "保护"
                      : p.controls[d.id]
                        ? "合"
                        : "分"}
                </button>
              </Html>
            )}
          {d.terminals.map((t) => (
            <group key={t.id}>
              <mesh
                position={pos(
                  d.x + t.x,
                  d.y + t.y,
                  d.kind === "motor" ? 0.85 : 0.45,
                )}
              >
                <cylinderGeometry args={[0.065, 0.065, 0.045, 16]} />
                <meshStandardMaterial
                  color={p.selected === t.id ? "#079b7f" : "#adb7a7"}
                  metalness={0.65}
                  roughness={0.3}
                />
              </mesh>
              <Html
                position={pos(
                  d.x + t.x,
                  d.y + t.y,
                  d.kind === "motor" ? 0.9 : 0.51,
                )}
                center
                zIndexRange={[6, 0]}
              >
                <button
                  aria-label={`端子 ${t.id}`}
                  data-terminal={t.id}
                  className={`terminal-3d ${p.selected === t.id ? "selected" : ""} ${p.hint.includes(t.id) ? "hinted" : ""}`}
                  title={`${d.name} ${t.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onTerminal(t.id);
                  }}
                >
                  {t.label}
                </button>
              </Html>
            </group>
          ))}
        </group>
      ))}
      {p.wires.map((w, i) => {
        const points = route(p.lesson, w, i);
        const height = (id: string) =>
          terminalInfo(p.lesson, id)?.device.kind === "motor" ? 0.9 : 0.5;
        return (
          <Line
            key={w.id}
            points={points.map(([x, y], n) =>
              pos(
                x,
                y,
                n === 0
                  ? height(w.from)
                  : n === points.length - 1
                    ? height(w.to)
                    : 0.58,
              ),
            )}
            color={w.color}
            lineWidth={3}
            onClick={(e) => {
              e.stopPropagation();
              if (p.tool === "erase") p.onRemove(w.id);
            }}
          />
        );
      })}
      <OrbitControls
        ref={orbit}
        makeDefault
        enablePan
        enableZoom
        minZoom={35}
        maxZoom={150}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </>
  );
}
export default function Board3D(p: BoardProps & { reset: number }) {
  return (
    <div className="board-3d">
      <Canvas
        shadows
        orthographic
        camera={{ position: [0, 10, 7], zoom: 65, near: 0.1, far: 100 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#e9eeea"]} />
        <Suspense fallback={null}>
          <Scene {...p} />
        </Suspense>
      </Canvas>
      <div className="three-instructions">拖动旋转 · 滚轮缩放 · 右键平移</div>
    </div>
  );
}
