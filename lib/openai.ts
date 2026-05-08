import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      baseURL: process.env.OPENAI_BASE_URL ?? undefined,
    });
  }
  return _client;
}

let _chatClient: OpenAI | null = null;

export function getChatAIClient(): OpenAI {
  if (process.env.NVIDIA_API_KEY) {
    if (!_chatClient) {
      _chatClient = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
    }
    return _chatClient;
  }
  return getOpenAIClient();
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function getChatAIModel(): string {
  if (process.env.NVIDIA_API_KEY) {
    return process.env.NVIDIA_MODEL ?? "nvidia/llama-3.1-405b-instruct";
  }
  return getOpenAIModel();
}

export function getChatAIProviderName(): string {
  if (process.env.NVIDIA_API_KEY) return "NVIDIA";
  return getAIProviderName();
}

export function getAIProviderName(): string {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "";
  if (baseUrl.includes("groq.com")) return "Groq";
  if (baseUrl.includes("anthropic.com")) return "Anthropic";
  if (baseUrl.includes("openrouter.ai")) return "OpenRouter";
  if (baseUrl.includes("nvidia.com")) return "NVIDIA";
  return "OpenAI";
}
