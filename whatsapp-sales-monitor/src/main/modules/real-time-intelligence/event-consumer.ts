import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { RealTimeIntelligenceService } from "./service";

type EventEnvelope = {
  payload?: {
    conversationId?: string;
  };
};

export class RealTimeIntelligenceEventConsumer implements IWhatsAppEventPublisher {
  public constructor(private readonly service: RealTimeIntelligenceService) {}

  public async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    if (
      eventName !== "whatsapp.message.received" &&
      eventName !== "whatsapp.message.outgoing" &&
      eventName !== "whatsapp.message.status-updated"
    ) {
      return;
    }

    const envelope = payload as EventEnvelope;
    const conversationId = envelope?.payload?.conversationId;
    if (conversationId) {
      this.service.evaluateConversation(conversationId);
    }
  }
}
