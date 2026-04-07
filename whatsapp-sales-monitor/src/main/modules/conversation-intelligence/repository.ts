import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { ClassificationResult, ConversationMessage } from "./types";

export class ConversationIntelligenceRepository {
  public constructor(private readonly db: Database.Database) {}

  public listConversationMessages(
    conversationId: string,
    limit = 200,
  ): ConversationMessage[] {
    const rows = this.db
      .prepare(
        `
        SELECT id, conversation_id, seller_id, direction, message_text, timestamp
        FROM messages
        WHERE conversation_id = ?
        ORDER BY timestamp ASC
        LIMIT ?
      `,
      )
      .all(conversationId, limit) as Array<{
      id: string;
      conversation_id: string;
      seller_id: string;
      direction: "inbound" | "outbound";
      message_text: string;
      timestamp: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      sellerId: row.seller_id,
      direction: row.direction,
      messageText: row.message_text,
      timestamp: row.timestamp,
    }));
  }

  public upsertLeadOutcome(result: ClassificationResult, sellerId: string): void {
    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO lead_outcomes (
          id, conversation_id, seller_id, outcome, lost_reason, source, occurred_at, raw_payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        randomUUID(),
        result.conversation_id,
        sellerId,
        result.outcome,
        result.reason,
        "system",
        now,
        JSON.stringify(result),
      );

    this.db
      .prepare(
        `
        UPDATE conversations
        SET current_lead_outcome = ?, lost_reason = ?, last_message_at = COALESCE(last_message_at, ?)
        WHERE id = ?
      `,
      )
      .run(result.outcome, result.reason, now, result.conversation_id);
  }
}
