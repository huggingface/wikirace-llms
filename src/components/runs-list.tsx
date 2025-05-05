"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [isPlaying, setIsPlaying] = useState(true);
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter runs based on start and end filters
  const filteredRuns = runs.filter((run) => {
    const matchesStart = startFilter === "" || 
      run.start_article.toLowerCase().includes(startFilter.toLowerCase());
    const matchesEnd = endFilter === "" || 
      run.destination_article.toLowerCase().includes(endFilter.toLowerCase());
    return matchesStart && matchesEnd;
  });

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (filteredRuns.length === 0) return;
        
        const nextIndex = selectedRunId === null 
          ? 0 
          : (selectedRunId + 1) % filteredRuns.length;
        
        const originalIndex = runs.findIndex(
          run => run === filteredRuns[nextIndex]
        );
        
        onSelectRun(originalIndex);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, selectedRunId, filteredRuns, runs, onSelectRun]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="space-y-2 mb-3">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Filter by start"
            value={startFilter}
            onChange={(e) => setStartFilter(e.target.value)}
            className="h-8"
          />
          <Input
            placeholder="Filter by end"
            value={endFilter}
            onChange={(e) => setEndFilter(e.target.value)}
            className="h-8"
          />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={togglePlayPause}
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-1">
        {filteredRuns.map((run) => {
          const originalIndex = runs.indexOf(run);
          return (
            <Card
              key={originalIndex}
              className={cn(
                "p-3 cursor-pointer transition-all border",
                selectedRunId === originalIndex
                  ? "bg-primary/10 border-primary/50 shadow-sm"
                  : "hover:bg-muted/80 border-transparent"
              )}
              onClick={() => onSelectRun(originalIndex)}
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
                {selectedRunId === originalIndex && (
                  <div
                    className="h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </div>
            </Card>
          );
        })}

        {filteredRuns.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No runs available
          </div>
        )}
      </div>
    </div>
  );
}
