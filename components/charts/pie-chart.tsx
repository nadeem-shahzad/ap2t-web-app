'use client';

import { PieChart as RechartsPieChart, Pie } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

type PieChartDataItem = {
  name: string;
  value: number;
  fill?: string;
};

type PieChartProps = {
  data: PieChartDataItem[];
  config: ChartConfig;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
  showTooltip?: boolean;
};

export default function PieChart({
  data,
  config,
  dataKey = 'value',
  nameKey = 'name',
  height = 250,
  className = '',
  showTooltip = true,
}: PieChartProps) {
  return (
    <ChartContainer config={config} className={`mx-auto aspect-square h-full ${className}`}>
      <RechartsPieChart>
        {showTooltip && (
          <ChartTooltip
            cursor={false}
            content={({ payload }) => {
              if (!payload?.length) return null;

              const { name, value, payload: localPayload } = payload[0];

              return (
                <div className="flex items-center justify-between gap-4 rounded-md bg-[#1f1f1f] px-3 py-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: localPayload.fill }}
                    />
                    <span className="text-muted-foreground">{name}</span>
                  </div>

                  <span className="font-medium text-white">{value}</span>
                </div>
              );
            }}
          />
        )}
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} />
      </RechartsPieChart>
    </ChartContainer>
  );
}
