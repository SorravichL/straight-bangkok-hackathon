"use client";

import { useMemo, useState } from "react";

export type Candle = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartDataset = {
  candles: Candle[];
  hasOhlc: boolean;
};

type CandlestickChartProps = {
  candles: Candle[];
  hasOhlc: boolean;
  symbol: string;
  displayEndDate?: Date;
};

// This matches the mobile chart panel's proportions, so the SVG can use its
// full height without distorting candles, labels, or grid lines.
const chartWidth = 360;
const chartHeight = 200;
const plot = { left: 36, right: 58, top: 22, bottom: 38 };

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatChartPrice(value: number) {
  return numberFormatter.format(value);
}

function getAxisStep(range: number) {
  const roughStep = range / 4;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(roughStep, 0.0001)));
  const normalised = roughStep / magnitude;
  const multiplier =
    normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return multiplier * magnitude;
}

export default function CandlestickChart({
  candles,
  hasOhlc,
  symbol,
  displayEndDate,
}: CandlestickChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const model = useMemo(() => {
    const priceHigh = Math.max(...candles.map((candle) => candle.high));
    const priceLow = Math.min(...candles.map((candle) => candle.low));
    const valueRange =
      priceHigh - priceLow || Math.max(Math.abs(priceHigh) * 0.02, 1);
    const paddedHigh = priceHigh + valueRange * 0.12;
    const paddedLow = priceLow - valueRange * 0.12;
    const axisStep = getAxisStep(paddedHigh - paddedLow);
    const axisHigh = Math.ceil(paddedHigh / axisStep) * axisStep;
    const axisLow = Math.floor(paddedLow / axisStep) * axisStep;
    const drawableWidth = chartWidth - plot.left - plot.right;
    const drawableHeight = chartHeight - plot.top - plot.bottom;
    const y = (price: number) =>
      plot.top + ((axisHigh - price) / (axisHigh - axisLow)) * drawableHeight;
    const x = (index: number) =>
      plot.left + (index / Math.max(candles.length - 1, 1)) * drawableWidth;
    const candleWidth = Math.max(
      1,
      Math.min(15, (drawableWidth / Math.max(candles.length, 1)) * 0.65),
    );
    const gridValues = Array.from(
      { length: 5 },
      (_, index) => axisLow + ((axisHigh - axisLow) * index) / 4,
    );
    const highIndex = candles.findIndex((candle) => candle.high === priceHigh);
    const lowIndex = candles.findIndex((candle) => candle.low === priceLow);

    return {
      priceHigh,
      priceLow,
      highIndex,
      lowIndex,
      y,
      x,
      candleWidth,
      gridValues,
      drawableWidth,
    };
  }, [candles]);

  if (!candles.length) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
        No valid chart rows found in this CSV.
      </div>
    );
  }

  const hoveredCandle =
    hoveredIndex === null
      ? null
      : candles[Math.min(hoveredIndex, candles.length - 1)];
  const highY = model.y(model.priceHigh);
  const lowY = model.y(model.priceLow);
  const earliest = candles[0];
  const latest = candles[candles.length - 1];

  const selectCandleAtPointer = (clientX: number, svg: SVGSVGElement) => {
    const bounds = svg.getBoundingClientRect();
    const viewBoxX = ((clientX - bounds.left) / bounds.width) * chartWidth;
    const progress = Math.max(
      0,
      Math.min(1, (viewBoxX - plot.left) / model.drawableWidth),
    );
    setHoveredIndex(Math.round(progress * Math.max(candles.length - 1, 0)));
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-slate-950 text-white">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`${symbol} candlestick chart`}
        className="block h-full w-full touch-none"
        onMouseMove={(event) =>
          selectCandleAtPointer(event.clientX, event.currentTarget)
        }
        onMouseLeave={() => setHoveredIndex(null)}
        onTouchMove={(event) => {
          const touch = event.touches.item(0);
          if (touch) selectCandleAtPointer(touch.clientX, event.currentTarget);
        }}
      >
        <defs>
          <linearGradient id="chart-background" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <rect
          width={chartWidth}
          height={chartHeight}
          fill="url(#chart-background)"
          rx="8"
        />

        {model.gridValues.map((value) => {
          const y = model.y(value);
          return (
            <g key={value}>
              <line
                x1={plot.left}
                x2={chartWidth - plot.right}
                y1={y}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 5"
                strokeWidth="1"
              />
              <text
                x={chartWidth - plot.right + 8}
                y={y + 4}
                fill="#94a3b8"
                fontSize="11"
              >
                {formatChartPrice(value)}
              </text>
            </g>
          );
        })}

        <line
          x1={plot.left}
          x2={chartWidth - plot.right}
          y1={highY}
          y2={highY}
          stroke="#fbbf24"
          strokeDasharray="5 4"
          strokeWidth="1"
          opacity="0.75"
        />
        <line
          x1={plot.left}
          x2={chartWidth - plot.right}
          y1={lowY}
          y2={lowY}
          stroke="#60a5fa"
          strokeDasharray="5 4"
          strokeWidth="1"
          opacity="0.75"
        />

        {candles.map((candle, index) => {
          const isRising = candle.close >= candle.open;
          const color = isRising ? "#4ade80" : "#fb7185";
          const x = model.x(index);
          const bodyTop = model.y(Math.max(candle.open, candle.close));
          const bodyBottom = model.y(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

          return (
            <g
              key={`${candle.date.toISOString()}-${index}`}
              opacity={
                hoveredIndex === null || hoveredIndex === index ? 1 : 0.55
              }
            >
              <line
                x1={x}
                x2={x}
                y1={model.y(candle.high)}
                y2={model.y(candle.low)}
                stroke={color}
                strokeWidth={Math.max(1, model.candleWidth * 0.18)}
              />
              <rect
                x={x - model.candleWidth / 2}
                y={bodyTop}
                width={model.candleWidth}
                height={bodyHeight}
                fill={color}
                rx="0.5"
              />
            </g>
          );
        })}

        {[model.highIndex, model.lowIndex].map((index, markerIndex) => {
          const isHigh = markerIndex === 0;
          const candle = candles[index];
          const pointY = model.y(isHigh ? candle.high : candle.low);
          return (
            <circle
              key={isHigh ? "period-high" : "period-low"}
              cx={model.x(index)}
              cy={pointY}
              r="3.5"
              fill={isHigh ? "#fbbf24" : "#60a5fa"}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          );
        })}

        {hoveredCandle && hoveredIndex !== null && (
          <g>
            <line
              x1={model.x(hoveredIndex)}
              x2={model.x(hoveredIndex)}
              y1={plot.top}
              y2={chartHeight - plot.bottom}
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              opacity="0.65"
            />
          </g>
        )}

        <text x={plot.left} y={chartHeight - 13} fill="#94a3b8" fontSize="11">
          {dateFormatter.format(earliest.date)}
        </text>
        <text
          x={chartWidth - plot.right}
          y={chartHeight - 13}
          fill="#94a3b8"
          fontSize="11"
          textAnchor="end"
        >
          {dateFormatter.format(displayEndDate ?? latest.date)}
        </text>
      </svg>

      <div className="pointer-events-none absolute left-3 top-2 rounded bg-slate-900/90 px-2 py-1 text-[11px] font-medium text-slate-200 shadow-sm">
        {symbol}
        {hoveredCandle && (
          <>
            <div className="font-semibold">
              {tooltipDateFormatter.format(hoveredCandle.date)}
            </div>
            <div>{formatChartPrice(hoveredCandle.close)}</div>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-8 left-3 flex gap-2 text-[10px] font-semibold">
        <span className="rounded bg-amber-300/15 px-1.5 py-0.5 text-amber-300">
          High {formatChartPrice(model.priceHigh)}
        </span>
        <span className="rounded bg-blue-300/15 px-1.5 py-0.5 text-blue-300">
          Low {formatChartPrice(model.priceLow)}
        </span>
      </div>
    </div>
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDate(value: string) {
  const mmDdYyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmDdYyyy) {
    return new Date(
      Number(mmDdYyyy[3]),
      Number(mmDdYyyy[1]) - 1,
      Number(mmDdYyyy[2]),
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value.replaceAll(",", "").replace(/[$\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseChartCsv(csv: string): ChartDataset {
  const rows = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (rows.length < 2)
    throw new Error("The CSV needs a header and at least one data row.");

  const header = parseCsvLine(rows[0]).map((name) =>
    name.toLowerCase().replace(/[\s_-]/g, ""),
  );
  const findColumn = (...names: string[]) =>
    header.findIndex((column) => names.includes(column));
  const dateColumn = findColumn("date", "timestamp", "time");
  const openColumn = findColumn("open");
  const highColumn = findColumn("high");
  const lowColumn = findColumn("low");
  const closeColumn = findColumn("close", "adjclose", "value", "price", "last");
  const hasOhlc =
    openColumn >= 0 && highColumn >= 0 && lowColumn >= 0 && closeColumn >= 0;

  if (dateColumn < 0 || closeColumn < 0) {
    throw new Error(
      "CSV must include Date plus Value/Close, or Date/Open/High/Low/Close columns.",
    );
  }

  const rawRows = rows
    .slice(1)
    .map(parseCsvLine)
    .map((row) => ({ date: parseDate(row[dateColumn]), row }))
    .filter(
      (entry): entry is { date: Date; row: string[] } => entry.date !== null,
    )
    .sort((first, second) => first.date.valueOf() - second.date.valueOf());

  const candles: Candle[] = [];
  for (const entry of rawRows) {
    const close = parseNumber(entry.row[closeColumn]);
    if (close === null) continue;

    if (hasOhlc) {
      const open = parseNumber(entry.row[openColumn]);
      const high = parseNumber(entry.row[highColumn]);
      const low = parseNumber(entry.row[lowColumn]);
      if (open === null || high === null || low === null) continue;
      candles.push({
        date: entry.date,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
      });
    } else {
      // A close-only file still produces honest candle bodies: each period opens
      // at the previous observed close and closes at the row's actual value.
      const open = candles.at(-1)?.close ?? close;
      candles.push({
        date: entry.date,
        open,
        high: Math.max(open, close),
        low: Math.min(open, close),
        close,
      });
    }
  }

  if (!candles.length)
    throw new Error("No valid numeric chart rows were found in this CSV.");
  return { candles, hasOhlc };
}
