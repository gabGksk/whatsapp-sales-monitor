export type ConversationOutcome =
  | "converted"
  | "lost"
  | "pending"
  | "no-response";

export type LossReason =
  | "price"
  | "no network availability"
  | "low credit score"
  | "competitor"
  | "no interest"
  | "delayed response"
  | "no follow-up"
  | "customer stopped responding"
  | "other";

export type ResponseQuality = "excellent" | "good" | "average" | "poor";

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sellerId: string;
  direction: "inbound" | "outbound";
  messageText: string;
  timestamp: number;
}

export interface SellerMetricBreakdown {
  responseSpeedScore: number;
  followUpConsistency: number;
  closingAttemptDetection: number;
  objectionHandlingQuality: number;
  overallSellerScore: number;
}

export interface ClassificationInput {
  conversationId: string;
  sellerId: string;
  messages: ConversationMessage[];
}

export interface ClassificationResult {
  conversation_id: string;
  outcome: ConversationOutcome;
  reason: LossReason;
  seller_score: number;
  response_quality: ResponseQuality;
  summary: string;
  confidence: number;
}
