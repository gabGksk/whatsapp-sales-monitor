export interface DashboardOverview {
  range: { from: string | null; to: string | null; sellerId: string | null };
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  averageSellerScore: number;
  averageFirstResponseMinutes: number;
}

export interface SellersRankingResponse {
  items: Array<{
    sellerId: string;
    sellerName: string;
    leadsHandled: number;
    conversionRate: number;
    averageScore: number;
    averageResponseMinutes: number;
  }>;
}

export interface LossReasonsResponse {
  items: Array<{ reason: string; count: number; percentage: number }>;
}

export interface ConversionFunnelResponse {
  stages: Array<{ stage: "new" | "engaged" | "proposal" | "converted" | "lost"; count: number }>;
}

export interface ResponseTimeResponse {
  summary: {
    averageFirstResponseMinutes: number;
    p50FirstResponseMinutes: number;
    p90FirstResponseMinutes: number;
  };
  bySeller: Array<{
    sellerId: string;
    sellerName: string;
    averageFirstResponseMinutes: number;
  }>;
}

export interface RecentConversationsResponse {
  items: Array<{
    conversationId: string;
    sellerId: string;
    sellerName: string;
    contactId: string;
    lastMessageAt: string;
    lastMessageText: string;
    outcome: string;
    lostReason: string | null;
  }>;
}

export interface DashboardFilters {
  from: string;
  to: string;
  sellerId: string;
}

export interface ActiveAlertsResponse {
  items: Array<{
    id: string;
    type: string;
    priority: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    sellerId: string;
    sellerName: string;
    conversationId: string | null;
    openedAt: string;
    updatedAt: string;
    riskScore: number;
  }>;
}
