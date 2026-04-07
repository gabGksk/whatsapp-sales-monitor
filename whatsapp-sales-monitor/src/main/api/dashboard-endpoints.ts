import Database from "better-sqlite3";

interface DashboardFilters {
  from: string | null;
  to: string | null;
  sellerId: string | null;
}

const buildWhere = (filters: DashboardFilters): { clause: string; params: unknown[] } => {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.from) {
    conditions.push("c.last_message_at >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push("c.last_message_at <= ?");
    params.push(filters.to);
  }
  if (filters.sellerId) {
    conditions.push("c.seller_id = ?");
    params.push(filters.sellerId);
  }

  if (conditions.length === 0) {
    return { clause: "", params };
  }

  return { clause: `WHERE ${conditions.join(" AND ")}`, params };
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[index];
};

export const parseDashboardFilters = (url: URL): DashboardFilters => ({
  from: url.searchParams.get("from"),
  to: url.searchParams.get("to"),
  sellerId: url.searchParams.get("sellerId"),
});

export const getOverview = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_leads,
        SUM(CASE WHEN c.current_lead_outcome = 'converted' THEN 1 ELSE 0 END) AS converted_leads,
        SUM(CASE WHEN c.current_lead_outcome = 'lost' THEN 1 ELSE 0 END) AS lost_leads
      FROM conversations c
      ${clause}
    `,
    )
    .get(...params) as {
    total_leads: number;
    converted_leads: number;
    lost_leads: number;
  };

  const scoreRow = db
    .prepare(
      `
      SELECT AVG(CAST(json_extract(lo.raw_payload_json, '$.seller_score') AS REAL)) AS avg_score
      FROM lead_outcomes lo
      JOIN conversations c ON c.id = lo.conversation_id
      ${clause}
    `,
    )
    .get(...params) as { avg_score: number | null };

  const firstResponseRows = db
    .prepare(
      `
      SELECT
        c.id AS conversation_id,
        MIN(CASE WHEN m.direction = 'inbound' THEN m.timestamp END) AS first_inbound_ts,
        MIN(CASE WHEN m.direction = 'outbound' THEN m.timestamp END) AS first_outbound_ts
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      ${clause}
      GROUP BY c.id
    `,
    )
    .all(...params) as Array<{
    first_inbound_ts: number | null;
    first_outbound_ts: number | null;
  }>;

  const responseMinutes = firstResponseRows
    .filter((r) => r.first_inbound_ts && r.first_outbound_ts && r.first_outbound_ts > r.first_inbound_ts)
    .map((r) => ((r.first_outbound_ts as number) - (r.first_inbound_ts as number)) / 60000);

  const totalLeads = row.total_leads ?? 0;
  const convertedLeads = row.converted_leads ?? 0;
  const lostLeads = row.lost_leads ?? 0;

  return {
    range: filters,
    totalLeads,
    convertedLeads,
    lostLeads,
    conversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
    averageSellerScore: Number((scoreRow.avg_score ?? 0).toFixed(2)),
    averageFirstResponseMinutes:
      responseMinutes.length > 0
        ? Number((responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length).toFixed(2))
        : 0,
  };
};

export const getSellersRanking = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const rows = db
    .prepare(
      `
      SELECT
        s.id AS seller_id,
        s.name AS seller_name,
        COUNT(DISTINCT c.id) AS leads_handled,
        SUM(CASE WHEN c.current_lead_outcome = 'converted' THEN 1 ELSE 0 END) AS converted_count,
        AVG(CAST(json_extract(lo.raw_payload_json, '$.seller_score') AS REAL)) AS avg_score
      FROM conversations c
      JOIN sellers s ON s.id = c.seller_id
      LEFT JOIN lead_outcomes lo ON lo.conversation_id = c.id
      ${clause}
      GROUP BY s.id, s.name
      ORDER BY avg_score DESC, leads_handled DESC
    `,
    )
    .all(...params) as Array<{
    seller_id: string;
    seller_name: string;
    leads_handled: number;
    converted_count: number;
    avg_score: number | null;
  }>;

  const responseBySeller = db
    .prepare(
      `
      SELECT
        c.seller_id,
        c.id AS conversation_id,
        MIN(CASE WHEN m.direction = 'inbound' THEN m.timestamp END) AS first_inbound_ts,
        MIN(CASE WHEN m.direction = 'outbound' THEN m.timestamp END) AS first_outbound_ts
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      ${clause}
      GROUP BY c.seller_id, c.id
    `,
    )
    .all(...params) as Array<{
    seller_id: string;
    first_inbound_ts: number | null;
    first_outbound_ts: number | null;
  }>;

  const avgResponseMap = new Map<string, number>();
  for (const row of rows) {
    const values = responseBySeller
      .filter((entry) => entry.seller_id === row.seller_id)
      .filter((entry) => entry.first_inbound_ts && entry.first_outbound_ts && entry.first_outbound_ts > entry.first_inbound_ts)
      .map((entry) => ((entry.first_outbound_ts as number) - (entry.first_inbound_ts as number)) / 60000);
    const avg =
      values.length > 0
        ? values.reduce((acc, value) => acc + value, 0) / values.length
        : 0;
    avgResponseMap.set(row.seller_id, avg);
  }

  return {
    items: rows.map((row) => ({
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      leadsHandled: row.leads_handled,
      conversionRate:
        row.leads_handled > 0
          ? Number(((row.converted_count / row.leads_handled) * 100).toFixed(2))
          : 0,
      averageScore: Number((row.avg_score ?? 0).toFixed(2)),
      averageResponseMinutes: Number((avgResponseMap.get(row.seller_id) ?? 0).toFixed(2)),
    })),
  };
};

export const getLossReasons = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const rows = db
    .prepare(
      `
      SELECT
        COALESCE(NULLIF(c.lost_reason, ''), 'other') AS reason,
        COUNT(*) AS count
      FROM conversations c
      ${clause} ${clause ? "AND" : "WHERE"} c.current_lead_outcome = 'lost'
      GROUP BY reason
      ORDER BY count DESC
    `,
    )
    .all(...params) as Array<{ reason: string; count: number }>;

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return {
    items: rows.map((row) => ({
      reason: row.reason,
      count: row.count,
      percentage: total > 0 ? Number(((row.count / total) * 100).toFixed(2)) : 0,
    })),
  };
};

export const getConversionFunnel = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const row = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN msg_count <= 1 THEN 1 ELSE 0 END) AS stage_new,
        SUM(CASE WHEN msg_count > 1 THEN 1 ELSE 0 END) AS stage_engaged,
        SUM(CASE WHEN has_proposal = 1 THEN 1 ELSE 0 END) AS stage_proposal,
        SUM(CASE WHEN current_lead_outcome = 'converted' THEN 1 ELSE 0 END) AS stage_converted,
        SUM(CASE WHEN current_lead_outcome = 'lost' THEN 1 ELSE 0 END) AS stage_lost
      FROM (
        SELECT
          c.id,
          c.current_lead_outcome,
          COUNT(m.id) AS msg_count,
          MAX(
            CASE WHEN m.direction = 'outbound' AND (
              LOWER(m.message_text) LIKE '%proposta%' OR
              LOWER(m.message_text) LIKE '%pagamento%' OR
              LOWER(m.message_text) LIKE '%fechar%' OR
              LOWER(m.message_text) LIKE '%assinatura%'
            ) THEN 1 ELSE 0 END
          ) AS has_proposal
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        ${clause}
        GROUP BY c.id, c.current_lead_outcome
      ) t
    `,
    )
    .get(...params) as {
    stage_new: number | null;
    stage_engaged: number | null;
    stage_proposal: number | null;
    stage_converted: number | null;
    stage_lost: number | null;
  };

  return {
    stages: [
      { stage: "new", count: row.stage_new ?? 0 },
      { stage: "engaged", count: row.stage_engaged ?? 0 },
      { stage: "proposal", count: row.stage_proposal ?? 0 },
      { stage: "converted", count: row.stage_converted ?? 0 },
      { stage: "lost", count: row.stage_lost ?? 0 },
    ],
  };
};

export const getResponseTime = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const rows = db
    .prepare(
      `
      SELECT
        c.id AS conversation_id,
        c.seller_id,
        s.name AS seller_name,
        MIN(CASE WHEN m.direction = 'inbound' THEN m.timestamp END) AS first_inbound_ts,
        MIN(CASE WHEN m.direction = 'outbound' THEN m.timestamp END) AS first_outbound_ts
      FROM conversations c
      JOIN sellers s ON s.id = c.seller_id
      JOIN messages m ON m.conversation_id = c.id
      ${clause}
      GROUP BY c.id, c.seller_id, s.name
    `,
    )
    .all(...params) as Array<{
    seller_id: string;
    seller_name: string;
    first_inbound_ts: number | null;
    first_outbound_ts: number | null;
  }>;

  const valid = rows
    .filter((r) => r.first_inbound_ts && r.first_outbound_ts && r.first_outbound_ts > r.first_inbound_ts)
    .map((r) => ({
      sellerId: r.seller_id,
      sellerName: r.seller_name,
      minutes: ((r.first_outbound_ts as number) - (r.first_inbound_ts as number)) / 60000,
    }));

  const values = valid.map((v) => v.minutes);
  const grouped = new Map<string, { sellerName: string; values: number[] }>();
  for (const item of valid) {
    const entry = grouped.get(item.sellerId) ?? {
      sellerName: item.sellerName,
      values: [],
    };
    entry.values.push(item.minutes);
    grouped.set(item.sellerId, entry);
  }

  return {
    summary: {
      averageFirstResponseMinutes:
        values.length > 0
          ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
          : 0,
      p50FirstResponseMinutes: Number(percentile(values, 0.5).toFixed(2)),
      p90FirstResponseMinutes: Number(percentile(values, 0.9).toFixed(2)),
    },
    bySeller: [...grouped.entries()].map(([sellerId, data]) => ({
      sellerId,
      sellerName: data.sellerName,
      averageFirstResponseMinutes: Number(
        (data.values.reduce((a, b) => a + b, 0) / data.values.length).toFixed(2),
      ),
    })),
  };
};

export const getRecentConversations = (db: Database.Database, filters: DashboardFilters) => {
  const { clause, params } = buildWhere(filters);
  const rows = db
    .prepare(
      `
      SELECT
        c.id AS conversation_id,
        c.seller_id,
        s.name AS seller_name,
        c.contact_id,
        c.last_message_at,
        c.current_lead_outcome,
        c.lost_reason,
        (
          SELECT m.message_text
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.timestamp DESC
          LIMIT 1
        ) AS last_message_text
      FROM conversations c
      JOIN sellers s ON s.id = c.seller_id
      ${clause}
      ORDER BY c.last_message_at DESC
      LIMIT 50
    `,
    )
    .all(...params) as Array<{
    conversation_id: string;
    seller_id: string;
    seller_name: string;
    contact_id: string;
    last_message_at: string;
    current_lead_outcome: string;
    lost_reason: string | null;
    last_message_text: string | null;
  }>;

  return {
    items: rows.map((row) => ({
      conversationId: row.conversation_id,
      sellerId: row.seller_id,
      sellerName: row.seller_name,
      contactId: row.contact_id,
      lastMessageAt: row.last_message_at,
      lastMessageText: row.last_message_text ?? "",
      outcome: row.current_lead_outcome,
      lostReason: row.lost_reason,
    })),
  };
};
