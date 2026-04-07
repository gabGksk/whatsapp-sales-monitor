import Database from "better-sqlite3";
import { ConversationSnapshot, SellerPerformanceSnapshot } from "./types";

export class RealTimeIntelligenceRepository {
  public constructor(private readonly db: Database.Database) {}

  public getConversationSnapshot(conversationId: string): ConversationSnapshot | null {
    const row = this.db
      .prepare(
        `
        SELECT
          c.id AS conversation_id,
          c.seller_id,
          s.name AS seller_name,
          c.current_lead_outcome,
          c.lost_reason,
          c.last_message_at,
          MAX(CASE WHEN m.direction = 'inbound' THEN m.timestamp END) AS last_inbound_at,
          MAX(CASE WHEN m.direction = 'outbound' THEN m.timestamp END) AS last_outbound_at,
          SUM(CASE WHEN m.direction = 'inbound' THEN 1 ELSE 0 END) AS inbound_count,
          SUM(CASE WHEN m.direction = 'outbound' THEN 1 ELSE 0 END) AS outbound_count,
          COALESCE((
            SELECT m2.message_text
            FROM messages m2
            WHERE m2.conversation_id = c.id AND m2.direction = 'inbound'
            ORDER BY m2.timestamp DESC
            LIMIT 1
          ), '') AS recent_inbound_text,
          COALESCE((
            SELECT m3.message_text
            FROM messages m3
            WHERE m3.conversation_id = c.id AND m3.direction = 'outbound'
            ORDER BY m3.timestamp DESC
            LIMIT 1
          ), '') AS recent_outbound_text
        FROM conversations c
        JOIN sellers s ON s.id = c.seller_id
        LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.id = ?
        GROUP BY c.id, c.seller_id, s.name, c.current_lead_outcome, c.lost_reason, c.last_message_at
      `,
      )
      .get(conversationId) as
      | {
          conversation_id: string;
          seller_id: string;
          seller_name: string;
          current_lead_outcome: string;
          lost_reason: string | null;
          last_message_at: string;
          last_inbound_at: number | null;
          last_outbound_at: number | null;
          inbound_count: number | null;
          outbound_count: number | null;
          recent_inbound_text: string;
          recent_outbound_text: string;
        }
      | undefined;

    if (!row) return null;

    const hasQuestionPending =
      row.recent_inbound_text.includes("?") &&
      (!row.last_outbound_at || (row.last_inbound_at ?? 0) > row.last_outbound_at);

    return {
      conversationId: row.conversation_id,
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      currentOutcome: row.current_lead_outcome,
      lostReason: row.lost_reason,
      lastMessageAt: row.last_message_at,
      lastInboundAt: row.last_inbound_at,
      lastOutboundAt: row.last_outbound_at,
      inboundCount: row.inbound_count ?? 0,
      outboundCount: row.outbound_count ?? 0,
      recentInboundText: row.recent_inbound_text,
      recentOutboundText: row.recent_outbound_text,
      hasQuestionPending,
    };
  }

  public listRecentConversations(limit = 200): ConversationSnapshot[] {
    const ids = this.db
      .prepare(
        `
        SELECT id FROM conversations
        ORDER BY last_message_at DESC
        LIMIT ?
      `,
      )
      .all(limit) as Array<{ id: string }>;

    return ids
      .map((row) => this.getConversationSnapshot(row.id))
      .filter((value): value is ConversationSnapshot => Boolean(value));
  }

  public listSellerPerformanceSnapshots(windowDays = 14): SellerPerformanceSnapshot[] {
    const rows = this.db
      .prepare(
        `
        SELECT
          s.id AS seller_id,
          s.name AS seller_name,
          AVG(CAST(json_extract(lo.raw_payload_json, '$.seller_score') AS REAL)) AS avg_score,
          SUM(CASE WHEN lo.outcome = 'lost' THEN 1 ELSE 0 END) AS lost_count
        FROM sellers s
        LEFT JOIN lead_outcomes lo
          ON lo.seller_id = s.id
          AND lo.occurred_at >= datetime('now', '-' || ? || ' days')
        GROUP BY s.id, s.name
      `,
      )
      .all(windowDays) as Array<{
      seller_id: string;
      seller_name: string;
      avg_score: number | null;
      lost_count: number | null;
    }>;

    return rows.map((row) => ({
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      avgSellerScore: Number((row.avg_score ?? 0).toFixed(2)),
      recentLostLeads: row.lost_count ?? 0,
    }));
  }
}
