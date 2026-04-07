import { randomUUID } from "node:crypto";
import { AlertConfig, AlertRecord, ConversationSnapshot, SellerPerformanceSnapshot } from "./types";

const containsAny = (text: string, terms: string[]): boolean => {
  const normalized = text.toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term));
};

export class RulesEngine {
  public constructor(private readonly config: AlertConfig) {}

  public evaluateConversation(snapshot: ConversationSnapshot, nowMs: number): AlertRecord[] {
    const alerts: AlertRecord[] = [];
    const openTs = new Date(nowMs).toISOString();

    if (snapshot.lastInboundAt && (!snapshot.lastOutboundAt || snapshot.lastOutboundAt < snapshot.lastInboundAt)) {
      const waitMinutes = (nowMs - snapshot.lastInboundAt) / 60000;
      if (waitMinutes >= this.config.delayedResponseSlaMinutes) {
        alerts.push({
          id: randomUUID(),
          type: "delayed-response",
          priority: waitMinutes >= 15 ? "critical" : waitMinutes >= 10 ? "high" : "medium",
          title: "Delayed response",
          description: `Lead waiting ${Math.floor(waitMinutes)} min without seller reply.`,
          sellerId: snapshot.sellerId,
          sellerName: snapshot.sellerName,
          conversationId: snapshot.conversationId,
          openedAt: openTs,
          updatedAt: openTs,
          riskScore: Math.min(100, Math.floor(waitMinutes * 4)),
        });
      }
    }

    const inbound = snapshot.recentInboundText.toLocaleLowerCase();
    const objectionTokens = ["caro", "preco", "preço", "concorrente", "mais barato"];
    const negativeTokens = ["nao gostei", "não gostei", "ruim", "difícil", "desisti"];
    const networkTokens = ["sem rede", "nao atende", "não atende", "viabilidade"];
    const hotTokens = ["instalacao", "instalação", "pagamento", "pix", "boleto", "agendar"];

    const inactivityMinutes = snapshot.lastMessageAt
      ? (nowMs - new Date(snapshot.lastMessageAt).getTime()) / 60000
      : 0;
    const riskScore = Math.min(
      100,
      (containsAny(inbound, negativeTokens) ? 35 : 0) +
        (inactivityMinutes >= this.config.inactivityRiskMinutes ? 30 : 0) +
        (containsAny(inbound, objectionTokens) ? 35 : 0),
    );
    if (riskScore >= this.config.highRiskThreshold) {
      alerts.push({
        id: randomUUID(),
        type: "high-risk-lead-loss",
        priority: riskScore >= 85 ? "critical" : "high",
        title: "High risk lead loss",
        description: `Risk score ${riskScore}/100 due to objections, sentiment, and inactivity.`,
        sellerId: snapshot.sellerId,
        sellerName: snapshot.sellerName,
        conversationId: snapshot.conversationId,
        openedAt: openTs,
        updatedAt: openTs,
        riskScore,
      });
    }

    if (snapshot.hasQuestionPending && snapshot.lastInboundAt) {
      const waitMinutes = (nowMs - snapshot.lastInboundAt) / 60000;
      if (waitMinutes >= this.config.noFollowUpMinutes) {
        alerts.push({
          id: randomUUID(),
          type: "no-follow-up",
          priority: "high",
          title: "No follow-up detected",
          description: "Customer asked a question and seller has not replied.",
          sellerId: snapshot.sellerId,
          sellerName: snapshot.sellerName,
          conversationId: snapshot.conversationId,
          openedAt: openTs,
          updatedAt: openTs,
          riskScore: Math.min(100, Math.floor(waitMinutes * 5)),
        });
      }
    }

    if (containsAny(inbound, objectionTokens)) {
      alerts.push({
        id: randomUUID(),
        type: "price-objection-risk",
        priority: "medium",
        title: "Price objection risk",
        description: "Customer mentioned price pressure or competitor pricing.",
        sellerId: snapshot.sellerId,
        sellerName: snapshot.sellerName,
        conversationId: snapshot.conversationId,
        openedAt: openTs,
        updatedAt: openTs,
        riskScore: 65,
      });
    }

    if (containsAny(inbound, networkTokens)) {
      alerts.push({
        id: randomUUID(),
        type: "network-availability-loss",
        priority: "high",
        title: "Network availability risk",
        description: "Customer reported coverage/feasibility limitations.",
        sellerId: snapshot.sellerId,
        sellerName: snapshot.sellerName,
        conversationId: snapshot.conversationId,
        openedAt: openTs,
        updatedAt: openTs,
        riskScore: 80,
      });
    }

    if (containsAny(inbound, hotTokens)) {
      alerts.push({
        id: randomUUID(),
        type: "conversion-opportunity",
        priority: "high",
        title: "Conversion opportunity",
        description: "Hot lead intent detected for installation/payment next step.",
        sellerId: snapshot.sellerId,
        sellerName: snapshot.sellerName,
        conversationId: snapshot.conversationId,
        openedAt: openTs,
        updatedAt: openTs,
        riskScore: 88,
      });
    }

    return alerts;
  }

  public evaluateSellerPerformance(snapshot: SellerPerformanceSnapshot, nowMs: number): AlertRecord[] {
    const openTs = new Date(nowMs).toISOString();
    const alerts: AlertRecord[] = [];
    if (snapshot.avgSellerScore < 45 || snapshot.recentLostLeads >= 5) {
      alerts.push({
        id: randomUUID(),
        type: "seller-underperformance",
        priority: snapshot.avgSellerScore < 35 ? "critical" : "high",
        title: "Seller underperformance",
        description: `Low score trend (${snapshot.avgSellerScore}) or repeated lost leads (${snapshot.recentLostLeads}).`,
        sellerId: snapshot.sellerId,
        sellerName: snapshot.sellerName,
        conversationId: null,
        openedAt: openTs,
        updatedAt: openTs,
        riskScore: Math.min(100, 100 - snapshot.avgSellerScore + snapshot.recentLostLeads * 5),
      });
    }
    return alerts;
  }
}
