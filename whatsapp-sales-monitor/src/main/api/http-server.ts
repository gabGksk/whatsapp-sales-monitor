import { createServer, ServerResponse } from "node:http";
import Database from "better-sqlite3";
import { env } from "../config/env";
import { logger } from "../logging/logger";
import {
  getConversionFunnel,
  getLossReasons,
  getOverview,
  getRecentConversations,
  getResponseTime,
  getSellersRanking,
  parseDashboardFilters,
} from "./dashboard-endpoints";
import { RealTimeIntelligenceService } from "../modules/real-time-intelligence/service";

const writeJson = (res: ServerResponse, statusCode: number, body: unknown): void => {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

export const startHttpServer = (
  db: Database.Database,
  realTimeIntelligenceService: RealTimeIntelligenceService,
) => {
  const server = createServer((req, res) => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${env.APP_PORT}`);
    const filters = parseDashboardFilters(url);

    if (method === "GET" && url.pathname === "/health") {
      writeJson(res, 200, { status: "ok" });
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/overview") {
      writeJson(res, 200, getOverview(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/sellers-ranking") {
      writeJson(res, 200, getSellersRanking(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/loss-reasons") {
      writeJson(res, 200, getLossReasons(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/conversion-funnel") {
      writeJson(res, 200, getConversionFunnel(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/response-time") {
      writeJson(res, 200, getResponseTime(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/conversations/recent") {
      writeJson(res, 200, getRecentConversations(db, filters));
      return;
    }

    if (method === "GET" && url.pathname === "/dashboard/alerts/active") {
      writeJson(res, 200, { items: realTimeIntelligenceService.getActiveAlerts() });
      return;
    }

    writeJson(res, 404, { message: "not found" });
  });

  server.listen(env.APP_PORT, "127.0.0.1", () => {
    logger.info({ port: env.APP_PORT }, "HTTP server started");
  });

  return server;
};
