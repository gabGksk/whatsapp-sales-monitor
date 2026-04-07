import Database from "better-sqlite3";
import { logger } from "../../logging/logger";
import { LifecycleService } from "../../services/service-registry";
import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { MessageStorageEventConsumer } from "./event-consumer";
import { MessageStorageRepository } from "./repository";
import { applyMessageStorageSchema } from "./schema";

export class MessageStorageService implements LifecycleService {
  private readonly repository: MessageStorageRepository;
  private readonly consumer: MessageStorageEventConsumer;

  public constructor(private readonly db: Database.Database) {
    this.repository = new MessageStorageRepository(db);
    this.consumer = new MessageStorageEventConsumer(this.repository);
  }

  public async start(): Promise<void> {
    applyMessageStorageSchema(this.db);
    logger.info("Message storage service started");
  }

  public async stop(): Promise<void> {
    logger.info("Message storage service stopped");
  }

  public getEventPublisher(): IWhatsAppEventPublisher {
    return this.consumer;
  }
}
