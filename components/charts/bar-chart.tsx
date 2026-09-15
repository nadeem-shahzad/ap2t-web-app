'use client';

import { Bar, BarChart as Chart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export const description = 'Daily Check-ins Bar Chart';

const chartConfig = {
  checkins: {
    label: 'Daily Check-ins',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function BarChart({
  chartData = [],
  xaxis,
  yaxis,
  className = '',
}: {
  chartData: any[];
  xaxis: string;
  yaxis: string;
  className?: string;
}) {
  return (
    <ChartContainer config={chartConfig} className={`mt-4 ${className}`}>
      <Chart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />

        <XAxis dataKey={xaxis} tickLine={false} axisLine={false} tickMargin={10} />

        <YAxis tickCount={9} tickLine={false} axisLine={false} />

        {/* <Legend /> */}

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

        <Bar dataKey={yaxis} fill="var(--color-checkins)" radius={8} />
      </Chart>
    </ChartContainer>
  );
}
