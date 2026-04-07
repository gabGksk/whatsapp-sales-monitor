import {
  IncomingMessagePayload,
  MessageStatusPayload,
  OutgoingMessagePayload,
  SessionQrPayload,
  SessionStatus,
  WhatsAppSessionState,
} from "./types";

export type WhatsAppEventName =
  | "whatsapp.session.initialized"
  | "whatsapp.session.state-changed"
  | "whatsapp.session.qr-required"
  | "whatsapp.session.reconnected"
  | "whatsapp.session.destroyed"
  | "whatsapp.message.received"
  | "whatsapp.message.outgoing"
  | "whatsapp.message.status-updated";

export interface WhatsAppEventEnvelope<TPayload> {
  eventId: string;
  eventName: WhatsAppEventName;
  occurredAt: string;
  sessionId: string;
  payload: TPayload;
}

export type SessionInitializedEvent = WhatsAppEventEnvelope<SessionStatus>;

export interface SessionStateChangedPayload {
  previousState: WhatsAppSessionState;
  currentState: WhatsAppSessionState;
  status: SessionStatus;
}

export type SessionStateChangedEvent =
  WhatsAppEventEnvelope<SessionStateChangedPayload>;

export type SessionQrRequiredEvent = WhatsAppEventEnvelope<SessionQrPayload>;

export type SessionReconnectedEvent = WhatsAppEventEnvelope<SessionStatus>;

export type SessionDestroyedEvent = WhatsAppEventEnvelope<SessionStatus>;

export type MessageReceivedEvent =
  WhatsAppEventEnvelope<IncomingMessagePayload>;

export type MessageOutgoingEvent =
  WhatsAppEventEnvelope<OutgoingMessagePayload>;

export type MessageStatusUpdatedEvent =
  WhatsAppEventEnvelope<MessageStatusPayload>;

export type WhatsAppDomainEvent =
  | SessionInitializedEvent
  | SessionStateChangedEvent
  | SessionQrRequiredEvent
  | SessionReconnectedEvent
  | SessionDestroyedEvent
  | MessageReceivedEvent
  | MessageOutgoingEvent
  | MessageStatusUpdatedEvent;
