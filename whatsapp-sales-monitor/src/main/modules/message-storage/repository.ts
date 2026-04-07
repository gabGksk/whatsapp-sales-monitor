import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import {
  IncomingMessagePayload,
  MessageDeliveryState,
  MessageStatusPayload,
  OutgoingMessagePayload,
  SessionConfig,
  SessionStatus,
} from "../whatsapp/types";

export class MessageStorageRepository {
  public constructor(private readonly db: Database.Database) {}

  public upsertSeller(seller: SessionConfig["seller"]): void {
    const stmt = this.db.prepare(`
      INSERT INTO sellers (id, name, team)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        team = excluded.team
    `);
    stmt.run(seller.sellerId, seller.sellerName, seller.team ?? null);
  }

  public upsertSession(status: SessionStatus, storagePath: string | null): void {
    const stmt = this.db.prepare(`
      INSERT INTO whatsapp_sessions (
        id, seller_id, state, is_connected, has_active_qr, storage_path, updated_at, last_error
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        seller_id = excluded.seller_id,
        state = excluded.state,
        is_connected = excluded.is_connected,
        has_active_qr = excluded.has_active_qr,
        storage_path = excluded.storage_path,
        updated_at = excluded.updated_at,
        last_error = excluded.last_error
    `);
    stmt.run(
      status.sessionId,
      status.seller.sellerId,
      status.state,
      status.isConnected ? 1 : 0,
      status.hasActiveQr ? 1 : 0,
      storagePath,
      status.updatedAt,
      status.lastError ?? null,
    );
  }

  public upsertContact(contactExternalId: string): string {
    const existing = this.db
      .prepare("SELECT id FROM contacts WHERE external_contact_id = ?")
      .get(contactExternalId) as { id: string } | undefined;
    if (existing) return existing.id;

    const id = randomUUID();
    this.db
      .prepare(`
        INSERT INTO contacts (id, external_contact_id, display_name, phone)
        VALUES (?, ?, ?, ?)
      `)
      .run(id, contactExternalId, null, null);
    return id;
  }

  public upsertConversation(
    conversationId: string,
    sellerId: string,
    contactId: string,
    sessionId: string,
    messageTimestamp: number,
  ): void {
    const ts = new Date(messageTimestamp).toISOString();
    this.db
      .prepare(`
        INSERT INTO conversations (
          id, seller_id, contact_id, session_id, started_at, last_message_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          seller_id = excluded.seller_id,
          contact_id = excluded.contact_id,
          session_id = excluded.session_id,
          last_message_at = excluded.last_message_at
      `)
      .run(conversationId, sellerId, contactId, sessionId, ts, ts);
  }

  public persistMessage(
    payload: IncomingMessagePayload | OutgoingMessagePayload,
    direction: "inbound" | "outbound",
  ): string {
    const sellerId = payload.seller.sellerId;
    const contactExternalId = direction === "inbound" ? payload.from : payload.to;
    const contactId = this.upsertContact(contactExternalId);
    this.upsertConversation(
      payload.conversationId,
      sellerId,
      contactId,
      payload.sessionId,
      payload.timestamp,
    );

    const id = randomUUID();
    this.db
      .prepare(`
        INSERT INTO messages (
          id, provider_message_id, session_id, seller_id, contact_id, conversation_id,
          direction, message_text, timestamp, delivery_status, message_type, raw_payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, provider_message_id) DO UPDATE SET
          delivery_status = excluded.delivery_status,
          raw_payload_json = excluded.raw_payload_json
      `)
      .run(
        id,
        payload.providerMessageId,
        payload.sessionId,
        sellerId,
        contactId,
        payload.conversationId,
        direction,
        payload.body,
        payload.timestamp,
        this.defaultDeliveryStatus(direction),
        "text",
        JSON.stringify(payload),
      );

    const stored = this.db
      .prepare("SELECT id FROM messages WHERE session_id = ? AND provider_message_id = ?")
      .get(payload.sessionId, payload.providerMessageId) as { id: string };

    return stored.id;
  }

  public persistMessageStatus(payload: MessageStatusPayload): void {
    const message = this.db
      .prepare(`
        SELECT id
        FROM messages
        WHERE session_id = ? AND provider_message_id = ?
      `)
      .get(payload.sessionId, payload.providerMessageId) as { id: string } | undefined;
    if (!message) {
      return;
    }

    this.db
      .prepare(`
        UPDATE messages
        SET delivery_status = ?
        WHERE id = ?
      `)
      .run(payload.deliveryState, message.id);

    this.db
      .prepare(`
        INSERT INTO message_status_history (
          id, message_id, provider_message_id, session_id, seller_id, status, status_timestamp, raw_payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        randomUUID(),
        message.id,
        payload.providerMessageId,
        payload.sessionId,
        payload.seller.sellerId,
        payload.deliveryState,
        payload.statusTimestamp,
        JSON.stringify(payload),
      );
  }

  private defaultDeliveryStatus(direction: "inbound" | "outbound"): MessageDeliveryState {
    if (direction === "inbound") return "delivered";
    return "pending";
  }
}
