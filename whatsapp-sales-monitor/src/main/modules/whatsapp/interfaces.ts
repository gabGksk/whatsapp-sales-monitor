import {
  IncomingMessagePayload,
  MessageStatusPayload,
  OutgoingMessagePayload,
  SessionConfig,
  SessionStatus,
  WhatsAppSessionState,
} from "./types";

export interface IProviderSessionEventHandlers {
  onStateChanged?: (
    sessionId: string,
    previousState: WhatsAppSessionState,
    currentState: WhatsAppSessionState,
  ) => Promise<void> | void;
  onQrCode?: (sessionId: string, qr: string) => Promise<void> | void;
  onIncomingMessage?: (
    payload: IncomingMessagePayload,
  ) => Promise<void> | void;
  onOutgoingMessage?: (
    payload: OutgoingMessagePayload,
  ) => Promise<void> | void;
  onMessageStatusUpdated?: (
    payload: MessageStatusPayload,
  ) => Promise<void> | void;
}

/**
 * Provider boundary.
 * Initial implementation target: whatsapp-web.js.
 */
export interface IWhatsAppProvider {
  initialize(config: SessionConfig): Promise<void>;
  connect(sessionId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
  reconnect(sessionId: string): Promise<void>;
  destroy(sessionId: string): Promise<void>;
  getSessionStatus(sessionId: string): Promise<SessionStatus | null>;
  onSessionEvents(
    sessionId: string,
    handlers: IProviderSessionEventHandlers,
  ): Promise<void>;
}

export interface ISessionManager {
  initialize(): Promise<void>;
  createSession(config: SessionConfig): Promise<SessionStatus>;
  destroySession(sessionId: string): Promise<SessionStatus | null>;
  reconnectSession(sessionId: string): Promise<SessionStatus | null>;
  getSessionStatus(sessionId: string): Promise<SessionStatus | null>;
}

export interface IWhatsAppEventPublisher {
  publish<TPayload>(eventName: string, payload: TPayload): Promise<void>;
}
