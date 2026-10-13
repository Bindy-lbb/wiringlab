import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Box,
  Check,
  CircuitBoard,
  Download,
  Eraser,
  FileImage,
  HelpCircle,
  Lightbulb,
  Maximize2,
  MousePointer2,
  Hand,
  PlugZap,
  Redo2,
  RotateCcw,
  Save,
  Settings2,
  Square,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { lessons } from "./data/lessons";
import { inspect, sampleWires } from "./engine";
import { COLORS, type Lesson, type Wire } from "./types";
import { usePractice, validateWires } from "./usePractice";
import Board2D from "./components/Board2D";
import AssistantPanel from "./components/AssistantPanel";
const Board3D = lazy(() => import("./components/Board3D"));
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        <Box size={36} />
        <h3>三维场景暂时无法加载</h3>
        <p>
          请使用支持 WebGL 的浏览器并开启硬件加速。二维接线及保存仍可正常使用。
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Sidebar({
  current,
  onChange,
}: {
  current: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="sidebar" aria-label="练习项目">
      <div className="sidebar-title">
        练习项目 <span>03</span>
      </div>
      <div className="lesson-nav">
        {lessons.map((l, i) => {
          const Icon = i === 0 ? CircuitBoard : i === 1 ? Lightbulb : Settings2;
          return (
            <button
              key={l.id}
              className={`lesson-link ${l.id === current ? "active" : ""}`}
              onClick={() => onChange(l.id)}
            >
              <span className="lesson-index">0{i + 1}</span>
              <Icon size={22} />
              <div>
                <strong>{l.short}</strong>
                <small>{l.code}</small>
              </div>
            </button>
          );
        })}
      </div>
      <div className="sidebar-bottom">
        <h3>
          <HelpCircle size={16} /> 使用说明
        </h3>
        <ol>
          <li>选择题目，对照原理图。</li>
          <li>点击两个端子完成接线。</li>
          <li>切换二维 / 三维同步查看。</li>
          <li>检查后通电，验证动作。</li>
        </ol>
        <div className="local-note">
          <span className="status-dot" /> 无需登录 · 进度仅存本机
        </div>
        <p>在动手中理解电路</p>
      </div>
    </nav>
  );
}
function Practice({
  lesson,
  onLesson,
}: {
  lesson: Lesson;
  onLesson: (id: string) => void;
}) {
  const p = usePractice(lesson);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [selected, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [hint, setHint] = useState<string[]>([]);
  const [color, setColor] = useState(COLORS[0].value);
  const [gauge, setGauge] = useState("2.5");
  const [tool, setTool] = useState<"wire" | "erase" | "pan">("wire");
  const [zoom, setZoom] = useState(1);
  const [resetCamera, setResetCamera] = useState(0);
  const [exam, setExam] = useState(false),
    [checked, setChecked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<"pdf" | "demo" | "clear" | "help" | null>(
    null,
  );
  const upload = useRef<HTMLInputElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const report = useMemo(() => inspect(lesson, p.wires), [lesson, p.wires]);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,select,textarea")) return;
      if (e.key === "Escape") {
        setSelected(null);
        setPoints([]);
        setHint([]);
        setModal(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? p.redoAction() : p.undoAction();
        setChecked(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [p.undoAction, p.redoAction]);
  function change(w: Wire[]) {
    p.change(w);
    setChecked(false);
    setSelected(null);
    setPoints([]);
    setHint([]);
  }
  function terminal(id: string) {
    if (tool === "pan") return;
    if (p.powered) {
      setToast("请先断开虚拟电源，再修改接线。");
      return;
    }
    if (tool === "erase") {
      setToast("点击导线删除，也可以展开右侧导线列表。");
      return;
    }
    setHint([]);
    if (!selected) {
      setSelected(id);
      setPoints([]);
      return;
    }
    if (selected === id) {
      setSelected(null);
      setPoints([]);
      return;
    }
    if (
      p.wires.some(
        (w) =>
          (w.from === selected && w.to === id) ||
          (w.to === selected && w.from === id),
      )
    ) {
      setToast("这两个端子已经连接。");
      return;
    }
    change([
      ...p.wires,
      {
        id: crypto.randomUUID(),
        from: selected,
        to: id,
        color,
        gauge,
        points: points.length ? points : undefined,
      },
    ]);
  }
  function power() {
    setSelected(null);
    setPoints([]);
    setHint([]);
    if (!p.power()) {
      setChecked(true);
      setToast("接线尚未通过检查，请先处理右侧列出的连接问题。");
    } else
      setToast(
        p.powered ? "虚拟电源已断开。" : "虚拟电源已接通，总开关已合闸。",
      );
  }
  function exportProgress() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, lesson: lesson.id, wires: p.wires },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `接线工坊-${lesson.code}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("练习文件已导出。");
  }
  async function importProgress(file?: File) {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw Error("too large");
      const value = JSON.parse(await file.text());
      if (
        value.version !== 1 ||
        value.lesson !== lesson.id ||
        !validateWires(value.wires, lesson)
      )
        throw Error("invalid");
      change(value.wires);
      setToast("练习已导入，可撤销此操作。");
    } catch {
      setToast("导入失败：请选择当前题目的有效练习 JSON 文件（小于 1 MB）。");
    }
    if (upload.current) upload.current.value = "";
  }
  const board = {
    lesson,
    wires: p.wires,
    selected,
    hint,
    controls: p.controls,
    simulation: p.simulation,
    powered: p.powered,
    tool,
    onTerminal: terminal,
    onRemove: (id: string) => change(p.wires.filter((w) => w.id !== id)),
    onControl: p.control,
    draftPoints: points,
    onPoint: (point: [number, number]) => setPoints((s) => [...s, point]),
    zoom,
  };
  return (
    <>
      <header className="app-header">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <div className="brand-mark">
            <CircuitBoard size={28} />
          </div>
          <div>
            <strong>接线工坊</strong>
            <small>电工实操练习</small>
          </div>
        </a>
        <div className="header-center">认识电路，从连接开始。</div>
        <div className="header-actions">
          <span className="save-state">
            <Save size={15} />
            {p.saveStatus}
          </span>
          <button
            title="导出练习"
            aria-label="导出练习"
            onClick={exportProgress}
          >
            <Download size={18} />
          </button>
          <button
            title="导入当前题目练习"
            aria-label="导入练习"
            disabled={p.powered}
            onClick={() => upload.current?.click()}
          >
            <Upload size={18} />
          </button>
          <button
            title="帮助"
            aria-label="帮助"
            onClick={() => setModal("help")}
          >
            <HelpCircle size={19} />
          </button>
          <input
            hidden
            ref={upload}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void importProgress(e.target.files?.[0])}
          />
        </div>
      </header>
      <div className="app-layout">
        <Sidebar current={lesson.id} onChange={onLesson} />
        <main className="workspace" ref={workspace}>
          <div className="workspace-heading">
            <div>
              <div className="lesson-code">
                {lesson.code} <span>/ 接线练习</span>
              </div>
              <h1>{lesson.title}</h1>
              <p>{lesson.subtitle}</p>
            </div>
            <div className="heading-actions">
              <button onClick={() => setModal("pdf")}>
                <FileImage size={17} /> 原理图
              </button>
              <select
                aria-label="练习模式"
                value={exam ? "exam" : "practice"}
                onChange={(e) => {
                  setExam(e.target.value === "exam");
                  setChecked(false);
                  setHint([]);
                }}
              >
                <option value="practice">自由练习</option>
                <option value="exam">模拟考试</option>
              </select>
            </div>
          </div>
          <div className="toolbar">
            <div className="view-toggle" role="group" aria-label="视图切换">
              <button
                aria-pressed={view === "2d"}
                className={view === "2d" ? "active" : ""}
                onClick={() => {
                  setView("2d");
                  setSelected(null);
                  setPoints([]);
                }}
              >
                <Square size={15} />
                二维接线
              </button>
              <button
                aria-pressed={view === "3d"}
                className={view === "3d" ? "active" : ""}
                onClick={() => {
                  setView("3d");
                  setTool("wire");
                  setSelected(null);
                  setPoints([]);
                }}
              >
                <Box size={16} />
                三维实物
              </button>
            </div>
            <span className="toolbar-divider" />
            <div className="wire-colors">
              <span>导线</span>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  aria-label={c.name}
                  aria-pressed={color === c.value}
                  className={`color-dot ${color === c.value ? "active" : ""} ${c.name === "黄绿双色" ? "earth-color" : ""}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                >
                  {color === c.value && <Check size={13} />}
                </button>
              ))}
            </div>
            <select
              aria-label="导线截面积"
              className="gauge-select"
              value={gauge}
              onChange={(e) => setGauge(e.target.value)}
            >
              {["1.5", "2.5", "4"].map((g) => (
                <option key={g} value={g}>
                  {g} mm²
                </option>
              ))}
            </select>
            <div className="edit-tools">
              {view === "2d" && (
                <button
                  aria-label="平移工具"
                  title="平移画板"
                  className={tool === "pan" ? "selected-tool" : ""}
                  onClick={() => {
                    setTool("pan");
                    setSelected(null);
                    setPoints([]);
                  }}
                >
                  <Hand size={17} />
                </button>
              )}
              <button
                aria-label="接线工具"
                title="接线"
                className={tool === "wire" ? "selected-tool" : ""}
                onClick={() => setTool("wire")}
              >
                <MousePointer2 size={17} />
              </button>
              <button
                aria-label="拆线工具"
                title="点击导线拆除"
                disabled={p.powered}
                className={tool === "erase" ? "selected-tool" : ""}
                onClick={() => {
                  setTool("erase");
                  setSelected(null);
                  setPoints([]);
                }}
              >
                <Eraser size={17} />
              </button>
              <button
                aria-label="撤销"
                title="撤销 Ctrl+Z"
                disabled={!p.canUndo || p.powered}
                onClick={() => {
                  p.undoAction();
                  setChecked(false);
                }}
              >
                <Undo2 size={17} />
              </button>
              <button
                aria-label="重做"
                title="重做 Ctrl+Shift+Z"
                disabled={!p.canRedo || p.powered}
                onClick={() => {
                  p.redoAction();
                  setChecked(false);
                }}
              >
                <Redo2 size={17} />
              </button>
            </div>
          </div>
          <div
            className={`canvas-container ${tool === "erase" ? "erase-mode" : ""}`}
          >
            <div className="canvas-topline">
              <span>
                <i className={`status-dot ${p.powered ? "live" : ""}`} />
                {p.powered ? "虚拟通电中" : "断电接线"}
                <em>教学器件 · 端子编号以本练习为准</em>
              </span>
              <span>
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="board-area">
              {view === "2d" ? (
                <Board2D {...board} />
              ) : (
                <SceneBoundary>
                  <Suspense
                    fallback={
                      <div className="scene-error">
                        <Box size={28} />
                        <p>正在加载三维接线板…</p>
                      </div>
                    }
                  >
                    <Board3D {...board} reset={resetCamera} />
                  </Suspense>
                </SceneBoundary>
              )}
            </div>
            <div className="canvas-bottom">
              <span>
                {tool === "erase"
                  ? "拆线模式 · 点击导线删除"
                  : tool === "pan"
                    ? "拖动画板平移 · 点击百分比复位"
                    : selected
                      ? `已选择 ${selected} · 请点击另一端子`
                      : "点击端子连接 · Esc 取消当前操作"}
              </span>
              <div>
                {view === "2d" ? (
                  <>
                    <button
                      aria-label="缩小"
                      disabled={zoom <= 0.8}
                      onClick={() => setZoom((z) => Math.max(0.8, z - 0.15))}
                    >
                      <ZoomOut size={17} />
                    </button>
                    <button className="zoom-value" onClick={() => setZoom(1)}>
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      aria-label="放大"
                      disabled={zoom >= 3}
                      onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                    >
                      <ZoomIn size={17} />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setResetCamera((n) => n + 1)}>
                    <RotateCcw size={15} />
                    重置视角
                  </button>
                )}
                <button
                  aria-label="画板全屏"
                  onClick={() => {
                    if (document.fullscreenElement)
                      void document.exitFullscreen();
                    else
                      void workspace.current
                        ?.requestFullscreen()
                        .catch(() => setToast("浏览器暂不支持全屏。"));
                  }}
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="workspace-footer">
            <span>
              <PlugZap size={16} /> 已连接 <b>{p.wires.length}</b> 根导线{" "}
              <span className="footer-separator">|</span>{" "}
              {view === "2d" ? "二维" : "三维"}与另一视图实时同步
            </span>
            <div>
              <button
                disabled={exam || p.powered}
                onClick={() => setModal("demo")}
              >
                查看示范接线
              </button>
              <button
                disabled={p.powered || !p.wires.length}
                onClick={() => setModal("clear")}
              >
                <Trash2 size={14} /> 清空
              </button>
            </div>
          </div>
        </main>
        <AssistantPanel
          {...board}
          report={report}
          checked={checked}
          exam={exam}
          onCheck={() => {
            setChecked(true);
            setToast(
              report.complete
                ? "接线检查通过，可以模拟通电。"
                : "检查完成，请查看接线助手。",
            );
          }}
          onPower={power}
          onHint={() => setHint(report.missing[0] || [])}
          onLocate={setHint}
        />
      </div>
      {toast && (
        <div role="status" className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div
            className={`modal ${modal === "pdf" ? "pdf-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2 id="modal-title">
                {modal === "pdf"
                  ? `${lesson.code} · 原理图`
                  : modal === "demo"
                    ? "载入示范接线"
                    : modal === "clear"
                      ? "清空当前接线"
                      : "欢迎来到接线工坊"}
              </h2>
              <button
                autoFocus
                aria-label="关闭弹窗"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            {modal === "pdf" ? (
              <>
                <p>{lesson.description}</p>
                <img
                  className="schematic"
                  src={`${import.meta.env.BASE_URL}schematics/${lesson.id}.png`}
                  alt={`${lesson.title}原始电气原理图`}
                />
                <a
                  href={`${import.meta.env.BASE_URL}${encodeURIComponent(lesson.pdf)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开原始 PDF ↗
                </a>
              </>
            ) : modal === "help" ? (
              <>
                <p>用二维练习接线，用三维认识元件。两种视图共用接线数据。</p>
                <ol>
                  <li>
                    点击端子，再点击另一端子连接。二维空白处可设置走线拐点。放大后可选平移工具拖动画板。
                  </li>
                  <li>拆线工具可删除导线；右侧导线列表支持定位和删除。</li>
                  <li>检查通过后可模拟通电。按钮按住有效，开关点击切换。</li>
                  <li>Ctrl+Z 撤销，Ctrl+Shift+Z 重做，Esc 取消。</li>
                  <li>
                    自动保存于本浏览器；可导出 JSON 备份或在其他电脑导入。
                  </li>
                </ol>
                <p className="small muted">
                  模型为教学近似结构。当前检查电气连接与功能，不模拟真实高压、接线工艺质量、精确电流和保护动作时间。模拟考试没有官方评分效力。
                </p>
              </>
            ) : (
              <>
                <p>
                  {modal === "demo"
                    ? "将用一份正确接线替换当前画板，方便观察、拆解与通电。你可以通过撤销恢复原来的接线。"
                    : "将移除本题的全部练习导线，元件和其他题目进度不受影响。可以撤销。"}
                </p>
                <div className="modal-actions">
                  <button onClick={() => setModal(null)}>取消</button>
                  <button
                    className="primary"
                    onClick={() => {
                      change(modal === "demo" ? sampleWires(lesson) : []);
                      setModal(null);
                      setToast(
                        modal === "demo"
                          ? "已载入示范接线，试试检查与通电。"
                          : "当前接线已清空。",
                      );
                    }}
                  >
                    {modal === "demo" ? "载入示范" : "确认清空"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
export default function App() {
  const [id, setId] = useState("motor");
  const lesson = lessons.find((l) => l.id === id)!;
  return <Practice key={id} lesson={lesson} onLesson={setId} />;
}
