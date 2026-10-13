import {
  AiGuidanceResponse,
  SubmitThoughtInput,
  GoalResponse,
  CreateGoalInput,
  TaskResponse,
  CreateTaskInput,
  UpdateTaskInput,
  DailyReport
} from "@truenorth/shared";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private authToken: string | null = null;

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>)
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errorPayload = json?.error || {};
      throw new ApiError(
        errorPayload.code || "REQUEST_FAILED",
        errorPayload.message || `Request failed with status ${response.status}`,
        response.status,
        errorPayload.details
      );
    }

    return json as T;
  }

  // System Health
  async getHealth(): Promise<{ status: string; service: string; version: string; uptimeSeconds: number }> {
    return this.request("/health");
  }

  // Thoughts & AI Guidance
  async analyzeThought(input: SubmitThoughtInput): Promise<{ data: AiGuidanceResponse }> {
    return this.request("/thoughts/analyze", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  // Goals
  async getGoals(): Promise<{ data: GoalResponse[] }> {
    return this.request("/goals");
  }

  async createGoal(input: CreateGoalInput): Promise<{ data: GoalResponse }> {
    return this.request("/goals", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  // Tasks
  async getTasks(date?: string): Promise<{ data: TaskResponse[] }> {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return this.request(`/tasks${query}`);
  }

  async createTask(input: CreateTaskInput): Promise<{ data: TaskResponse }> {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<{ data: TaskResponse }> {
    return this.request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  // Reports
  async getDailyReport(date: string): Promise<{ data: DailyReport }> {
    return this.request(`/reports/daily?date=${encodeURIComponent(date)}`);
  }
}

export const apiClient = new ApiClient();
