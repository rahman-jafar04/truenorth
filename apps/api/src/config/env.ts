import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/truenorth_dev"),
  SUPABASE_URL: z.string().default("https://placeholder-project.supabase.co"),
  SUPABASE_ANON_KEY: z.string().default("placeholder-anon-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("placeholder-service-role-key"),
  LLM_PROVIDER: z.string().default("groq"),
  LLM_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_ENDPOINT: z.string().optional()
});

export const env = EnvSchema.parse(process.env);

export interface LlmConfig {
  apiKey: string | undefined;
  provider: "groq" | "openai" | string;
  endpoint: string;
  model: string;
}

export function getLlmConfig(): LlmConfig {
  const apiKey =
    process.env.GROQ_API_KEY ||
    env.GROQ_API_KEY ||
    process.env.LLM_API_KEY ||
    env.LLM_API_KEY;

  let provider = (process.env.LLM_PROVIDER || env.LLM_PROVIDER || "groq").toLowerCase();

  // If the key starts with 'gsk_', auto-detect Groq
  if (apiKey?.startsWith("gsk_") || process.env.GROQ_API_KEY || env.GROQ_API_KEY) {
    provider = "groq";
  }

  let endpoint = process.env.LLM_ENDPOINT || env.LLM_ENDPOINT;
  let model = process.env.LLM_MODEL || env.LLM_MODEL;

  if (provider === "groq") {
    endpoint = endpoint || "https://api.groq.com/openai/v1/chat/completions";
    // openai/gpt-oss-120b provides fast JSON inference and high reasoning accuracy on Groq
    model = model || "openai/gpt-oss-120b";
  } else {
    endpoint = endpoint || "https://api.openai.com/v1/chat/completions";
    model = model || "gpt-4o-mini";
  }

  const isPlaceholder =
    !apiKey ||
    apiKey === "your-llm-api-key" ||
    apiKey === "your-groq-api-key" ||
    apiKey.includes("your-");

  return {
    apiKey: isPlaceholder ? undefined : apiKey,
    provider,
    endpoint,
    model
  };
}
