import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentReviews } from "@/components/dashboard/recent-reviews";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { DeadlinesPanel } from "@/components/dashboard/deadlines-panel";
import { ToolsGrid } from "@/components/dashboard/tools-grid";
import { demoUser } from "@/lib/demo-data";
import { useState, useEffect } from "react";

export function DashboardShell() {
  const [displayName, setDisplayName] = useState(demoUser.name);

  useEffect(() => {
    const stored = window.localStorage.getItem("smartreview-user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDisplayName(parsed.name || demoUser.name);
      } catch {}
    }
  }, []);

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const token = window.localStorage.getItem("smartreview-token");
      if (!token) throw new Error("No token");
      const response = await fetch("/api/v1/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to load dashboard");
      return payload;
    },
  });

  if (isLoading) return <p>Loading Dashboard...</p>;

  const data = dashboardData || { stats: null, recentReviews: [], activity: [], deadlines: [] };

  return (
    <main className="dashboard">
      <section className="dashboard-main" aria-label="Student review summary">
        <div className="welcome">
          <h1>Welcome back, {dashboardData?.user?.name || displayName}!</h1>
          <p>Your academic progress and recent AI review activity.</p>
        </div>
        
        {error && <p className="error-text">{error.message}</p>}
        
        <StatsCards stats={data.stats} />
        <RecentReviews reviews={data.recentReviews} />
      </section>

      <aside className="right-rail" aria-label="SmartReview panels">
        <ToolsGrid />
        <ActivityPanel activity={data.activity} />
        <DeadlinesPanel deadlines={data.deadlines} />
      </aside>
    </main>
  );
}
