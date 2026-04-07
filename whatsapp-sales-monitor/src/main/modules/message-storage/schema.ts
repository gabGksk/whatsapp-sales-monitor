import Database from "better-sqlite3";

export const MESSAGE_STORAGE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  state TEXT NOT NULL,
  is_connected INTEGER NOT NULL DEFAULT 0,
  has_active_qr INTEGER NOT NULL DEFAULT 0,
  storage_path TEXT,
  updated_at TEXT NOT NULL,
  last_error TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  external_contact_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  current_lead_outcome TEXT NOT NULL DEFAULT 'pending',
  lost_reason TEXT,
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  provider_message_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  delivery_status TEXT NOT NULL,
  message_type TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  UNIQUE (session_id, provider_message_id)
);

CREATE TABLE IF NOT EXISTS message_status_history (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  provider_message_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  status TEXT NOT NULL,
  status_timestamp INTEGER NOT NULL,
  raw_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS lead_outcomes (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('pending', 'converted', 'lost', 'no-response')),
  lost_reason TEXT,
  source TEXT NOT NULL DEFAULT 'system',
  occurred_at TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_seller_timestamp
  ON messages (seller_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status
  ON messages (delivery_status, timestamp);

CREATE INDEX IF NOT EXISTS idx_lead_outcomes_seller_outcome_time
  ON lead_outcomes (seller_id, outcome, occurred_at);

CREATE INDEX IF NOT EXISTS idx_lead_outcomes_conversation
  ON lead_outcomes (conversation_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_last_message
  ON conversations (seller_id, last_message_at);

CREATE INDEX IF NOT EXISTS idx_conversations_contact
  ON conversations (contact_id, last_message_at);
`;

export const applyMessageStorageSchema = (db: Database.Database): void => {
  db.exec(MESSAGE_STORAGE_SCHEMA_SQL);
};
