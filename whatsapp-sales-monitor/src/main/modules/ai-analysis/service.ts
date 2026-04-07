import { env } from "../../config/env";
import { logger } from "../../logging/logger";

export class AiAnalysisService {
  public readonly provider = "ollama";
  public readonly host = env.OLLAMA_HOST;
  public readonly model = env.OLLAMA_MODEL;

  public async start(): Promise<void> {
    logger.info({ model: this.model, host: this.host }, "AI analysis service ready");
  }

  public async stop(): Promise<void> {
    logger.info("AI analysis service stopped");
  }
}
