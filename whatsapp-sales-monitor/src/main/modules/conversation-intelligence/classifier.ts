import { env } from "../../config/env";
import { buildConversationClassificationPrompt } from "./prompts";
import {
  ClassificationInput,
  ClassificationResult,
  ConversationMessage,
  LossReason,
  ResponseQuality,
  SellerMetricBreakdown,
} from "./types";
import { z } from "zod";

const classifierSchema = z.object({
  conversation_id: z.string().min(1),
  outcome: z.enum(["converted", "lost", "pending", "no-response"]),
  reason: z.enum([
    "price",
    "no network availability",
    "low credit score",
    "competitor",
    "no interest",
    "delayed response",
    "no follow-up",
    "customer stopped responding",
    "other",
  ]),
  seller_score: z.number().min(0).max(100),
  response_quality: z.enum(["excellent", "good", "average", "poor"]),
  summary: z.string().min(1).max(280),
  confidence: z.number().min(0).max(1),
});

interface OllamaGenerateResponse {
  response: string;
}

export class ConversationClassifier {
  public async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const metrics = this.calculateSellerMetrics(input.messages);
    const prompt = buildConversationClassificationPrompt(input, metrics);
    const raw = await this.generateFromOllama(prompt);
    const parsed = this.parseStrictResult(raw);

    return {
      ...parsed,
      seller_score: Math.round(metrics.overallSellerScore),
      response_quality: this.responseQualityFromScore(metrics.overallSellerScore),
    };
  }

  public calculateSellerMetrics(messages: ConversationMessage[]): SellerMetricBreakdown {
    const outbound = messages.filter((message) => message.direction === "outbound");
    const inbound = messages.filter((message) => message.direction === "inbound");

    const responseSpeedScore = this.computeResponseSpeed(outbound, inbound);
    const followUpConsistency = this.computeFollowUpConsistency(outbound);
    const closingAttemptDetection = this.computeClosingAttempt(outbound);
    const objectionHandlingQuality = this.computeObjectionHandling(messages);

    const overallSellerScore = Math.max(
      0,
      Math.min(
        100,
        responseSpeedScore +
          followUpConsistency +
          closingAttemptDetection +
          objectionHandlingQuality,
      ),
    );

    return {
      responseSpeedScore,
      followUpConsistency,
      closingAttemptDetection,
      objectionHandlingQuality,
      overallSellerScore,
    };
  }

  private async generateFromOllama(prompt: string): Promise<string> {
    const response = await fetch(`${env.OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response;
  }

  private parseStrictResult(raw: string): ClassificationResult {
    const parsedJson = JSON.parse(raw) as unknown;
    return classifierSchema.parse(parsedJson);
  }

  private computeResponseSpeed(
    outbound: ConversationMessage[],
    inbound: ConversationMessage[],
  ): number {
    if (outbound.length === 0 || inbound.length === 0) return 0;

    let totalGapMinutes = 0;
    let samples = 0;
    for (const customerMsg of inbound) {
      const firstSellerReply = outbound.find(
        (sellerMsg) => sellerMsg.timestamp > customerMsg.timestamp,
      );
      if (!firstSellerReply) continue;
      totalGapMinutes += (firstSellerReply.timestamp - customerMsg.timestamp) / 60000;
      samples += 1;
    }

    if (samples === 0) return 0;
    const avgGap = totalGapMinutes / samples;
    if (avgGap <= 2) return 25;
    if (avgGap <= 10) return 20;
    if (avgGap <= 30) return 15;
    if (avgGap <= 120) return 8;
    return 3;
  }

  private computeFollowUpConsistency(outbound: ConversationMessage[]): number {
    if (outbound.length === 0) return 0;
    if (outbound.length >= 8) return 25;
    if (outbound.length >= 5) return 20;
    if (outbound.length >= 3) return 14;
    if (outbound.length >= 2) return 8;
    return 4;
  }

  private computeClosingAttempt(outbound: ConversationMessage[]): number {
    const closeKeywords = [
      "fechar",
      "concluir",
      "pagamento",
      "assinatura",
      "aprovar",
      "proposta",
      "documento",
      "vamos finalizar",
    ];

    const attempts = outbound.filter((message) =>
      closeKeywords.some((keyword) =>
        message.messageText.toLocaleLowerCase().includes(keyword),
      ),
    ).length;

    if (attempts >= 3) return 25;
    if (attempts === 2) return 18;
    if (attempts === 1) return 10;
    return 3;
  }

  private computeObjectionHandling(messages: ConversationMessage[]): number {
    const objections = ["caro", "sem interesse", "concorrente", "limite", "score"];
    const responses = ["entendo", "podemos", "alternativa", "opcao", "condicao"];

    let handled = 0;
    for (let index = 0; index < messages.length - 1; index += 1) {
      const current = messages[index];
      if (current.direction !== "inbound") continue;
      const hasObjection = objections.some((token) =>
        current.messageText.toLocaleLowerCase().includes(token),
      );
      if (!hasObjection) continue;

      const next = messages[index + 1];
      if (!next || next.direction !== "outbound") continue;
      const hasHandled = responses.some((token) =>
        next.messageText.toLocaleLowerCase().includes(token),
      );
      if (hasHandled) handled += 1;
    }

    if (handled >= 3) return 25;
    if (handled === 2) return 18;
    if (handled === 1) return 10;
    return 5;
  }

  private responseQualityFromScore(score: number): ResponseQuality {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "average";
    return "poor";
  }
}
