import { createSqliteConnection } from "../database/sqlite";
import { runMigrations } from "../database/migrations";
import { AiAnalysisService } from "../modules/ai-analysis/service";
import { DashboardService } from "../modules/dashboard/service";
import { RealTimeIntelligenceService } from "../modules/real-time-intelligence/service";
import { ServiceRegistry } from "./service-registry";

export const createAppServices = () => {
  const db = createSqliteConnection();
  runMigrations(db);

  const aiAnalysisService = new AiAnalysisService();
  const dashboardService = new DashboardService();
  const realTimeIntelligenceService = new RealTimeIntelligenceService(db);

  const serviceRegistry = new ServiceRegistry();
  serviceRegistry.register(aiAnalysisService);
  serviceRegistry.register(dashboardService);
  serviceRegistry.register(realTimeIntelligenceService);

  return {
    db,
    aiAnalysisService,
    dashboardService,
    realTimeIntelligenceService,
    serviceRegistry,
  };
};
