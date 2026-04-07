import { logger } from "../../logging/logger";
import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { MessageStorageRepository } from "./repository";

type AnyEvent = {
  eventName?: string;
  payload?: unknown;
};

export class MessageStorageEventConsumer implements IWhatsAppEventPublisher {
  public constructor(private readonly repository: MessageStorageRepository) {}

  public async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    const envelope = payload as AnyEvent;
    const actualPayload = envelope.payload ?? payload;

    switch (eventName) {
      case "whatsapp.session.initialized":
      case "whatsapp.session.state-changed":
      case "whatsapp.session.reconnected": {
        this.persistSessionMetadata(actualPayload);
        return;
      }
      case "whatsapp.message.received": {
        this.repository.persistMessage(
          actualPayload as Parameters<MessageStorageRepository["persistMessage"]>[0],
          "inbound",
        );
        return;
      }
      case "whatsapp.message.outgoing": {
        this.repository.persistMessage(
          actualPayload as Parameters<MessageStorageRepository["persistMessage"]>[0],
          "outbound",
        );
        return;
      }
      case "whatsapp.message.status-updated": {
        this.repository.persistMessageStatus(
          actualPayload as Parameters<MessageStorageRepository["persistMessageStatus"]>[0],
        );
        return;
      }
      default: {
        logger.trace({ eventName }, "Ignored WhatsApp event by message storage");
      }
    }
  }

  private persistSessionMetadata(payload: unknown): void {
    const status = this.extractStatus(payload);
    if (!status) return;
    this.repository.upsertSeller(status.seller);
    this.repository.upsertSession(status, null);
  }

  private extractStatus(payload: unknown): {
    sessionId: string;
    state: string;
    seller: { sellerId: string; sellerName: string; team?: string };
    isConnected: boolean;
    hasActiveQr: boolean;
    updatedAt: string;
    lastError?: string;
  } | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const maybeStatus = payload as Record<string, unknown>;
    if (
      "sessionId" in maybeStatus &&
      "seller" in maybeStatus &&
      "state" in maybeStatus &&
      "isConnected" in maybeStatus &&
      "hasActiveQr" in maybeStatus &&
      "updatedAt" in maybeStatus
    ) {
      return maybeStatus as ReturnType<MessageStorageEventConsumer["extractStatus"]>;
    }

    if ("status" in maybeStatus && maybeStatus.status) {
      return maybeStatus.status as ReturnType<MessageStorageEventConsumer["extractStatus"]>;
    }

    return null;
  }
}
