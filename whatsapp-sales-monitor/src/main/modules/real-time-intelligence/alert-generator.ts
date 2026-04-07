import { AlertRecord } from "./types";

export class AlertGenerator {
  private readonly active = new Map<string, AlertRecord>();

  public upsert(alerts: AlertRecord[]): void {
    const now = new Date().toISOString();
    for (const alert of alerts) {
      const key = this.key(alert);
      const existing = this.active.get(key);
      if (existing) {
        this.active.set(key, {
          ...existing,
          description: alert.description,
          priority: alert.priority,
          riskScore: alert.riskScore,
          updatedAt: now,
        });
      } else {
        this.active.set(key, { ...alert, openedAt: now, updatedAt: now });
      }
    }
  }

  public listActive(): AlertRecord[] {
    return [...this.active.values()].sort((a, b) => {
      const severity = this.priorityWeight(b.priority) - this.priorityWeight(a.priority);
      if (severity !== 0) return severity;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  private key(alert: AlertRecord): string {
    return `${alert.type}:${alert.sellerId}:${alert.conversationId ?? "seller"}`;
  }

  private priorityWeight(priority: AlertRecord["priority"]): number {
    switch (priority) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      default:
        return 1;
    }
  }
}
