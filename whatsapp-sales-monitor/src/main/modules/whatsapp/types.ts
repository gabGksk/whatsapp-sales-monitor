export type WhatsAppSessionState =
  | "not_initialized"
  | "initializing"
  | "qr_required"
  | "authenticated"
  | "ready"
  | "reconnecting"
  | "disconnected"
  | "destroyed"
  | "error";

export type MessageDirection = "incoming" | "outgoing";

export type MessageDeliveryState =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface SellerMetadata {
  sellerId: string;
  sellerName: string;
  team?: string;
}

export interface SessionIdentity {
  sessionId: string;
  seller: SellerMetadata;
}

export interface SessionConfig {
  sessionId: string;
  seller: SellerMetadata;
  /**
   * Relative or absolute storage path for persistent auth/session data.
   */
  storagePath: string;
}

export interface SessionStatus {
  sessionId: string;
  state: WhatsAppSessionState;
  seller: SellerMetadata;
  isConnected: boolean;
  hasActiveQr: boolean;
  updatedAt: string;
  lastError?: string;
}

export interface MessageEnvelope {
  providerMessageId: string;
  conversationId: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  direction: MessageDirection;
  timestamp: number;
  sessionId: string;
  seller: SellerMetadata;
}

export interface IncomingMessagePayload extends MessageEnvelope {
  direction: "incoming";
}

export interface OutgoingMessagePayload extends MessageEnvelope {
  direction: "outgoing";
}

export interface MessageStatusPayload {
  providerMessageId: string;
  sessionId: string;
  seller: SellerMetadata;
  deliveryState: MessageDeliveryState;
  statusTimestamp: number;
}

export interface SessionQrPayload {
  sessionId: string;
  seller: SellerMetadata;
  qr: string;
  generatedAt: string;
}
