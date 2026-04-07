import { logger } from "../../logging/logger";

export class DashboardService {
  public async start(): Promise<void> {
    logger.info("Dashboard service ready");
  }

  public async stop(): Promise<void> {
    logger.info("Dashboard service stopped");
  }
}
