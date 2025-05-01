import { InferenceClient } from "@huggingface/inference";

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