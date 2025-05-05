"use client";

import * as hub from "@huggingface/hub";
import type { RepoDesignation } from "@huggingface/hub";

import mockResults from "../../results/qwen3.json"
// import mockResults from "../../qwen3-final-results.json"
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ForceDirectedGraph from "@/components/force-directed-graph";
import RunsList from "@/components/runs-list";

type Run = {
  id: number;
  start: string;
  end: string;
  hops: number;
};

export default function ViewerTab() {
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);

  const fetchDataset = async () => {
    console.log("Fetching dataset...");
    console.log(Object.keys(mockResults));
    setRuns(mockResults.runs);

    return;
  };

  useEffect(() => {
    fetchDataset();
  }, []);


  const handleRunSelect = (runId: number) => {
    setSelectedRun(runId);
  };

  const filterRuns = useMemo(() => {
    return runs.filter(run => run.result === "win");
  }, [runs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-200px)] max-h-[calc(100vh-200px)] overflow-hidden p-2">
      <div className="md:col-span-3 flex flex-col max-h-full overflow-hidden">
        <div className="bg-card rounded-lg p-3 border flex-grow overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground flex-shrink-0">
            Available Runs
          </h3>
          <div className="flex-grow overflow-hidden">
            <RunsList
              runs={filterRuns}
              onSelectRun={handleRunSelect}
              selectedRunId={selectedRun}
            />
          </div>
        </div>
      </div>

      <div className="md:col-span-9 max-h-full overflow-hidden">
        <Card className="w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden">
          <ForceDirectedGraph runs={filterRuns} runId={selectedRun} />
        </Card>
      </div>
    </div>
  );
}
