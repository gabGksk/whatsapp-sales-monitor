import Database from "better-sqlite3";
import { logger } from "../../logging/logger";
import { LifecycleService } from "../../services/service-registry";
import { IWhatsAppEventPublisher } from "../whatsapp/interfaces";
import { AlertGenerator } from "./alert-generator";
import { RealTimeIntelligenceEventConsumer } from "./event-consumer";
import { RealTimeIntelligenceRepository } from "./repository";
import { RulesEngine } from "./rules-engine";
import { AlertConfig, AlertRecord } from "./types";

const defaultConfig: AlertConfig = {
  delayedResponseSlaMinutes: 10,
  highRiskThreshold: 65,
  noFollowUpMinutes: 10,
  inactivityRiskMinutes: 30,
};

export class RealTimeIntelligenceService implements LifecycleService {
  private readonly repository: RealTimeIntelligenceRepository;
  private readonly rulesEngine: RulesEngine;
  private readonly alertGenerator: AlertGenerator;
  private readonly consumer: RealTimeIntelligenceEventConsumer;
  private sweepTimer: NodeJS.Timeout | null = null;

  public constructor(db: Database.Database, private readonly config: AlertConfig = defaultConfig) {
    this.repository = new RealTimeIntelligenceRepository(db);
    this.rulesEngine = new RulesEngine(config);
    this.alertGenerator = new AlertGenerator();
    this.consumer = new RealTimeIntelligenceEventConsumer(this);
  }

  public async start(): Promise<void> {
    this.runPeriodicSweep();
    this.sweepTimer = setInterval(() => this.runPeriodicSweep(), 60_000);
    logger.info({ config: this.config }, "Real-time intelligence service started");
  }

  public async stop(): Promise<void> {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    logger.info("Real-time intelligence service stopped");
  }

  public getEventPublisher(): IWhatsAppEventPublisher {
    return this.consumer;
  }

  public getActiveAlerts(): AlertRecord[] {
    return this.alertGenerator.listActive();
  }

  public evaluateConversation(conversationId: string): void {
    const snapshot = this.repository.getConversationSnapshot(conversationId);
    if (!snapshot) return;
    const alerts = this.rulesEngine.evaluateConversation(snapshot, Date.now());
    this.alertGenerator.upsert(alerts);
  }

  private runPeriodicSweep(): void {
    const nowMs = Date.now();
    const conversations = this.repository.listRecentConversations(300);
    for (const conversation of conversations) {
      const alerts = this.rulesEngine.evaluateConversation(conversation, nowMs);
      this.alertGenerator.upsert(alerts);
    }

    const sellerSnapshots = this.repository.listSellerPerformanceSnapshots(14);
    for (const seller of sellerSnapshots) {
      const alerts = this.rulesEngine.evaluateSellerPerformance(seller, nowMs);
      this.alertGenerator.upsert(alerts);
    }
  }
}
