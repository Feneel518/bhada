"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

export type LineChartPoint = {
  label: string;
  value: number;
  description?: string;
};

type LineChartProps = {
  data: LineChartPoint[];
  className?: string;
  markerIndex?: number;
};

const width = 720;
const height = 240;
const padding = { top: 24, right: 18, bottom: 38, left: 18 };

export function LineChart({ data, className, markerIndex }: LineChartProps) {
  const id = useId().replace(/:/g, "");
  const frameRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = data.map((point) => point.value);
    const minimum = Math.min(...values) * 0.88;
    const maximum = Math.max(...values) * 1.06;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const points = data.map((point, index) => ({
      ...point,
      x: padding.left + (index / Math.max(data.length - 1, 1)) * innerWidth,
      y: padding.top + (1 - (point.value - minimum) / Math.max(maximum - minimum, 1)) * innerHeight,
    }));
    return { points, path: smoothPath(points), baseline: height - padding.bottom };
  }, [data]);

  const activePoint = activeIndex === null ? null : geometry.points[activeIndex];

  function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const pointerX = ((event.clientX - bounds.left) / bounds.width) * width;
    const closest = geometry.points.reduce(
      (result, point, index) => {
        const distance = Math.abs(point.x - pointerX);
        return distance < result.distance ? { index, distance } : result;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );
    setActiveIndex(closest.index);
  }

  return (
    <div
      ref={frameRef}
      className={cn("relative mt-5 aspect-[3/1] min-h-[210px] w-full min-w-0 overflow-hidden select-none", className)}
      onPointerMove={handlePointer}
      onPointerLeave={() => setActiveIndex(null)}
      role="img"
      aria-label="Monthly rent income line chart"
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-hidden">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line-primary)" stopOpacity=".24" />
            <stop offset="82%" stopColor="var(--chart-line-primary)" stopOpacity=".015" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7777e8" />
            <stop offset="100%" stopColor="var(--chart-line-primary)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((row) => {
          const y = padding.top + row * ((height - padding.top - padding.bottom) / 3);
          return <line key={row} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--chart-grid)" strokeDasharray="5 6" />;
        })}

        <path d={`${geometry.path} L ${geometry.points.at(-1)?.x ?? 0} ${geometry.baseline} L ${geometry.points[0]?.x ?? 0} ${geometry.baseline} Z`} fill={`url(#${id}-fill)`} />
        <path d={geometry.path} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />

        {markerIndex !== undefined && geometry.points[markerIndex] && (
          <>
            <line
              x1={geometry.points[markerIndex].x}
              x2={geometry.points[markerIndex].x}
              y1={padding.top}
              y2={geometry.baseline}
              stroke="#aaaaf0"
              strokeDasharray="3 6"
              opacity=".65"
            />
            <circle cx={geometry.points[markerIndex].x} cy={geometry.points[markerIndex].y} r="5.5" fill="white" stroke="var(--chart-line-primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {activePoint && (
          <>
            <line x1={activePoint.x} x2={activePoint.x} y1={padding.top} y2={geometry.baseline} stroke="var(--chart-crosshair)" strokeWidth="1" opacity=".48" />
            <circle cx={activePoint.x} cy={activePoint.y} r="6" fill="white" stroke="var(--chart-line-primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {geometry.points.map((point, index) => (
          <text
            key={point.label}
            x={point.x}
            y={height - 10}
            textAnchor="middle"
            className={cn("fill-[#9ba0ad] text-[10px] font-medium transition-opacity", data.length > 8 && index % 2 !== 0 && "hidden sm:block")}
          >
            {point.label}
          </text>
        ))}
      </svg>

      {activePoint && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 min-w-[128px] -translate-y-[calc(100%+14px)] rounded-xl border border-white/10 bg-[#292d3b]/95 px-3 py-2.5 text-white shadow-xl backdrop-blur-md",
            activeIndex === 0
              ? "translate-x-0"
              : activeIndex === geometry.points.length - 1
                ? "-translate-x-full"
                : "-translate-x-1/2",
          )}
          style={{ left: `${(activePoint.x / width) * 100}%`, top: `${(activePoint.y / height) * 100}%` }}
        >
          <p className="text-[10px] font-medium text-white/55">
            {activePoint.description ?? activePoint.label}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#8888f0]" />
            <span className="text-xs font-bold">{formatCurrency(activePoint.value)}</span>
          </div>
        </div>
      )}

      {markerIndex !== undefined && activeIndex === null && geometry.points[markerIndex] && (
        <span
          className={cn(
            "pointer-events-none absolute rounded-full bg-[#eeeeff] px-2 py-1 text-[9px] font-bold text-[#5656c9]",
            markerIndex === 0
              ? "translate-x-0"
              : markerIndex === geometry.points.length - 1
                ? "-translate-x-full"
                : "-translate-x-1/2",
          )}
          style={{ left: `${(geometry.points[markerIndex].x / width) * 100}%`, top: 0 }}
        >
          Rent increase
        </span>
      )}
    </div>
  );
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}
