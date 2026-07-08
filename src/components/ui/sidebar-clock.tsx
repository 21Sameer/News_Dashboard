'use client';

import { useEffect, useRef, useState } from 'react';

const ROMANS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const CENTER = 50;
const NUMERAL_RADIUS = 37;
const TICK_OUTER = 46;
const ARC_RADIUS = 47;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

function polar(radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: roundCoord(CENTER + radius * Math.cos(rad)),
    y: roundCoord(CENTER + radius * Math.sin(rad)),
  };
}

// Precomputed once so SSR and client always share identical geometry.
const MINOR_TICKS = Array.from({ length: 60 })
  .map((_, i) => {
    if (i % 5 === 0) return null;
    const outer = polar(TICK_OUTER, i * 6);
    const inner = polar(TICK_OUTER - 2.5, i * 6);
    return { key: i, outer, inner };
  })
  .filter(Boolean) as { key: number; outer: { x: number; y: number }; inner: { x: number; y: number } }[];

const NUMERAL_POSITIONS = ROMANS.map((label, i) => ({
  label,
  pos: polar(NUMERAL_RADIUS, i * 30),
  major: i % 3 === 0,
}));

function ClockFace({
  hourAngle,
  minuteAngle,
  secondAngle,
  arcOffset,
  pulse,
  secondTip,
  timeLabel,
}: {
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
  arcOffset: number;
  pulse: number;
  secondTip: { x: number; y: number };
  timeLabel: string;
}) {
  return (
    <svg
      className="sidebar-clock"
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      role="img"
      aria-label={timeLabel ? `Current time ${timeLabel}` : 'Clock'}
    >
      <defs>
        <radialGradient id="clkFaceGrad" cx="50%" cy="42%" r="62%">
          <stop offset="0%" className="clk-face-stop-1" />
          <stop offset="100%" className="clk-face-stop-2" />
        </radialGradient>
      </defs>

      <circle className="clk-face" cx={CENTER} cy={CENTER} r="48" fill="url(#clkFaceGrad)" />

      <circle className="clk-arc-track" cx={CENTER} cy={CENTER} r={ARC_RADIUS} />
      <circle
        className="clk-arc-fill"
        cx={CENTER}
        cy={CENTER}
        r={ARC_RADIUS}
        strokeDasharray={roundCoord(ARC_CIRCUMFERENCE)}
        strokeDashoffset={roundCoord(arcOffset)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />

      {MINOR_TICKS.map(({ key, outer, inner }) => (
        <line
          key={`t-${key}`}
          className="clk-tick-minor"
          x1={outer.x}
          y1={outer.y}
          x2={inner.x}
          y2={inner.y}
        />
      ))}

      {NUMERAL_POSITIONS.map(({ label, pos, major }) => (
        <text
          key={label}
          className={`clk-numeral${major ? ' is-major' : ''}`}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      ))}

      <line
        className="clk-hand clk-hour"
        x1={CENTER}
        y1={CENTER + 8}
        x2={CENTER}
        y2={CENTER - 20}
        transform={`rotate(${roundCoord(hourAngle)} ${CENTER} ${CENTER})`}
      />
      <line
        className="clk-hand clk-minute"
        x1={CENTER}
        y1={CENTER + 10}
        x2={CENTER}
        y2={CENTER - 30}
        transform={`rotate(${roundCoord(minuteAngle)} ${CENTER} ${CENTER})`}
      />
      <line
        className="clk-hand clk-second"
        x1={CENTER}
        y1={CENTER + 13}
        x2={CENTER}
        y2={CENTER - 35}
        transform={`rotate(${roundCoord(secondAngle)} ${CENTER} ${CENTER})`}
      />
      <circle
        className="clk-second-tip"
        cx={secondTip.x}
        cy={secondTip.y}
        r="2.1"
        style={{ opacity: pulse }}
      />
      <circle
        className="clk-heartbeat"
        cx={CENTER}
        cy={16}
        r={roundCoord(1.6 + pulse * 1.4)}
        style={{ opacity: 0.35 + pulse * 0.65 }}
      />

      <circle className="clk-cap" cx={CENTER} cy={CENTER} r="3" />
      <circle className="clk-cap-dot" cx={CENTER} cy={CENTER} r="1.2" />
    </svg>
  );
}

export function SidebarClock() {
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState<{ h: number; m: number; s: number; ms: number } | null>(null);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    setReady(true);
    const tick = () => {
      const d = new Date();
      setTime({
        h: d.getHours(),
        m: d.getMinutes(),
        s: d.getSeconds(),
        ms: d.getMilliseconds(),
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Static placeholder — identical on server and first client paint (no hydration mismatch).
  if (!ready || !time) {
    return (
      <ClockFace
        hourAngle={300}
        minuteAngle={60}
        secondAngle={0}
        arcOffset={ARC_CIRCUMFERENCE}
        pulse={0.35}
        secondTip={polar(35, 0)}
        timeLabel=""
      />
    );
  }

  const fractionalSeconds = time.s + time.ms / 1000;
  const secondAngle = fractionalSeconds * 6;
  const minuteAngle = time.m * 6 + fractionalSeconds * 0.1;
  const hourAngle = (time.h % 12) * 30 + time.m * 0.5;
  const arcProgress = fractionalSeconds / 60;
  const arcOffset = ARC_CIRCUMFERENCE * (1 - arcProgress);
  const pulse = 0.35 + 0.65 * Math.abs(Math.cos((time.ms / 1000) * Math.PI));
  const secondTip = polar(35, secondAngle);
  const timeLabel = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <ClockFace
      hourAngle={hourAngle}
      minuteAngle={minuteAngle}
      secondAngle={secondAngle}
      arcOffset={arcOffset}
      pulse={pulse}
      secondTip={secondTip}
      timeLabel={timeLabel}
    />
  );
}
