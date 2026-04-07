export interface LifecycleService {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export class ServiceRegistry {
  private readonly services: LifecycleService[] = [];

  public register(service: LifecycleService): void {
    this.services.push(service);
  }

  public async startAll(): Promise<void> {
    for (const service of this.services) {
      await service.start();
    }
  }

  public async stopAll(): Promise<void> {
    for (const service of [...this.services].reverse()) {
      await service.stop();
    }
  }
}
