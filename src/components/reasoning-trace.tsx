"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StepMetadata {
  message?: string;
  conversation?: Message[];
}

export interface Step {
  type: string;
  article: string;
  links?: unknown[];
  metadata?: StepMetadata;
}

export interface Run {
  steps: Step[];
  start_article: string;
  destination_article: string;
}

interface ReasoningTraceProps {
  run: Run | null | undefined;
}

const MAX_MESSAGE_LENGTH = 200;

function ExpandableMessage({ message }: { message: Message }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongMessage = message.content.length > MAX_MESSAGE_LENGTH;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={`p-3 rounded-lg max-w-[80%] ${
        message.role === "user"
          ? "bg-primary/10 ml-auto"
          : "bg-secondary/10 mr-auto"
      }`}
    >
      <p className="text-xs font-semibold mb-1 capitalize text-muted-foreground">
        {message.role}
      </p>
      <p className="text-sm whitespace-pre-wrap">
        {isLongMessage && !isExpanded
          ? `${message.content.substring(0, MAX_MESSAGE_LENGTH)}...`
          : message.content}
      </p>
      {isLongMessage && (
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-xs mt-1"
          onClick={toggleExpand}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
}

export default function ReasoningTrace({ run }: ReasoningTraceProps) {
  if (!run?.steps) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        {run === undefined ? "Loading..." : "Select a run to view the reasoning trace"}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 px-1">LLM Reasoning Trace</h3>

      <div className="flex-1 overflow-y-auto space-y-4 p-1">
        {run.steps.map((step, index) => (
          <div key={index} className="py-4 px-2">
            <div>
              <h4 className="text-base font-semibold">Step {index + 1} - {step.article}</h4>
              {step.metadata?.message && (
                 <p className="text-sm text-muted-foreground pt-1 italic">"{step.metadata.message}"</p>
              )}
            </div>

            {step.metadata?.conversation && step.metadata.conversation.length > 0 && (
               <div className="space-y-2 mt-3 pt-3">
                {step.metadata.conversation.map((message, msgIndex) => (
                  <ExpandableMessage key={msgIndex} message={message} />
                ))}
               </div>
            )}

            {index < run.steps.length - 1 && (
              <hr className="my-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
