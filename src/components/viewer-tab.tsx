"use client";

import * as hub from "@huggingface/hub";
import type { RepoDesignation } from "@huggingface/hub";

// import mockResults from "../../qwen3-final-results.json";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ForceDirectedGraph from "@/components/force-directed-graph";
import ReasoningTrace from "@/components/reasoning-trace";
import RunsList from "@/components/runs-list";

type Run = {
  id: number;
  start: string;
  end: string;
  hops: number;
};

// Sample data - would be fetched from HuggingFace dataset in a real implementation
const sampleRuns = [
  { id: 1, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 2, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 3, start: "Pokemon", end: "Canada", hops: 16 },
  { id: 4, start: "Pokemon", end: "Canada", hops: 16 },
  // Add more sample runs as needed
];

const datasets = [
  { id: "dataset1", name: "Eureka-Lab/PHYBench" },
  { id: "dataset2", name: "Eureka-Lab/PHYBench-LLM" },
];

export default function ViewerTab() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDataset = async () => {
    console.log("Fetching dataset...");
    // console.log(Object.keys(mockResults));
    // setRuns(mockResults.runs.slice(0, 10));

    return;
    setLoading(true);

    // https://huggingface.co/datasets/HuggingFaceTB/wikispeedia-traces/resolve/main/qwen3-final-results.json
    // const response = await fetch("https://huggingface.co/datasets/HuggingFaceTB/wikispeedia-traces/resolve/main/qwen3-final-results.json");
    // const json = await response.json();
    // setRuns(json.runs);
    // setLoading(false);

    // const repo: RepoDesignation = {
    //   type: "dataset",
    //   name: "HuggingFaceTB/wikispeedia-traces",
    // };
    // const file = await hub.downloadFile({ repo, path: "qwen3-final-results.json" });
    // if (!file) {
    //   console.error("Failed to download file");
    //   return;
    // }
    // const text = await file.text();
    // console.log("GOT FILE!", text);
    // const json = JSON.parse(text);
    // setRuns(json.runs);
    // setLoading(false);
  };

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
          <Button onClick={fetchDataset}>Fetch Dataset</Button>
          {loading && <p>Loading...</p>}
        </div>

        <div className="bg-card rounded-lg p-3 border">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            Available Runs
          </h3>
          <RunsList
            runs={runs}
            onSelectRun={handleRunSelect}
            selectedRunId={selectedRun}
          />
        </div>
      </div>

      <div className="md:col-span-5">
        <Card className="w-full h-[600px] flex items-center justify-center">
          <ForceDirectedGraph runs={runs} runId={selectedRun} />
        </Card>
      </div>

      <div className="md:col-span-4">
        <Card className="w-full h-[600px] p-4">
          <ReasoningTrace run={runs[selectedRun]} />
        </Card>
      </div>
    </div>
  );
}
