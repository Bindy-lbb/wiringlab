import {
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

/** Project an accessible DOM label into the canvas, with independently owned DOM.
 * Defer root cleanup until the outer React commit has finished. Unmount the root
 * BEFORE removing its container, including when the canvas itself is detached.
 */
export function SceneLabel({
  position,
  children,
  style,
  zIndexRange = [3, 0],
}: {
  position: [number, number, number];
  children: ReactNode;
  center?: boolean;
  style?: CSSProperties;
  zIndexRange?: [number, number];
}) {
  const { gl, camera, size } = useThree();
  const current = useRef<{ element: HTMLDivElement; root: Root } | null>(null);
  const vector = useMemo(() => new Vector3(), []);
  useLayoutEffect(() => {
    const element = document.createElement("div");
    Object.assign(element.style, {
      position: "absolute",
      top: "0",
      left: "0",
      pointerEvents: "none",
    });
    gl.domElement.parentElement!.appendChild(element);
    const root = createRoot(element);
    current.current = { element, root };
    return () => {
      current.current = null;
      queueMicrotask(() => {
        root.unmount();
        element.remove();
      });
    };
  }, [gl]);
  useLayoutEffect(() => {
    const item = current.current;
    if (!item) return;
    item.element.style.zIndex = String(zIndexRange[0]);
    item.root.render(
      <div
        style={{
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          pointerEvents: "auto",
          ...style,
        }}
      >
        {children}
      </div>,
    );
  });
  useFrame(() => {
    const item = current.current;
    if (!item) return;
    vector.set(...position).project(camera);
    const x = ((vector.x + 1) * size.width) / 2,
      y = ((1 - vector.y) * size.height) / 2;
    item.element.style.transform = `translate3d(${x}px,${y}px,0)`;
    item.element.style.display = vector.z > 1 || vector.z < -1 ? "none" : "";
  });
  return null;
}
