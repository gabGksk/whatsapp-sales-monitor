import { logger } from "../../logging/logger";
import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { ConversationClassifier } from "./classifier";
import { ConversationIntelligenceRepository } from "./repository";

type MessageEventPayload = {
  conversationId: string;
  seller: { sellerId: string };
};

type EnvelopeLike = {
  payload?: unknown;
};

export class ConversationIntelligenceEventConsumer
  implements IWhatsAppEventPublisher
{
  public constructor(
    private readonly repository: ConversationIntelligenceRepository,
    private readonly classifier: ConversationClassifier,
  ) {}

  public async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    if (
      eventName !== "whatsapp.message.received" &&
      eventName !== "whatsapp.message.outgoing" &&
      eventName !== "whatsapp.message.status-updated"
    ) {
      return;
    }

    const eventPayload = this.extractPayload(payload) as MessageEventPayload;
    if (!eventPayload?.conversationId || !eventPayload?.seller?.sellerId) {
      logger.warn({ eventName }, "Conversation intelligence skipped malformed event");
      return;
    }

    if (eventName === "whatsapp.message.status-updated") {
      return;
    }

    const messages = this.repository.listConversationMessages(
      eventPayload.conversationId,
      250,
    );

    if (messages.length === 0) {
      return;
    }

    const sellerId = eventPayload.seller.sellerId;
    const result = await this.classifier.classify({
      conversationId: eventPayload.conversationId,
      sellerId,
      messages,
    });

    this.repository.upsertLeadOutcome(result, sellerId);
  }

  private extractPayload<TPayload>(payload: TPayload): unknown {
    const possibleEnvelope = payload as EnvelopeLike;
    return possibleEnvelope?.payload ?? payload;
  }
}
