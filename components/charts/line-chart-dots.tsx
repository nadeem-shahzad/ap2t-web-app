'use client';

import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type LineSeries = {
  key: string;
  stroke?: string;
  strokeWidth?: number;
  showDots?: boolean;
};

type LineChartProps = {
  data: any[];
  config: ChartConfig;
  xAxisKey: string;
  lines: LineSeries[];
  tickFormatter?: (value: any) => string;
  showGrid?: boolean;
  showTooltip?: boolean;
};

export default function LineChart({
  data,
  config,
  xAxisKey,
  lines,
  tickFormatter,
  showGrid = true,
  showTooltip = true,
}: LineChartProps) {
  return (
    <ChartContainer config={config} className={`w-full h-full`}>
      <RechartsLineChart data={data} margin={{ left: 12, right: 12 }}>
        {showGrid && <CartesianGrid horizontal={true} vertical={true} />}

        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={tickFormatter}
        />

        {/* ADD THIS */}
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={60} // optional: adjusts Y-axis label space
        />

        {showTooltip && <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />}

        {lines.map((line) => (
          <Line
            key={line.key}
            dataKey={line.key}
            type="natural"
            stroke={line.stroke ?? `var(--color-${line.key})`}
            strokeWidth={line.strokeWidth ?? 2}
            dot={
              line.showDots !== false ? { fill: line.stroke ?? `var(--color-${line.key})` } : false
            }
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}
