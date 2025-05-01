import { InferenceClient } from "@huggingface/inference";
import { useEffect } from "react";
import { useState } from "react";


export default async function inference({
  prompt,
  model = "Qwen/Qwen3-235B-A22B",
  apiKey = "xxx",
  maxTokens = 512
}: {
  prompt: string,
  model?: string,
  apiKey?: string,
  maxTokens?: number
}) {

  console.log("Inference", prompt, model, apiKey);
  const client = new InferenceClient(apiKey);

  const chatCompletion = await client.chatCompletion({
    provider: "fireworks-ai",
    model: model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: maxTokens,
  });

  console.log("Inference response", chatCompletion.choices[0].message);
  return chatCompletion.choices[0].message;
}