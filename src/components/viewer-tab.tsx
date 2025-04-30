"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import ForceDirectedGraph from "@/components/force-directed-graph";
import ReasoningTrace from "@/components/reasoning-trace";
import RunsList from "@/components/runs-list";

// Sample data - would be fetched from HuggingFace dataset in a real implementation
const sampleRuns = [
  { id: 1, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 2, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 3, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 4, start: "Pokemon", end: "Canada", hops: 16 },
  // Add more sample runs as needed
];

const datasets = [
  { id: "dataset1", name: "Wikispeedia Paths" },
  { id: "dataset2", name: "LLM Generated Paths" },
];

export default function ViewerTab() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<number | null>(null);

  const handleDatasetChange = (value: string) => {
    setSelectedDataset(value);
    setSelectedRun(null);
  };

  const handleRunSelect = (runId: number) => {
    setSelectedRun(runId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-3">
        <div className="mb-4">
          <Select value={selectedDataset} onValueChange={handleDatasetChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="SELECT DATASET" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            Available Runs
          </h3>
          <RunsList
            runs={sampleRuns}
            onSelectRun={handleRunSelect}
            selectedRunId={selectedRun}
          />
        </div>
      </div>

      <div className="md:col-span-5">
        <Card className="w-full h-[600px] flex items-center justify-center">
          <ForceDirectedGraph runId={selectedRun} />
        </Card>
      </div>

      <div className="md:col-span-4">
        <Card className="w-full h-[600px] p-4">
          <ReasoningTrace runId={selectedRun} />
        </Card>
      </div>
    </div>
  );
}
