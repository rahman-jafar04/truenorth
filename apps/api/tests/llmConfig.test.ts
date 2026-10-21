import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getLlmConfig } from "../src/config/env";

describe("LLM Configuration & Groq Provider Resolution", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
    delete process.env.LLM_ENDPOINT;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should treat placeholder keys as unconfigured (undefined) for safe local fallback", () => {
    process.env.GROQ_API_KEY = "your-groq-api-key";
    const config = getLlmConfig();
    expect(config.apiKey).toBeUndefined();
  });

  it("should resolve Groq provider and default to llama-3.3-70b-versatile when GROQ_API_KEY is provided", () => {
    process.env.GROQ_API_KEY = "gsk_test_groq_key_123456";
    const config = getLlmConfig();

    expect(config.apiKey).toBe("gsk_test_groq_key_123456");
    expect(config.provider).toBe("groq");
    expect(config.endpoint).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(config.model).toBe("llama-3.3-70b-versatile");
  });

  it("should auto-detect Groq when LLM_API_KEY starts with gsk_", () => {
    process.env.LLM_API_KEY = "gsk_live_another_groq_key";
    const config = getLlmConfig();

    expect(config.apiKey).toBe("gsk_live_another_groq_key");
    expect(config.provider).toBe("groq");
    expect(config.endpoint).toBe("https://api.groq.com/openai/v1/chat/completions");
  });

  it("should respect custom model override for Groq (e.g. llama-3.1-8b-instant)", () => {
    process.env.GROQ_API_KEY = "gsk_custom_model_key";
    process.env.LLM_MODEL = "llama-3.1-8b-instant";
    const config = getLlmConfig();

    expect(config.model).toBe("llama-3.1-8b-instant");
  });

  it("should support OpenAI when explicitly configured", () => {
    process.env.LLM_PROVIDER = "openai";
    process.env.LLM_API_KEY = "sk-proj-openai-key";
    const config = getLlmConfig();

    expect(config.provider).toBe("openai");
    expect(config.endpoint).toBe("https://api.openai.com/v1/chat/completions");
    expect(config.model).toBe("gpt-4o-mini");
  });
});
