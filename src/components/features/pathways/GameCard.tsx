"use client";

import type { CSSProperties } from "react";

import { MILESTONES, TRACKERS } from "@/lib/pathways/app-store";
import type { ModuleProgress } from "@/lib/pathways/assessment";
import { plural } from "@/lib/pathways/framework";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/pathways";

// Gamified progress: a koala climbing a tree, or a mascot on a race track. Always a light card
// with black line art, so it follows the brand on any band.

const INK = {
  stroke: "#141414",
  strokeWidth: 2,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;
const FONT = "var(--font-dm-sans), Arial, sans-serif";

type Vars = CSSProperties & Record<`--${string}`, string>;

function Koala() {
  return (
    <g {...INK}>
      <ellipse cx="-15" cy="4" rx="7" ry="5" fill="#bdbdbd" />
      <ellipse cx="15" cy="4" rx="7" ry="5" fill="#bdbdbd" />
      <ellipse cx="0" cy="16" rx="15" ry="17" fill="#bdbdbd" />
      <ellipse cx="-12" cy="30" rx="7" ry="5" fill="#bdbdbd" />
      <ellipse cx="12" cy="30" rx="7" ry="5" fill="#bdbdbd" />
      <circle cx="-15" cy="-15" r="9" fill="#bdbdbd" />
      <circle cx="15" cy="-15" r="9" fill="#bdbdbd" />
      <circle cx="-15" cy="-15" r="4" fill="#ffcfca" stroke="none" />
      <circle cx="15" cy="-15" r="4" fill="#ffcfca" stroke="none" />
      <circle cx="0" cy="-5" r="15" fill="#d6d6d6" />
      <circle cx="-6" cy="-8" r="1.8" fill="#141414" stroke="none" />
      <circle cx="6" cy="-8" r="1.8" fill="#141414" stroke="none" />
      <ellipse cx="0" cy="-1" rx="4.5" ry="5.5" fill="#141414" />
      <path d="M-4 7 q4 3 8 0" fill="none" />
    </g>
  );
}

function Mascot() {
  return (
    <g {...INK}>
      <path d="M-8 16 l-10 12 M4 17 l12 10" fill="none" />
      <circle cx="0" cy="0" r="18" fill="#e7d2ff" />
      <path d="M-17 -6 q2 -18 19 -16 q14 2 14 14 z" fill="#ffffff" />
      <path d="M14 -7 q10 -2 16 3 q-6 3 -16 1" fill="#ffffff" />
      <ellipse cx="-3" cy="2" rx="2.4" ry="3.4" fill="#141414" stroke="none" />
      <ellipse cx="7" cy="1" rx="2.4" ry="3.4" fill="#141414" stroke="none" />
      <path d="M-1 10 q4 4 9 0" fill="none" />
    </g>
  );
}

function TreeSvg({ pct, from }: { pct: number; from: number }) {
  const yAt = (p: number) => 262 - (p / 100) * 190;
  const ky = pct >= 100 ? 58 : yAt(pct);
  const ky0 = from >= 100 ? 58 : yAt(from);
  return (
    <svg
      viewBox="0 0 360 300"
      className="gsvg"
      role="img"
      aria-label={`A koala ${pct >= 100 ? "at the top of the tree" : `${pct}% of the way up the tree`}`}
    >
      <path d="M20 286 H340" {...INK} fill="none" />
      <path d="M60 286 l4 -9 l4 9 M290 286 l4 -10 l4 10 M250 286 l3 -7 l3 7" fill="none" {...INK} />
      <path
        d="M162 286 C166 220 158 150 168 64 L194 64 C202 150 194 220 200 286 Z"
        fill="#ffffff"
        {...INK}
      />
      <path
        d="M176 250 q4 -6 0 -12 M186 190 q-4 -6 0 -12 M178 130 q4 -6 0 -12"
        fill="none"
        {...INK}
        strokeWidth={1.5}
      />
      {MILESTONES.slice(0, 3).map((p, i) => {
        const y = yAt(p) + 10;
        const left = i % 2 === 0;
        const x = left ? 163 : 197;
        const dx = left ? -62 : 62;
        const got = pct >= p;
        return (
          <g key={p}>
            <path d={`M${x} ${y} q${dx / 2} -6 ${dx} -18`} fill="none" {...INK} strokeWidth={3} />
            <ellipse
              cx={x + dx}
              cy={y - 22}
              rx="14"
              ry="9"
              fill="#cafce5"
              {...INK}
              transform={`rotate(${left ? -25 : 25} ${x + dx} ${y - 22})`}
            />
            <circle
              cx={x + dx * 0.55}
              cy={y + 6}
              r="13"
              fill={got ? "#cafce5" : "#ffffff"}
              {...INK}
            />
            <text
              x={x + dx * 0.55}
              y={y + 10.5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fontFamily={FONT}
              fill="#141414"
            >
              {got ? "✓" : `${p}%`}
            </text>
          </g>
        );
      })}
      <g {...INK} fill="#cafce5" strokeWidth={4}>
        <circle cx="140" cy="62" r="32" />
        <circle cx="222" cy="64" r="30" />
        <circle cx="182" cy="40" r="36" />
        <circle cx="180" cy="78" r="26" />
      </g>
      <g fill="#cafce5">
        <circle cx="140" cy="62" r="31" />
        <circle cx="222" cy="64" r="29" />
        <circle cx="182" cy="40" r="35" />
        <circle cx="180" cy="78" r="25" />
      </g>
      <path
        d="M150 52 q6 -6 12 0 M204 58 q6 -6 12 0 M176 30 q6 -6 12 0"
        fill="none"
        {...INK}
        strokeWidth={1.5}
      />
      <circle cx="182" cy="16" r="11" fill={pct >= 100 ? "#ffcfca" : "#ffffff"} {...INK} />
      <text
        x="182"
        y="20"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fontFamily={FONT}
        fill="#141414"
      >
        {pct >= 100 ? "★" : "100"}
      </text>
      <g transform={`translate(181 ${ky})`}>
        <g className="mover" style={{ "--dy": `${ky0 - ky}px` } as Vars}>
          <Koala />
        </g>
      </g>
    </svg>
  );
}

function TrackSvg({ pct, from }: { pct: number; from: number }) {
  const xAt = (p: number) => 56 + (p / 100) * 520;
  const x = xAt(pct);
  const x0 = xAt(from);
  const chequers = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      chequers.push(
        <rect
          key={`${r}-${c}`}
          x={590 + c * 7}
          y={62 + r * 14}
          width="7"
          height="14"
          fill={(r + c) % 2 ? "#141414" : "#ffffff"}
        />,
      );
    }
  }
  return (
    <svg
      viewBox="0 0 640 140"
      className="gsvg"
      role="img"
      aria-label={pct >= 100 ? "Across the finish line" : `${pct}% of the way round the track`}
    >
      <rect x="16" y="58" width="608" height="64" rx="32" fill="#c8e9ff" {...INK} />
      <path d="M48 90 H600" stroke="#ffffff" strokeWidth={3} strokeDasharray="12 10" />
      <path d="M56 62 V118" stroke="#ffffff" strokeWidth={4} />
      {chequers}
      <rect x="590" y="62" width="14" height="56" fill="none" {...INK} />
      {MILESTONES.slice(0, 3).map((p) => {
        const fx = xAt(p);
        const got = pct >= p;
        return (
          <g key={p}>
            <path d={`M${fx} 58 V26`} {...INK} fill="none" />
            <path d={`M${fx} 26 l18 6 l-18 6 z`} fill={got ? "#cafce5" : "#ffcfca"} {...INK} />
            <text
              x={fx}
              y="18"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fontFamily={FONT}
              fill="#141414"
            >
              {got ? "✓ " : ""}
              {p}%
            </text>
          </g>
        );
      })}
      <path d="M597 58 V20" {...INK} fill="none" />
      <path d="M597 20 l20 7 l-20 7 z" fill={pct >= 100 ? "#cafce5" : "#ffffff"} {...INK} />
      <g transform={`translate(${x} 88) scale(1.25)`}>
        <g className="mover" style={{ "--dx": `${x0 - x}px` } as Vars}>
          {pct > 0 && pct < 100 && (
            <path d="M-30 -6 h-14 M-28 4 h-18 M-30 14 h-12" {...INK} fill="none" />
          )}
          <Mascot />
        </g>
      </g>
    </svg>
  );
}

interface GameCardProps {
  progress: ModuleProgress;
  tracker: Profile["tracker"];
  /** Animate the climb from zero, e.g. the first time the pathway is shown. */
  animate?: boolean;
  onTrackerChange?: (tracker: Profile["tracker"]) => void;
}

export function GameCard({ progress, tracker, animate = false, onTrackerChange }: GameCardProps) {
  const G = TRACKERS[tracker];
  const { pct } = progress;
  const reached = MILESTONES.filter((m) => pct >= m).length;
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const from = animate && !reduceMotion ? 0 : pct;
  const next = MILESTONES.find((m) => pct < m);
  const need = next ? Math.max(1, Math.ceil((next * progress.total) / 100) - progress.pts) : 0;
  return (
    <div className={cn("game", tracker, animate && "animate")}>
      <div className="gart">
        {tracker === "track" ? (
          <TrackSvg pct={pct} from={from} />
        ) : (
          <TreeSvg pct={pct} from={from} />
        )}
      </div>
      <div className="gstats">
        <div className="gpct">{pct}%</div>
        <div className="gmore">
          <p className="gnow">{reached ? G.names[reached - 1] : G.start}</p>
          <p className="small">
            {next
              ? `${need} more ${plural(need, "step")} to reach ${G.names[MILESTONES.indexOf(next)]} at ${next}%.`
              : "Every module complete. Brilliant work."}
          </p>
          <div className="badges" role="list" aria-label="Milestone badges">
            {MILESTONES.map((m, i) => (
              <span
                key={m}
                role="listitem"
                className={cn("badge", pct >= m && "got")}
                title={G.names[i]}
              >
                {pct >= m ? "★" : `${m}%`}
                <small>{G.names[i]}</small>
              </span>
            ))}
          </div>
          <p className="small" style={{ marginTop: 12 }}>
            {progress.pts} of {progress.total} steps done. A step is reading a module, passing its
            quiz or logging evidence at your level.
          </p>
          {onTrackerChange && (
            <div className="gswitch" role="group" aria-label="Choose your tracker">
              {(Object.keys(TRACKERS) as Profile["tracker"][]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className="choice"
                  aria-pressed={k === tracker}
                  onClick={() => onTrackerChange(k)}
                >
                  {TRACKERS[k].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
