import { randomUUID } from "node:crypto";
import { logger } from "../../logging/logger";
import {
  IProviderSessionEventHandlers,
  ISessionManager,
  IWhatsAppEventPublisher,
  IWhatsAppProvider,
} from "./interfaces";
import { SessionConfig, SessionStatus, SessionQrPayload } from "./types";

export class SessionManager implements ISessionManager {
  private readonly sessions = new Map<string, SessionConfig>();

  public constructor(
    private readonly provider: IWhatsAppProvider,
    private readonly eventPublisher: IWhatsAppEventPublisher,
  ) {}

  public async initialize(): Promise<void> {
    logger.info("WhatsApp SessionManager initialized");
  }

  public async createSession(config: SessionConfig): Promise<SessionStatus> {
    this.sessions.set(config.sessionId, config);

    await this.provider.initialize(config);
    await this.provider.onSessionEvents(
      config.sessionId,
      this.buildProviderHandlers(config.sessionId),
    );
    await this.provider.connect(config.sessionId);

    const status = await this.provider.getSessionStatus(config.sessionId);
    if (!status) {
      throw new Error(`Session status unavailable for ${config.sessionId}`);
    }

    await this.eventPublisher.publish("whatsapp.session.initialized", {
      eventId: randomUUID(),
      eventName: "whatsapp.session.initialized",
      occurredAt: new Date().toISOString(),
      sessionId: config.sessionId,
      payload: status,
    });

    return status;
  }

  public async destroySession(sessionId: string): Promise<SessionStatus | null> {
    const current = await this.provider.getSessionStatus(sessionId);
    if (!current) {
      return null;
    }

    await this.provider.destroy(sessionId);
    this.sessions.delete(sessionId);

    const status = await this.provider.getSessionStatus(sessionId);
    return status ?? null;
  }

  public async reconnectSession(sessionId: string): Promise<SessionStatus | null> {
    const current = await this.provider.getSessionStatus(sessionId);
    if (!current) {
      return null;
    }

    await this.provider.reconnect(sessionId);
    return this.provider.getSessionStatus(sessionId);
  }

  public async getSessionStatus(sessionId: string): Promise<SessionStatus | null> {
    return this.provider.getSessionStatus(sessionId);
  }

  private buildProviderHandlers(sessionId: string): IProviderSessionEventHandlers {
    return {
      onStateChanged: async (sid, previousState, currentState) => {
        const status = await this.provider.getSessionStatus(sid);
        if (!status) {
          return;
        }

        await this.eventPublisher.publish("whatsapp.session.state-changed", {
          eventId: randomUUID(),
          eventName: "whatsapp.session.state-changed",
          occurredAt: new Date().toISOString(),
          sessionId,
          payload: {
            previousState,
            currentState,
            status,
          },
        });
      },
      onQrCode: async (sid, qr) => {
        const status = await this.provider.getSessionStatus(sid);
        if (!status) {
          return;
        }

        const payload: SessionQrPayload = {
          sessionId: sid,
          seller: status.seller,
          qr,
          generatedAt: new Date().toISOString(),
        };

        await this.eventPublisher.publish("whatsapp.session.qr-required", {
          eventId: randomUUID(),
          eventName: "whatsapp.session.qr-required",
          occurredAt: new Date().toISOString(),
          sessionId,
          payload,
        });
      },
      onIncomingMessage: async (payload) => {
        await this.eventPublisher.publish("whatsapp.message.received", {
          eventId: randomUUID(),
          eventName: "whatsapp.message.received",
          occurredAt: new Date().toISOString(),
          sessionId,
          payload,
        });
      },
      onOutgoingMessage: async (payload) => {
        await this.eventPublisher.publish("whatsapp.message.outgoing", {
          eventId: randomUUID(),
          eventName: "whatsapp.message.outgoing",
          occurredAt: new Date().toISOString(),
          sessionId,
          payload,
        });
      },
      onMessageStatusUpdated: async (payload) => {
        await this.eventPublisher.publish("whatsapp.message.status-updated", {
          eventId: randomUUID(),
          eventName: "whatsapp.message.status-updated",
          occurredAt: new Date().toISOString(),
          sessionId,
          payload,
        });
      },
    };
  }
}
