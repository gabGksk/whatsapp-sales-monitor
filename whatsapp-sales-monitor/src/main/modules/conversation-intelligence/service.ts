import Database from "better-sqlite3";
import { logger } from "../../logging/logger";
import { LifecycleService } from "../../services/service-registry";
import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { ConversationClassifier } from "./classifier";
import { ConversationIntelligenceEventConsumer } from "./event-consumer";
import { ConversationIntelligenceRepository } from "./repository";

export class ConversationIntelligenceService implements LifecycleService {
  private readonly repository: ConversationIntelligenceRepository;
  private readonly classifier: ConversationClassifier;
  private readonly consumer: ConversationIntelligenceEventConsumer;

  public constructor(db: Database.Database) {
    this.repository = new ConversationIntelligenceRepository(db);
    this.classifier = new ConversationClassifier();
    this.consumer = new ConversationIntelligenceEventConsumer(
      this.repository,
      this.classifier,
    );
  }

  public async start(): Promise<void> {
    logger.info("Conversation intelligence service started");
  }

  public async stop(): Promise<void> {
    logger.info("Conversation intelligence service stopped");
  }

  public getEventPublisher(): IWhatsAppEventPublisher {
    return this.consumer;
  }
}
