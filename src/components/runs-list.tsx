"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Run {
  start_article: string;
  destination_article: string;
  steps: string[];
}

interface RunsListProps {
  runs: Run[];
  onSelectRun: (runId: number) => void;
  selectedRunId: number | null;
  onTryRun?: (startArticle: string, destinationArticle: string) => void;
}

export default function RunsList({
  runs,
  onSelectRun,
  selectedRunId,
  onTryRun,
}: RunsListProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [filter, setFilter] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const runItemsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Filter runs based on start and end filters
  const filteredRuns = runs.filter((run) => {
    const matches = filter === "" || 
      run.start_article.toLowerCase().includes(filter.toLowerCase()) ||
      run.destination_article.toLowerCase().includes(filter.toLowerCase());
    return matches;
  });

  const _onSelectRun = (runId: number) => {
    onSelectRun(runId);
    setIsPlaying(false);
  };

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
      }, 1500);
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

  // Scroll selected run into view when it changes
  useEffect(() => {
    if (selectedRunId !== null && isPlaying) {
      const selectedElement = runItemsRef.current.get(selectedRunId);
      if (selectedElement && listContainerRef.current) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedRunId, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="space-y-2 mb-4">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Filter by article"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9"
          />
          <Button 
            size="sm" 
            variant={isPlaying ? "secondary" : "outline"} 
            onClick={togglePlayPause}
            className="flex-shrink-0 h-9 px-3 gap-1"
          >
            {isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Play
              </>
            )}
          </Button>
        </div>
      </div>

      <div ref={listContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1">
        {filteredRuns.map((run) => {
          const originalIndex = runs.indexOf(run);
          return (
            <Card
              key={originalIndex}
              ref={(el) => {
                if (el) {
                  runItemsRef.current.set(originalIndex, el);
                } else {
                  runItemsRef.current.delete(originalIndex);
                }
              }}
              className={cn(
                "p-0 cursor-pointer transition-all border overflow-hidden",
                selectedRunId === originalIndex
                  ? "bg-primary/5 border-primary/50 shadow-md"
                  : "hover:bg-muted/50 border-border"
              )}
            >
              <div 
                className="p-3 flex flex-col gap-2"
                onClick={() => _onSelectRun(originalIndex)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium flex items-center flex-wrap gap-1">
                      <span className="text-primary">{run.start_article}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-primary">{run.destination_article}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5">
                        {run.steps.length} {run.steps.length === 1 ? 'hop' : 'hops'}
                      </Badge>
                      {selectedRunId === originalIndex && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <div
                            className="h-2 w-2 rounded-full bg-primary animate-pulse"
                            aria-hidden="true"
                          />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {onTryRun && selectedRunId === originalIndex && (
                <div className="border-t px-3 py-2 bg-muted/30 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTryRun(run.start_article, run.destination_article);
                    }}
                  >
                    Try this path
                  </Button>
                </div>
              )}
            </Card>
          );
        })}

        {filteredRuns.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No runs available
          </div>
        )}
      </div>
    </div>
  );
}
