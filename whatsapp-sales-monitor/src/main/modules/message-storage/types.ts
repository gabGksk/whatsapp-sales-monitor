import Database from "better-sqlite3";
import { MessageDeliveryState } from "../whatsapp/types";

export type LeadOutcome = "pending" | "converted" | "lost" | "no-response";

export interface MessageStorageContext {
  db: Database.Database;
}

export interface PersistedMessageRecord {
  id: string;
  providerMessageId: string;
  sessionId: string;
  sellerId: string;
  contactId: string;
  conversationId: string;
  direction: "inbound" | "outbound";
  messageText: string;
  timestamp: number;
  deliveryStatus: MessageDeliveryState;
  messageType: string;
  rawPayloadJson: string;
}

export interface PersistedMessageStatusRecord {
  id: string;
  messageId: string;
  providerMessageId: string;
  sessionId: string;
  sellerId: string;
  status: MessageDeliveryState;
  statusTimestamp: number;
  rawPayloadJson: string;
}

export interface LeadOutcomeRecord {
  id: string;
  conversationId: string;
  sellerId: string;
  outcome: LeadOutcome;
  lostReason: string | null;
  source: "system" | "manual";
  occurredAt: string;
  rawPayloadJson: string;
}
