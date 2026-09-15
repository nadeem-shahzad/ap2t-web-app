import { BarChart } from '@/components/charts/bar-chart';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AttendanceRecord } from '@/lib/types';

export function DailyCheckins({ data }: { data: AttendanceRecord[] }) {
  function getHourLabel(date: Date) {
    const hour = date.getUTCHours();
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }
  function getDayLabel(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  }

  function getWeekOfMonth(date: Date) {
    const startMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    return Math.ceil((date.getUTCDate() + startMonth.getUTCDay()) / 7);
  }

  function generateCheckinsChartData(data: any[]) {
    const today = new Date();
    const hours = [
      '12 AM',
      '1 AM',
      '2 AM',
      '3 AM',
      '4 AM',
      '5 AM',
      '6 AM',
      '7 AM',
      '8 AM',
      '9 AM',
      '10 AM',
      '11 AM',
      '12 PM',
      '1 PM',
      '2 PM',
      '3 PM',
      '4 PM',
      '5 PM',
      '6 PM',
      '7 PM',
      '8 PM',
      '9 PM',
      '10 PM',
      '11 PM',
    ];
    const todayCheckinsMap: Record<string, number> = {};
    hours.forEach((h) => (todayCheckinsMap[h] = 0));

    data.forEach((att) => {
      const date = new Date(att.created_at);
      if (
        date.getUTCFullYear() === today.getUTCFullYear() &&
        date.getUTCMonth() === today.getUTCMonth() &&
        date.getUTCDate() === today.getUTCDate()
      ) {
        const hourLabel = getHourLabel(date);
        todayCheckinsMap[hourLabel]++;
      }
    });

    const todayCheckins = hours.map((h) => ({ time: h, checkins: todayCheckinsMap[h] }));

    const weekStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    const dayOfWeek = today.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setUTCDate(today.getUTCDate() + mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekCheckinsMap: Record<string, number> = {};
    weekOrder.forEach((d) => (weekCheckinsMap[d] = 0));

    data.forEach((att) => {
      const date = new Date(att.created_at);
      if (date >= weekStart && date <= weekEnd) {
        const dayLabel = getDayLabel(date);
        weekCheckinsMap[dayLabel]++;
      }
    });

    const weekCheckins = weekOrder.map((day) => ({ time: day, checkins: weekCheckinsMap[day] }));

    const monthCheckinsMap: Record<string, number> = {
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
    };

    data.forEach((att) => {
      const date = new Date(att.created_at);
      if (
        date.getUTCFullYear() === today.getUTCFullYear() &&
        date.getUTCMonth() === today.getUTCMonth()
      ) {
        const weekNum = getWeekOfMonth(date);
        const weekLabel = `Week ${weekNum}`;
        if (monthCheckinsMap[weekLabel] !== undefined) monthCheckinsMap[weekLabel]++;
      }
    });

    const monthCheckins = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => ({
      time: week,
      checkins: monthCheckinsMap[week],
    }));

    return {
      today: todayCheckins,
      week: weekCheckins,
      month: monthCheckins,
    };
  }

  const CHECKINS_CHART_DATA = generateCheckinsChartData(data);

  return (
    <Card className="flex-3 bg-[#282828] border border-[#3A3A3A] ">
      <Tabs defaultValue="Today" className="h-full">
        <CardHeader className="flex justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-xl font-medium">Daily Check-ins</h1>
            <p className="text-md text-[#B0B0B0] tracking-tight">
              Track attendance patterns over time
            </p>
          </div>

          <TabsList className="bg-[#4F4F4F] relative flex gap-2 h-10 ">
            {['Today', 'Weekly', 'Monthly'].map((t) => (
              <TabsTrigger key={t} value={t} className="p-4">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </CardHeader>

        <TabsContent value="Today">
          <CardContent>
            {/* Bar chart for Today */}
            <BarChart chartData={CHECKINS_CHART_DATA.today} xaxis="time" yaxis="checkins" />
          </CardContent>
        </TabsContent>

        <TabsContent value="Weekly">
          <CardContent>
            {/* Bar chart for Weekly */}
            <BarChart chartData={CHECKINS_CHART_DATA.week} xaxis="time" yaxis="checkins" />
          </CardContent>
        </TabsContent>

        <TabsContent value="Monthly">
          <CardContent>
            {/* Bar chart for Monthly */}
            <BarChart chartData={CHECKINS_CHART_DATA.month} xaxis="time" yaxis="checkins" />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
