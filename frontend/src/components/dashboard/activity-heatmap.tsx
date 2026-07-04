"use client";

// components/dashboard/activity-heatmap.tsx
// Renders a GitHub-style contribution heatmap from the analytics heatmap
// endpoint, which returns { year, heatmap: {"YYYY-MM-DD": count, ...}, total }.

import { useMemo } from "react";
import { useHeatmap } from "@/hooks/use-habits";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const DAYS = ["Mon","","Wed","","Fri","","Sun"];

function countToOpacity(count: number): string {
  if (count === 0) return "bg-border-dark";
  if (count === 1) return "bg-forge/25";
  if (count === 2) return "bg-forge/50";
  if (count === 3) return "bg-forge/75";
  return "bg-forge";
}

function buildGrid(entries: Array<{ date: string; count: number }>, year: number) {
  // Build a full-year lookup
  const lookup: Record<string, number> = {};
  for (const e of entries) lookup[e.date] = e.count;

  // Start from Jan 1 of the year, padded to Monday
  const jan1 = new Date(year, 0, 1);
  const startOffset = (jan1.getDay() + 6) % 7; // 0=Mon

  const result: Array<{ date: string; count: number; isCurrentYear: boolean }[]> = [];
  let week: typeof result[0] = [];

  // Pad first week
  for (let i = 0; i < startOffset; i++) {
    week.push({ date: "", count: 0, isCurrentYear: false });
  }

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;

  for (let d = 0; d < daysInYear; d++) {
    const date = new Date(year, 0, d + 1);
    const dateStr = date.toISOString().slice(0, 10);
    week.push({ date: dateStr, count: lookup[dateStr] ?? 0, isCurrentYear: true });
    if (week.length === 7) {
      result.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: "", count: 0, isCurrentYear: false });
    result.push(week);
  }

  return result;
}

function getMonthLabels(year: number, weeks: number) {
  const labels: Array<{ month: string; col: number }> = [];
  const jan1 = new Date(year, 0, 1);
  const startOffset = (jan1.getDay() + 6) % 7;
  let day = 1 - startOffset;
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const d = new Date(year, 0, day);
    const m = d.getMonth();
    if (m !== lastMonth && d.getFullYear() === year) {
      labels.push({ month: MONTHS[m], col: w });
      lastMonth = m;
    }
    day += 7;
  }
  return labels;
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface HeatmapProps {
  year?: number;
}

export function ActivityHeatmap({ year = new Date().getFullYear() }: HeatmapProps) {
  const { data: raw, isLoading } = useHeatmap(year);

  // Backend returns { year, heatmap: {"2026-01-01": 3, ...}, total }
  const backend = raw as unknown as { year: number; heatmap: Record<string, number>; total: number } | null;
  const entries = useMemo(
    () =>
      backend?.heatmap
        ? Object.entries(backend.heatmap).map(([date, count]) => ({ date, count }))
        : [],
    [backend]
  );

  const grid = useMemo(() => buildGrid(entries, year), [entries, year]);
  const monthLabels = useMemo(() => getMonthLabels(year, grid.length), [year, grid.length]);

  const totalCompletions = backend?.total ?? 0;
  const activeDays = entries.filter((e) => e.count > 0).length;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 bg-border-dark" />
        <Skeleton className="h-[100px] w-full bg-border-dark rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-ngp-muted">
            <span className="font-mono font-bold text-ngp-text">{totalCompletions}</span>{" "}
            completions in {year}
          </span>
          <span className="text-xs text-ngp-muted/50">·</span>
          <span className="text-xs text-ngp-muted">
            <span className="font-mono font-bold text-forge">{activeDays}</span> active days
          </span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-ngp-muted mr-1">Less</span>
          {["bg-border-dark", "bg-forge/25", "bg-forge/50", "bg-forge/75", "bg-forge"].map(
            (cls, i) => (
              <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", cls)} />
            )
          )}
          <span className="text-[10px] text-ngp-muted ml-1">More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-7 relative h-4">
            {monthLabels.map(({ month, col }, i) => (
              <div
                key={i}
                className="text-[10px] text-ngp-muted absolute"
                style={{ marginLeft: col * 13 }}
              >
                {month}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {DAYS.map((d, i) => (
                <div key={i} className="h-2.5 text-[9px] text-ngp-muted/60 leading-none flex items-center">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={cn(
                      "h-2.5 w-2.5 rounded-[2px] transition-transform hover:scale-125 cursor-default",
                      cell.isCurrentYear
                        ? countToOpacity(cell.count)
                        : "opacity-0"
                    )}
                    title={
                      cell.date
                        ? `${cell.date}: ${cell.count} completion${cell.count !== 1 ? "s" : ""}`
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}