"use client";

import q3Results from "../../results/qwen3.json"
import q3_30B_A3B_Results from "../../results/qwen3-30B-A3-results.json"
// import mockResults from "../../qwen3-final-results.json"
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ForceDirectedGraph from "@/components/force-directed-graph";
import RunsList from "@/components/runs-list";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Run as ForceGraphRun } from "@/components/reasoning-trace";

const models = {
  "Qwen3-14B": q3Results,
  "Qwen3-30B-A3B": q3_30B_A3B_Results,
}

// Use the type expected by RunsList
interface Run {
  start_article: string;
  destination_article: string;
  steps: string[];
  result: string;
}

export default function ViewerTab({
  handleTryRun,
}: {
  handleTryRun: (startArticle: string, destinationArticle: string) => void;
}) {
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("Qwen3-14B");

  useEffect(() => {
    // Convert the model data to the format expected by RunsList
    const convertedRuns = models[selectedModel].runs.map((run: {
      start_article: string;
      destination_article: string;
      steps: { type: string; article: string }[];
      result: string;
    }) => ({
      start_article: run.start_article,
      destination_article: run.destination_article,
      steps: run.steps.map((step: { article: string }) => step.article),
      result: run.result
    }));
    setRuns(convertedRuns);
  }, [selectedModel]);

  const handleRunSelect = (runId: number) => {
    setSelectedRun(runId);
  };

  const filterRuns = useMemo(() => {
    return runs.filter(run => run.result === "win");
  }, [runs]);

  // Convert the runs to the format expected by ForceDirectedGraph
  const forceGraphRuns = useMemo(() => {
    return filterRuns.map((run): ForceGraphRun => ({
      start_article: run.start_article,
      destination_article: run.destination_article,
      steps: run.steps.map(article => ({ type: "move", article }))
    }));
  }, [filterRuns]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] overflow-hidden p-2">
     <Card className="p-2 col-span-12 h-12 row-start-1">
      <div className="flex items-center justify-between h-full">
        <h3 className="text-sm font-medium text-muted-foreground flex-shrink-0">
          Models
        </h3>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(models).map((modelName) => (
              <SelectItem key={modelName} value={modelName}>
                {modelName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
     </Card>
      <div className="md:col-span-3 flex flex-col max-h-full overflow-hidden">
        <div className="bg-card rounded-lg p-3 border flex-grow overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground flex-shrink-0">
            Runs
          </h3>
          <div className="flex-grow overflow-hidden">
            <RunsList
              runs={filterRuns}
              onSelectRun={handleRunSelect}
              selectedRunId={selectedRun}
              onTryRun={handleTryRun}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-9 max-h-full overflow-hidden">
        <Card className="w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden">
          <ForceDirectedGraph runs={forceGraphRuns} runId={selectedRun} />
        </Card>
      </div>
    </div>
  );
}
