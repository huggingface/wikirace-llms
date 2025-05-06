import { InferenceClient } from "@huggingface/inference";
import { useState } from "react";

export default async function inference({
  prompt,
  model = "Qwen/Qwen3-235B-A22B",
  apiKey,
  maxTokens = 512
}: {
  prompt: string,
  model?: string,
  apiKey?: string,
  maxTokens?: number
}) {
  if (!apiKey) {
    const token = window.localStorage.getItem("huggingface_access_token");
    if (!token) {
      throw new Error("You must be signed in to use the inference API!");
    }
    apiKey = token;
  }

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

export function useInferenceOld({ apiKey }) {
  const [isLoading, setIsLoading] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [inferenceResult, setInferenceResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inferenceInternal = async ({
    prompt,
    model,
    maxTokens,
  }: {
    prompt: string;
    model: string;
    maxTokens: number;
  }) => {
    setIsLoading(true);
    setPartialText("boop boop partial text");

    try {
      const result = await inference({
        prompt,
        model,
        apiKey,
        maxTokens,
      });

      setInferenceResult(result.content);
      setIsLoading(false);

      return result.content;
    } catch (error) {
      console.error("Error in inference", error);
      setError(error.message);
      setIsLoading(false);
      return null;
    }
  };

  const status = isLoading ? "thinking" : error ? "error" : "done";

  return {
    status,
    partialText,
    inferenceResult,
    error,
    inference: inferenceInternal,
  };
}


export function useInference({ apiKey }) {
  const [isLoading, setIsLoading] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [inferenceResult, setInferenceResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inferenceInternal = async ({
    prompt,
    model,
    maxTokens,
  }: {
    prompt: string;
    model: string;
    maxTokens: number;
  }) => {
    setIsLoading(true);
    setPartialText("");

    const client = new InferenceClient(apiKey);

    try {
      const stream = client.chatCompletionStream({
        provider: "nebius",
        model,
        maxTokens,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      let result = "";

      for await (const chunk of stream) {
        result += chunk.choices[0].delta.content;
        setPartialText(result);
      }

      setIsLoading(false);

      setInferenceResult(result);

      return {status: "success", result};
    } catch (error) {
      console.error("Error in inference", error);
      setError(error.message);
      setIsLoading(false);
      return {status: "error", result: error.message};
    }
  };

  const status = isLoading ? "thinking" : error ? "error" : "done";

  return {
    status,
    partialText,
    inferenceResult,
    error,
    inference: inferenceInternal,
  };
}
