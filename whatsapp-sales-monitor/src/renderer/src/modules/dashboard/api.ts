import { apiClient } from "../../services/api-client";
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

const toQuery = (filters: DashboardFilters): string => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sellerId) params.set("sellerId", filters.sellerId);
  const raw = params.toString();
  return raw ? `?${raw}` : "";
};

export const dashboardApi = {
  getOverview(filters: DashboardFilters): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>(`/dashboard/overview${toQuery(filters)}`);
  },
  getSellersRanking(filters: DashboardFilters): Promise<SellersRankingResponse> {
    return apiClient.get<SellersRankingResponse>(
      `/dashboard/sellers-ranking${toQuery(filters)}`,
    );
  },
  getLossReasons(filters: DashboardFilters): Promise<LossReasonsResponse> {
    return apiClient.get<LossReasonsResponse>(`/dashboard/loss-reasons${toQuery(filters)}`);
  },
  getConversionFunnel(filters: DashboardFilters): Promise<ConversionFunnelResponse> {
    return apiClient.get<ConversionFunnelResponse>(
      `/dashboard/conversion-funnel${toQuery(filters)}`,
    );
  },
  getResponseTime(filters: DashboardFilters): Promise<ResponseTimeResponse> {
    return apiClient.get<ResponseTimeResponse>(`/dashboard/response-time${toQuery(filters)}`);
  },
  getRecentConversations(filters: DashboardFilters): Promise<RecentConversationsResponse> {
    return apiClient.get<RecentConversationsResponse>(
      `/dashboard/conversations/recent${toQuery(filters)}`,
    );
  },
  getActiveAlerts(): Promise<ActiveAlertsResponse> {
    return apiClient.get<ActiveAlertsResponse>("/dashboard/alerts/active");
  },
};
