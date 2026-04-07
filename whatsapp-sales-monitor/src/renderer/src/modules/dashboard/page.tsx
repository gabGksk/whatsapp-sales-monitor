import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "./api";
import { ActiveAlertsWidget } from "./components/ActiveAlertsWidget";
import { ConversionFunnelChart } from "./components/ConversionFunnelChart";
import { FiltersBar } from "./components/FiltersBar";
import { KpiCards } from "./components/KpiCards";
import { LossReasonsBarChart } from "./components/LossReasonsBarChart";
import { RecentConversationsTable } from "./components/RecentConversationsTable";
import { ResponseTimePanel } from "./components/ResponseTimePanel";
import { SellerRankingTable } from "./components/SellerRankingTable";
import {
  ConversionFunnelResponse,
  DashboardFilters,
  DashboardOverview,
  LossReasonsResponse,
  RecentConversationsResponse,
  ResponseTimeResponse,
  SellersRankingResponse,
  ActiveAlertsResponse,
} from "./types";

const today = new Date().toISOString().slice(0, 10);

export const DashboardPage = (): JSX.Element => {
  const [filters, setFilters] = useState<DashboardFilters>({
    from: "",
    to: today,
    sellerId: "",
  });

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [ranking, setRanking] = useState<SellersRankingResponse | null>(null);
  const [lossReasons, setLossReasons] = useState<LossReasonsResponse | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnelResponse | null>(null);
  const [recent, setRecent] = useState<RecentConversationsResponse | null>(null);
  const [responseTime, setResponseTime] = useState<ResponseTimeResponse | null>(null);
  const [alerts, setAlerts] = useState<ActiveAlertsResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      dashboardApi.getOverview(filters),
      dashboardApi.getSellersRanking(filters),
      dashboardApi.getLossReasons(filters),
      dashboardApi.getConversionFunnel(filters),
      dashboardApi.getRecentConversations(filters),
      dashboardApi.getResponseTime(filters),
      dashboardApi.getActiveAlerts(),
    ])
      .then(([overviewRes, rankingRes, lossRes, funnelRes, recentRes, responseRes, alertsRes]) => {
        if (!mounted) return;
        setOverview(overviewRes);
        setRanking(rankingRes);
        setLossReasons(lossRes);
        setFunnel(funnelRes);
        setRecent(recentRes);
        setResponseTime(responseRes);
        setAlerts(alertsRes);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Dashboard load failed");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  const sellerOptions = useMemo(
    () => (ranking?.items ?? []).map((item) => ({ sellerId: item.sellerId, sellerName: item.sellerName })),
    [ranking],
  );

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Sales Monitoring Dashboard</h1>
        <p>Operational intelligence for supervisors and managers.</p>
      </header>

      <FiltersBar filters={filters} sellerOptions={sellerOptions} onChange={setFilters} />

      {loading && <section className="panel">Loading dashboard...</section>}
      {error && <section className="panel error">{error}</section>}

      {!loading && !error && (
        <>
          <KpiCards overview={overview} />
          <section className="grid-2">
            <SellerRankingTable data={ranking} />
            <LossReasonsBarChart data={lossReasons} />
          </section>
          <section className="grid-2">
            <ConversionFunnelChart data={funnel} />
            <ResponseTimePanel data={responseTime} />
          </section>
          <ActiveAlertsWidget data={alerts} />
          <RecentConversationsTable data={recent} />
        </>
      )}
    </main>
  );
};
