import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { ProviderConfig } from "./types.js";

export function resolveModel(config: ProviderConfig): BaseChatModel {
  switch (config.kind) {
    case "anthropic":
      return new ChatAnthropic({
        model: config.model,
        apiKey: config.apiKey,
        clientOptions: { dangerouslyAllowBrowser: true },
      });
    case "google":
      return new ChatOpenAI({
        model: config.model,
        apiKey: config.apiKey,
        configuration: {
          baseURL:
            config.baseURL ?? "https://generativelanguage.googleapis.com/v1beta/openai/",
          dangerouslyAllowBrowser: true,
        },
      });
    case "openai-compatible":
    default:
      return new ChatOpenAI({
        model: config.model,
        apiKey: config.apiKey,
        configuration: {
          ...(config.baseURL ? { baseURL: config.baseURL } : {}),
          dangerouslyAllowBrowser: true,
        },
      });
  }
}
