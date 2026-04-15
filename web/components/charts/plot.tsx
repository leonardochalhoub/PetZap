"use client";

/**
 * Wrapper around react-plotly.js with the basic-dist build.
 * Loaded only on the client (Plotly relies on `window`).
 *
 * Theme: matches the warm stone / inky zinc palette used app-wide.
 */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Layout, Config, PlotData } from "plotly.js";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const Plot = dynamic(
  async () => {
    const [plotlyMod, factoryMod] = await Promise.all([
      import("plotly.js-basic-dist-min"),
      import("react-plotly.js/factory"),
    ]);
    const Plotly = (plotlyMod as { default: typeof import("plotly.js") }).default;
    return (factoryMod as { default: (p: typeof import("plotly.js")) => ComponentType<{
      data: Partial<PlotData>[];
      layout?: Partial<Layout>;
      config?: Partial<Config>;
      style?: React.CSSProperties;
      className?: string;
      useResizeHandler?: boolean;
    }> }).default(Plotly);
  },
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-stone-100/60 dark:bg-zinc-800/40" /> }
);

export type PlotChartProps = {
  data: Partial<PlotData>[];
  height?: number;
  layoutOverride?: Partial<Layout>;
};

const FONT = '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function PlotChart({ data, height = 280, layoutOverride }: PlotChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const layout = useMemo<Partial<Layout>>(() => {
    const fg = isDark ? "#E4E4E7" : "#44403C";
    const grid = isDark ? "rgba(63,63,70,0.4)" : "rgba(231,229,228,0.7)";
    return {
      autosize: true,
      height,
      margin: { l: 56, r: 16, t: 8, b: 40 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: FONT, size: 12, color: fg },
      hoverlabel: {
        bgcolor: isDark ? "#18181B" : "#FFFFFF",
        bordercolor: isDark ? "#3F3F46" : "#E7E5E4",
        font: { family: FONT, color: fg, size: 12 },
      },
      legend: {
        orientation: "h",
        x: 0,
        y: -0.18,
        font: { size: 11, color: fg },
        bgcolor: "rgba(0,0,0,0)",
      },
      xaxis: {
        gridcolor: grid,
        zerolinecolor: grid,
        linecolor: grid,
        tickfont: { size: 11, color: fg },
        automargin: true,
      },
      yaxis: {
        gridcolor: grid,
        zerolinecolor: grid,
        linecolor: grid,
        tickfont: { size: 11, color: fg },
        automargin: true,
      },
      ...layoutOverride,
    };
  }, [isDark, height, layoutOverride]);

  const config = useMemo<Partial<Config>>(
    () => ({
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: [
        "lasso2d",
        "select2d",
        "autoScale2d",
        "toggleSpikelines",
      ],
      displayModeBar: false,
    }),
    []
  );

  return (
    <Plot
      data={data}
      layout={layout}
      config={config}
      style={{ width: "100%", height: `${height}px` }}
      useResizeHandler
    />
  );
}
