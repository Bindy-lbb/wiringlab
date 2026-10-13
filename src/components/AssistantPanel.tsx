import {
  CheckCircle2,
  Lightbulb,
  MousePointer2,
  Play,
  Power,
  TriangleAlert,
  Unplug,
  X,
} from "lucide-react";
import type { Controls, Inspection, Lesson, Simulation, Wire } from "../types";
import { terminalInfo, terminalLabel } from "../data/lessons";
interface Props {
  lesson: Lesson;
  wires: Wire[];
  selected: string | null;
  report: Inspection;
  checked: boolean;
  exam: boolean;
  powered: boolean;
  controls: Controls;
  simulation: Simulation;
  onCheck: () => void;
  onPower: () => void;
  onHint: () => void;
  onRemove: (id: string) => void;
  onControl: (id: string, value?: boolean) => void;
  onLocate: (ids: string[]) => void;
}
export default function AssistantPanel(p: Props) {
  const selected = p.selected ? terminalInfo(p.lesson, p.selected) : null;
  const progress = Math.round(
    (p.report.connected / Math.max(p.report.required, 1)) * 100,
  );
  const push = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      p.onControl(id, true);
    },
    onPointerUp: () => p.onControl(id, false),
    onPointerCancel: () => p.onControl(id, false),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        p.onControl(id, true);
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") p.onControl(id, false);
    },
  });
  return (
    <aside className="assistant-panel">
      <div className="assistant-scroll">
        <h2>
          接线助手{" "}
          <span className="tiny-tag">{p.exam ? "考试" : "练习"}模式</span>
        </h2>
        {p.powered ? (
          <div className="tip-box live">
            <Power size={22} />
            <div>
              <strong>虚拟电源已接通</strong>
              <p>操作开关和按钮，观察电路响应。修改接线前请先断电。</p>
            </div>
          </div>
        ) : (
          <div className="tip-box">
            <MousePointer2 size={23} />
            <div>
              <strong>
                {selected ? "选择另一端，完成连接" : "点击端子，开始接线"}
              </strong>
              <p>
                {selected
                  ? "二维画板空白处可添加走线拐点，Esc 取消。"
                  : "先点起始端子，再点目标端子，即可连接一根导线。"}
              </p>
            </div>
          </div>
        )}
        <section>
          <h3>当前选中</h3>
          <div className="selection-box">
            <strong>
              {selected
                ? `${selected.device.name} ${selected.device.id}`
                : "未选择端子"}
            </strong>
            <span>
              {selected
                ? `端子 ${selected.terminal.label}`
                : "点击画板上的圆形接线端子"}
            </span>
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h3>接线进度</h3>
            <span>
              {p.exam && !p.checked
                ? `${p.wires.length} 根导线`
                : `${p.report.connected} / ${p.report.required}`}
            </span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${p.exam && !p.checked ? 0 : progress}%` }} />
          </div>
          <p className="small muted">
            {p.exam && !p.checked
              ? "提交检查后显示结果"
              : `${progress}% 电气连接完成 · 允许等效接法`}
          </p>
        </section>
        {p.powered && (
          <section className="simulation-panel">
            <h3>运行观察</h3>
            {p.lesson.id === "motor" ? (
              <>
                <div
                  className={`running-state ${p.simulation.motor ? "running" : ""}`}
                >
                  <span className="status-dot" />
                  {p.simulation.motor ? "电机运行中" : "电机已停止"}
                  <small>KM {p.simulation.relay ? "吸合" : "释放"}</small>
                </div>
                <div className="sim-buttons">
                  <button className="start-button" {...push("SB2")}>
                    启动 SB2
                  </button>
                  <button {...push("SB1")}>点动 SB1</button>
                  <button className="stop-button" {...push("SB3")}>
                    停止 SB3
                  </button>
                </div>
                <button
                  className={p.controls.overload ? "danger-text" : ""}
                  onClick={() => p.onControl("overload")}
                >
                  {p.controls.overload ? "复位热继电器" : "模拟过载保护"}
                </button>
                <p className="small muted">
                  点动需按住；启动松开后应保持运行。
                </p>
              </>
            ) : p.lesson.id === "lighting" ? (
              <>
                <div className="load-status">
                  <span className={p.simulation.lamp ? "on" : ""}>
                    照明灯 {p.simulation.lamp ? "亮" : "灭"}
                  </span>
                  <span className={p.simulation.tube ? "on" : ""}>
                    日光灯 {p.simulation.tube ? "亮" : "灭"}
                  </span>
                  <span className={p.simulation.socket ? "on" : ""}>
                    插座 {p.simulation.socket ? "有电" : "无电"}
                  </span>
                </div>
                <div className="sim-buttons">
                  {["S1", "S2", "S3"].map((id) => (
                    <button key={id} onClick={() => p.onControl(id)}>
                      {id} {p.controls[id] ? "位置2" : "位置1"}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="load-status">
                {["QF2", "QF3", "QF4", "QF5"].map((id) => (
                  <span
                    key={id}
                    className={p.simulation.branches.includes(id) ? "on" : ""}
                  >
                    {id} {p.simulation.branches.includes(id) ? "有电" : "无电"}
                  </span>
                ))}
              </div>
            )}
            <div className="breaker-controls">
              {p.lesson.devices
                .filter((d) => d.kind === "breaker")
                .map((d) => (
                  <button
                    key={d.id}
                    className={p.controls[d.id] ? "is-on" : ""}
                    onClick={() => p.onControl(d.id)}
                  >
                    {d.id} {p.controls[d.id] ? "合闸" : "分闸"}
                  </button>
                ))}
            </div>
          </section>
        )}
        {p.checked && (
          <section className="check-results" aria-live="polite">
            <h3>检查结果</h3>
            {p.report.complete ? (
              <div className="result-success">
                <CheckCircle2 size={20} />
                <div>
                  <strong>电气连接正确</strong>
                  <p>可通电验证功能。线色、线径和接线工艺暂不计分。</p>
                </div>
              </div>
            ) : (
              <>
                <div className="result-warning">
                  <TriangleAlert size={18} />
                  <strong>
                    {p.report.errors.length} 处错接，{p.report.missing.length}{" "}
                    处连接待完成
                  </strong>
                </div>
                {p.report.errors.map((e, i) => (
                  <button
                    key={i}
                    className="issue"
                    onClick={() => {
                      const w = p.wires.find((w) => w.id === e.wireId);
                      if (w) p.onLocate([w.from, w.to]);
                    }}
                  >
                    {e.message}
                  </button>
                ))}
                {p.report.missing.slice(0, 5).map(([a, b]) => (
                  <button
                    key={`${a}${b}`}
                    className="issue missing"
                    onClick={() => p.onLocate([a, b])}
                  >
                    待连接：{terminalLabel(p.lesson, a)} →{" "}
                    {terminalLabel(p.lesson, b)}
                  </button>
                ))}
                {p.report.missing.length > 5 && (
                  <p className="small muted">
                    另有 {p.report.missing.length - 5} 处连接，完成后再次检查。
                  </p>
                )}
              </>
            )}
          </section>
        )}
        {!p.exam && !p.powered && (
          <section>
            <h3>下一步提示</h3>
            <button className="hint-box" onClick={p.onHint}>
              <Lightbulb size={21} />
              <span>
                {p.report.missing[0] ? (
                  <>
                    连接{" "}
                    <b>{terminalLabel(p.lesson, p.report.missing[0][0])}</b> 与{" "}
                    <b>{terminalLabel(p.lesson, p.report.missing[0][1])}</b>
                    <small>点击高亮两个端子</small>
                  </>
                ) : (
                  <>连接已完成，点击检查接线。</>
                )}
              </span>
            </button>
          </section>
        )}
        <details className="wire-list">
          <summary>
            已连接导线 <span>{p.wires.length}</span>
          </summary>
          {p.wires.length === 0 ? (
            <p className="small muted">完成第一根接线后，将显示在这里。</p>
          ) : (
            p.wires.map((w) => (
              <div key={w.id}>
                <i style={{ background: w.color }} />
                <button
                  className="wire-label"
                  onClick={() => p.onLocate([w.from, w.to])}
                >
                  {w.from} → {w.to}
                  <small>{w.gauge} mm²</small>
                </button>
                <button
                  aria-label={`删除 ${w.from} 到 ${w.to}`}
                  disabled={p.powered}
                  onClick={() => p.onRemove(w.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </details>
      </div>
      <div className="assistant-actions">
        <button className="primary" onClick={p.onCheck}>
          <CheckCircle2 size={19} />
          {p.exam ? "提交检查" : "检查接线"}
        </button>
        <button
          className={p.powered ? "power-active" : "outline"}
          onClick={p.onPower}
        >
          {p.powered ? <Unplug size={18} /> : <Play size={18} />}{" "}
          {p.powered ? "断开虚拟电源" : "模拟通电"}
        </button>
      </div>
    </aside>
  );
}
