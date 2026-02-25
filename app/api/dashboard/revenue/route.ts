import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, cost_mad, ended_at")
      .eq("status", "completed");

    const list = sessions ?? [];
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const getDayStart = (d: Date) => {
      const x = new Date(d);
      x.setUTCHours(0, 0, 0, 0);
      return x.getTime();
    };
    const getWeekStart = (d: Date) => {
      const x = new Date(d);
      const day = x.getUTCDay();
      const diff = (day === 0 ? 6 : day - 1) * dayMs;
      x.setTime(getDayStart(x) - diff);
      return x.getTime();
    };
    const getMonthStart = (d: Date) => {
      const x = new Date(d);
      x.setUTCDate(1);
      x.setUTCHours(0, 0, 0, 0);
      return x.getTime();
    };

    const completedWithEnd = list.filter((s) => s.ended_at) as { id: string; cost_mad: number | null; ended_at: string }[];

    const dailyBuckets: Record<number, number> = {};
    const weeklyBuckets: Record<number, number> = {};
    const monthlyBuckets: Record<string, number> = {};
    let thisWeekSum = 0;
    let thisMonthSum = 0;

    const weekStartNow = getWeekStart(now);
    const monthStartNow = getMonthStart(now);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dailyBuckets[getDayStart(d)] = 0;
    }
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i * 7);
      weeklyBuckets[getWeekStart(d)] = 0;
    }
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = getMonthStart(d);
      monthlyBuckets[key] = 0;
    }

    completedWithEnd.forEach((s) => {
      const cost = Number(s.cost_mad ?? 0);
      const end = new Date(s.ended_at).getTime();
      const dayStart = getDayStart(new Date(s.ended_at));
      const weekStart = getWeekStart(new Date(s.ended_at));
      const monthStart = getMonthStart(new Date(s.ended_at));

      if (dailyBuckets[dayStart] !== undefined) {
        dailyBuckets[dayStart] += cost;
      }
      if (weeklyBuckets[weekStart] !== undefined) {
        weeklyBuckets[weekStart] += cost;
      }
      if (monthlyBuckets[monthStart] !== undefined) {
        monthlyBuckets[monthStart] += cost;
      }
      if (weekStart === weekStartNow) thisWeekSum += cost;
      if (monthStart === monthStartNow) thisMonthSum += cost;
    });

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyData = Object.entries(dailyBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ts, revenue]) => {
        const d = new Date(Number(ts));
        return { day: dayLabels[d.getUTCDay()], revenue: Math.round(revenue * 100) / 100 };
      });

    const weeklyData = Object.entries(weeklyBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ts], i) => ({
        week: `W${(Object.keys(weeklyBuckets).length - i)}`,
        revenue: Math.round((weeklyBuckets[Number(ts)] ?? 0) * 100) / 100,
      }));

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = Object.entries(monthlyBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ts]) => {
        const d = new Date(Number(ts));
        return {
          month: monthLabels[d.getUTCMonth()],
          revenue: Math.round((monthlyBuckets[Number(ts)] ?? 0) * 100) / 100,
        };
      });

    const totalSessionRevenue = completedWithEnd.reduce((sum, s) => sum + Number(s.cost_mad ?? 0), 0);
    const sessionCount = completedWithEnd.length;
    const avgPerSession = sessionCount > 0 ? totalSessionRevenue / sessionCount : 0;
    const daysWithData = dailyData.filter((d) => d.revenue > 0).length || 1;
    const avgPerDay = dailyData.reduce((s, d) => s + d.revenue, 0) / daysWithData;

    const lastWeekStart = getWeekStart(new Date(now.getTime() - 7 * dayMs));
    let lastWeekSum = 0;
    completedWithEnd.forEach((s) => {
      const weekStart = getWeekStart(new Date(s.ended_at));
      if (weekStart === lastWeekStart) lastWeekSum += Number(s.cost_mad ?? 0);
    });
    const lastMonthStart = getMonthStart(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    let lastMonthSum = 0;
    completedWithEnd.forEach((s) => {
      const monthStart = getMonthStart(new Date(s.ended_at));
      if (monthStart === lastMonthStart) lastMonthSum += Number(s.cost_mad ?? 0);
    });

    const weekChange = lastWeekSum > 0 ? ((thisWeekSum - lastWeekSum) / lastWeekSum) * 100 : 0;
    const monthChange = lastMonthSum > 0 ? ((thisMonthSum - lastMonthSum) / lastMonthSum) * 100 : 0;

    return NextResponse.json({
      stats: {
        thisWeek: Math.round(thisWeekSum * 100) / 100,
        thisMonth: Math.round(thisMonthSum * 100) / 100,
        avgPerDay: Math.round(avgPerDay * 100) / 100,
        avgPerSession: Math.round(avgPerSession * 100) / 100,
        weekChange: Math.round(weekChange * 10) / 10,
        monthChange: Math.round(monthChange * 10) / 10,
      },
      dailyData,
      weeklyData,
      monthlyData,
      breakdown: [
        {
          category: "Session fees",
          amount: Math.round(totalSessionRevenue * 100) / 100,
          percent: 100,
        },
      ],
    });
  } catch (e) {
    console.error("[revenue] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load revenue" },
      { status: 500 }
    );
  }
}
