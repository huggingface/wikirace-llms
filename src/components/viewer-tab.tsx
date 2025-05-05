"use client";

import * as hub from "@huggingface/hub";
import type { RepoDesignation } from "@huggingface/hub";

import mockResults from "../../results/qwen3.json"
// import mockResults from "../../qwen3-final-results.json"
import { useMemo, useState, useEffect } from "react";
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
import RunsList from "@/components/runs-list";

type Run = {
  id: number;
  start: string;
  end: string;
  hops: number;
};

export default function ViewerTab() {
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDataset = async () => {
    console.log("Fetching dataset...");
    console.log(Object.keys(mockResults));
    setRuns(mockResults.runs);

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

  useEffect(() => {
    fetchDataset();
  }, []);

  const handleDatasetChange = (value: string) => {
    setSelectedDataset(value);
    setSelectedRun(null);
  };

  const handleRunSelect = (runId: number) => {
    setSelectedRun(runId);
  };

  const filterRuns = useMemo(() => {
    return runs.filter(run => run.result === "win");
  }, [runs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] overflow-hidden p-2">
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
