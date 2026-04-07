import { logger } from "../../logging/logger";
import { LifecycleService } from "../../services/service-registry";
import {
  ISessionManager,
  IWhatsAppEventPublisher,
  IWhatsAppProvider,
} from "./interfaces";
import { SessionManager } from "./session-manager";
import { SessionConfig, SessionStatus } from "./types";

class InMemoryWhatsAppEventPublisher implements IWhatsAppEventPublisher {
  public async publish<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    logger.debug({ eventName, payload }, "WhatsApp domain event published");
  }
}

/**
 * Provider boundary for whatsapp-web.js.
 * The concrete adapter should implement IWhatsAppProvider and be injected here.
 */
export class WhatsAppService implements LifecycleService {
  private readonly sessionManager: ISessionManager;

  public constructor(
    provider: IWhatsAppProvider,
    eventPublisher: IWhatsAppEventPublisher = new InMemoryWhatsAppEventPublisher(),
  ) {
    this.sessionManager = new SessionManager(
      provider,
      eventPublisher,
    );
  }

  public async start(): Promise<void> {
    await this.initialize();
    logger.info("WhatsApp service started");
  }

  public async stop(): Promise<void> {
    logger.info("WhatsApp service stopped");
  }

  public async initialize(): Promise<void> {
    await this.sessionManager.initialize();
  }

  public async createSession(config: SessionConfig): Promise<SessionStatus> {
    return this.sessionManager.createSession(config);
  }

  public async destroySession(sessionId: string): Promise<SessionStatus | null> {
    return this.sessionManager.destroySession(sessionId);
  }

  public async reconnectSession(sessionId: string): Promise<SessionStatus | null> {
    return this.sessionManager.reconnectSession(sessionId);
  }

  public async getSessionStatus(sessionId: string): Promise<SessionStatus | null> {
    return this.sessionManager.getSessionStatus(sessionId);
  }
}
