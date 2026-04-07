export type AlertType =
  | "delayed-response"
  | "high-risk-lead-loss"
  | "no-follow-up"
  | "price-objection-risk"
  | "network-availability-loss"
  | "seller-underperformance"
  | "conversion-opportunity";

export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface AlertRecord {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  sellerId: string;
  sellerName: string;
  conversationId: string | null;
  openedAt: string;
  updatedAt: string;
  riskScore: number;
}

export interface AlertConfig {
  delayedResponseSlaMinutes: 5 | 10 | 15;
  highRiskThreshold: number;
  noFollowUpMinutes: number;
  inactivityRiskMinutes: number;
}

export interface ConversationSnapshot {
  conversationId: string;
  sellerId: string;
  sellerName: string;
  currentOutcome: string;
  lostReason: string | null;
  lastMessageAt: string;
  lastInboundAt: number | null;
  lastOutboundAt: number | null;
  inboundCount: number;
  outboundCount: number;
  recentInboundText: string;
  recentOutboundText: string;
  hasQuestionPending: boolean;
}

export interface SellerPerformanceSnapshot {
  sellerId: string;
  sellerName: string;
  avgSellerScore: number;
  recentLostLeads: number;
}
