import type { Device } from "../types";
export function DeviceFace({
  d,
  active = false,
  on = false,
}: {
  d: Device;
  active?: boolean;
  on?: boolean;
}) {
  const { w, h, kind } = d;
  const screw = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <circle cx={x} cy={y} r={4} fill="#b9bec0" stroke="#737d7e" />
      <path d={`M${x - 2.5} ${y}h5`} stroke="#697071" />
    </g>
  );
  return (
    <g className={`device-face ${active ? "device-live" : ""}`}>
      <rect x={2} y={5} width={w} height={h} rx={5} fill="#182e3920" />
      <rect
        width={w}
        height={h}
        rx={5}
        fill={
          ["contactor", "supply", "bus"].includes(kind)
            ? "url(#darkCase)"
            : "url(#case)"
        }
        stroke="#8d9b9e"
      />
      {kind === "breaker" && (
        <>
          {Array.from({ length: d.terminals.length / 2 }, (_, i) => (
            <g key={i}>
              <path
                d={`M${(i * w) / (d.terminals.length / 2)} 5v${h - 10}`}
                stroke="#aeb6b7"
              />
              <rect
                x={(i * w) / (d.terminals.length / 2) + 5}
                y={h * 0.4}
                width={w / (d.terminals.length / 2) - 10}
                height={h * 0.3}
                rx={2}
                fill="#354d62"
              />
            </g>
          ))}
          <rect
            x={8}
            y={on ? h * 0.39 : h * 0.53}
            width={w - 16}
            height={16}
            rx={3}
            fill="url(#blueSwitch)"
          />
          <text x={w / 2} y={h * 0.25} className="face-micro">
            {d.id === "QF1" ? "MAIN" : "CIRCUIT"}
          </text>
          <text x={w / 2} y={h - 12} className="face-micro">
            {on ? "I · ON" : "O · OFF"}
          </text>
        </>
      )}
      {kind === "fuse" &&
        d.terminals
          .filter((t) => t.y === 0)
          .map((t, i) => (
            <g key={t.id}>
              <rect
                x={t.x - 11}
                y={17}
                width={22}
                height={h - 34}
                rx={3}
                fill="#78858a"
              />
              <rect
                x={t.x - 6}
                y={23}
                width={12}
                height={h - 46}
                fill="#d4d8cc"
              />
              <rect x={t.x - 8} y={23} width={16} height={9} fill="#a4aaa7" />
              <text x={t.x} y={h / 2 + 4} className="face-micro">
                {i + 1}
              </text>
            </g>
          ))}
      {kind === "contactor" && (
        <>
          <rect x={8} y={18} width={w - 16} height={23} rx={2} fill="#e4e8e6" />
          <text x={w / 2} y={33} className="face-small">
            AC CONTACTOR
          </text>
          <rect
            x={14}
            y={53}
            width={w - 28}
            height={40}
            rx={3}
            fill="#152b37"
          />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={25 + i * 46}
              y={active ? 68 : 58}
              width={32}
              height={24}
              rx={2}
              fill={active ? "#23a18b" : "#3d719a"}
            />
          ))}
          <rect
            x={8}
            y={h - 29}
            width={w - 16}
            height={19}
            rx={2}
            fill="#e4e8e6"
          />
          <text x={w / 2} y={h - 15} className="face-small">
            KM · {active ? "吸合" : "释放"}
          </text>
        </>
      )}
      {kind === "thermal" && (
        <>
          <rect
            x={9}
            y={18}
            width={w - 18}
            height={h - 36}
            rx={3}
            fill="#c7cecb"
          />
          <circle
            cx={w * 0.31}
            cy={h * 0.46}
            r={22}
            fill="#6195b3"
            stroke="#34597b"
          />
          <path
            d={`M${w * 0.31} ${h * 0.46}l-9 -13`}
            stroke="#263b47"
            strokeWidth={3}
          />
          <rect
            x={w * 0.6}
            y={h * 0.4}
            width={22}
            height={16}
            rx={2}
            fill={on ? "#e56754" : "#d57456"}
          />
          <text x={w / 2} y={h - 27} className="face-small">
            {on ? "TRIPPED" : "THERMAL RELAY"}
          </text>
        </>
      )}
      {kind === "button" && (
        <>
          <circle
            cx={w / 2}
            cy={h / 2}
            r={26}
            fill="#aab5b4"
            stroke="#556263"
            strokeWidth={3}
          />
          <circle
            cx={w / 2}
            cy={h / 2 + (on ? 3 : 0)}
            r={21}
            fill={d.color}
            stroke="#ffffff70"
            strokeWidth={3}
          />
          {screw(10, 12)}
          {screw(w - 10, h - 12)}
        </>
      )}
      {kind === "motor" && (
        <>
          <rect
            x={28}
            y={10}
            width={w - 58}
            height={h - 17}
            rx={25}
            fill="url(#motorCase)"
          />
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={`M${45 + i * 10} 18v${h - 33}`}
              stroke="#69787d"
              strokeWidth={3}
            />
          ))}
          <rect x={10} y={h / 2 - 8} width={25} height={16} fill="#9ba7a9" />
          <rect
            x={w - 32}
            y={h / 2 - 7}
            width={30}
            height={14}
            fill="#879398"
          />
          <circle
            cx={w - 14}
            cy={h / 2}
            r={6}
            fill={active ? "#34ba91" : "#506069"}
          />
          <rect
            x={w / 2 - 48}
            y={8}
            width={96}
            height={28}
            rx={3}
            fill="#3c4c50"
          />
          <text x={w / 2} y={27} fill="white" fontSize={11} textAnchor="middle">
            M 3~
          </text>
          <path
            d={`M45 ${h - 6}h${w - 90}`}
            stroke="#677980"
            strokeWidth={10}
          />
        </>
      )}
      {kind === "meter" && (
        <>
          <rect
            x={12}
            y={12}
            width={w - 24}
            height={h - 30}
            rx={4}
            fill="#c4d6cf"
            stroke="#718e82"
          />
          <rect
            x={24}
            y={25}
            width={w - 48}
            height={30}
            rx={2}
            fill="#536a61"
          />
          <text
            x={w / 2}
            y={46}
            fill="#dbebca"
            fontFamily="monospace"
            fontSize={17}
            textAnchor="middle"
          >
            00012.8
          </text>
          <text x={w / 2} y={75} className="face-small">
            kWh · 单相电能表
          </text>
          <circle
            cx={w / 2}
            cy={h - 29}
            r={4}
            fill={active ? "#39b796" : "#65786c"}
          />
        </>
      )}
      {kind === "socket" && (
        <>
          <circle
            cx={w / 2}
            cy={h / 2}
            r={35}
            fill="#e6e9e5"
            stroke="#acb8b3"
          />
          <path
            d={`M${w / 2} ${h / 2 - 23}v15 M${w / 2 - 23} ${h / 2 + 6}l8 12 M${w / 2 + 23} ${h / 2 + 6}l-8 12`}
            stroke="#566264"
            strokeWidth={7}
          />
        </>
      )}
      {kind === "switch" && (
        <>
          <rect
            x={13}
            y={13}
            width={w - 26}
            height={h - 26}
            rx={3}
            fill={on ? "#ccd5d2" : "#edf0eb"}
            stroke="#a6b3af"
          />
          <path
            d={`M20 ${on ? h - 20 : 20}h${w - 40}`}
            stroke="#acb8b0"
            strokeWidth={3}
          />
          <circle
            cx={w / 2}
            cy={h / 2}
            r={3}
            fill={on ? "#087f73" : "#b6c3bc"}
          />
        </>
      )}
      {kind === "lamp" && (
        <>
          <circle
            cx={w / 2}
            cy={h / 2}
            r={30}
            fill={active ? "#fff3ad" : "#e1e4dd"}
            stroke="#b7c0b6"
          />
          <circle
            cx={w / 2}
            cy={h / 2}
            r={21}
            fill={active ? "#ffe791" : "#f9faf3"}
          />
          <path
            d={`M${w / 2 - 8} ${h / 2 - 8}l16 16m0 -16l-16 16`}
            stroke={active ? "#d6a544" : "#aab4ac"}
            strokeWidth={2}
          />
        </>
      )}
      {kind === "tube" && (
        <>
          {[35, w - 35].map((x) => (
            <g key={x}>
              <rect
                x={x - 9}
                y={13}
                width={18}
                height={h - 26}
                rx={8}
                fill={active ? "#fffbd7" : "#f6f8f2"}
                stroke="#aebbb6"
              />
              <rect x={x - 11} y={9} width={22} height={11} fill="#81928b" />
              <rect
                x={x - 11}
                y={h - 20}
                width={22}
                height={11}
                fill="#81928b"
              />
            </g>
          ))}
        </>
      )}
      {kind === "ballast" && (
        <>
          <rect
            x={10}
            y={14}
            width={w - 20}
            height={h - 28}
            fill="#eef2e4"
            stroke="#93a290"
          />
          <text x={w / 2} y={h / 2} className="face-small">
            电子镇流器
          </text>
          <text x={w / 2} y={h / 2 + 17} className="face-micro">
            L / N → T1…T4
          </text>
        </>
      )}
      {kind === "spd" && (
        <>
          <path d={`M${w / 2} 10v${h - 20}`} stroke="#adb6b2" />
          <text x={w / 2} y={h * 0.38} className="face-small">
            SPD
          </text>
          {[w * 0.25, w * 0.75].map((x) => (
            <rect
              key={x}
              x={x - 10}
              y={h * 0.55}
              width={20}
              height={13}
              rx={1}
              fill="#4b9c76"
            />
          ))}
          <text x={w / 2} y={h - 13} className="face-micro">
            电涌保护
          </text>
        </>
      )}
      {kind === "bus" && (
        <rect
          x={8}
          y={8}
          width={w - 16}
          height={h - 16}
          rx={2}
          fill={d.color || "#b8bfc0"}
          stroke="#d2cda2"
        />
      )}
      {kind === "supply" && (
        <>
          <path d={`M12 ${h / 2}h${w - 24}`} stroke="#3e5a5d" strokeWidth={8} />
          <text
            x={w / 2}
            y={h - 9}
            fill="#c6d5d2"
            fontSize={10}
            textAnchor="middle"
          >
            POWER TERMINALS
          </text>
        </>
      )}
    </g>
  );
}
