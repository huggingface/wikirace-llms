"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ReasoningTraceProps {
  runId: number | null;
}

export default function ReasoningTrace({ runId }: ReasoningTraceProps) {
  const [userInput, setUserInput] = useState("");

  if (!runId) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Select a run to view the reasoning trace
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-4">LLM Reasoning Trace</h3>

      <div className="flex-1 overflow-y-auto mb-4 bg-muted/30 rounded-md p-4">
        <div className="space-y-4">
          <div className="bg-primary/10 p-3 rounded-lg max-w-[80%]">
            <p className="text-sm">Hello! How can I help you today?</p>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg max-w-[80%] ml-auto">
            <p className="text-sm">How can I deploy a website to Vercel?</p>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg max-w-[80%]">
            <p className="text-sm">
              To deploy a website to Vercel, follow these steps:
              <br />
              <br />
              1. Sign up for a Vercel account: Go to https://vercel.com/signup
              and sign up using your GitHub, GitLab, or Bitbucket account, or
              with your email address.
              <br />
              <br />
              2. Install the Vercel command-line interface (CLI) by running the
              following command in your terminal or command prompt:
              <br />
              <code className="bg-muted p-1 rounded">
                npm install -g vercel
              </code>
              <br />
              <br />
              Make sure you have Node.js and npm installed on your system before
              running this command.
              <br />
              <br />
              3. Authenticate with Vercel: Run the following command:
              <br />
              <code className="bg-muted p-1 rounded">vercel login</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
