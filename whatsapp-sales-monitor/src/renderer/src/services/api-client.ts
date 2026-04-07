const API_BASE = "http://127.0.0.1:3960";

export const apiClient = {
  async health(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error("Health endpoint unavailable");
    return (await response.json()) as { status: string };
  },
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${path}`);
    }
    return (await response.json()) as T;
  },
};
