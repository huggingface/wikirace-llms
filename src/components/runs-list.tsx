"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Run {
  start_article: string;
  destination_article: string;
  steps: string[];
}

interface RunsListProps {
  runs: Run[];
  onSelectRun: (runId: number) => void;
  selectedRunId: number | null;
}

export default function RunsList({
  runs,
  onSelectRun,
  selectedRunId,
}: RunsListProps) {
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden space-y-2 pr-1">
      {runs.map((run, index) => (
        <Card
          key={index}
          className={cn(
            "p-3 cursor-pointer transition-all border",
            selectedRunId === index
              ? "bg-primary/10 border-primary/50 shadow-sm"
              : "hover:bg-muted/80 border-transparent"
          )}
          onClick={() => onSelectRun(index)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center">
                <span>{run.start_article}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <span>{run.destination_article}</span>
              </p>
              <p className="text-sm text-muted-foreground">{run.steps.length} hops</p>
            </div>
            {selectedRunId === index && (
              <div
                className="h-2 w-2 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </div>
        </Card>
      ))}

      {runs.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No runs available
        </div>
      )}
    </div>
  );
}
