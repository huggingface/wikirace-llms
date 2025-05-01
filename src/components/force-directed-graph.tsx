"use client";

import { useEffect, useRef, useState } from "react";
// import ForceGraph2D from "react-force-graph-2d";

// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

interface ForceDirectedGraphProps {
  runId: number | null;
}

export default function ForceDirectedGraph({runs, runId }: ForceDirectedGraphProps) {
    const [graphData, setGraphData] = useState<{nodes: {id: string}[], links: {source: string, target: string}[]}>({nodes: [], links: []});
    const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log("runs", runs);

        const newGraphData: {nodes: {id: string}[], links: {source: string, target: string}[]} = {nodes: [], links: []};
        const nodesSet: Set<string> = new Set();
        const mainNodeSet: Set<string> = new Set();

        if(runs) {
            runs.forEach((run) => {
                // add in src and dst to nodes

                mainNodeSet.add(run.start_article);
                mainNodeSet.add(run.destination_article);

                for(let i = 0; i < run.steps.length - 1; i++) {
                    const step = run.steps[i];
                    const nextStep = run.steps[i + 1];

                    if(!mainNodeSet.has(step.article)) {
                        nodesSet.add(step.article);
                    }

                    if(!mainNodeSet.has(nextStep.article)) {
                        nodesSet.add(nextStep.article);
                    }

                    newGraphData.links.push({source: step.article, target: nextStep.article});
                }

                const mainNodes = Array.from(mainNodeSet);
                const radius = 200; // Radius of the circle
                const centerX = 400; // Center X coordinate
                const centerY = 300; // Center Y coordinate

                newGraphData.nodes = mainNodes.map((id, index) => {
                    const angle = (index * 2 * Math.PI) / mainNodes.length;
                    return {
                        id,
                        fx: centerX + radius * Math.cos(angle),
                        fy: centerY + radius * Math.sin(angle),
                        color: "red"
                    };
                });
                newGraphData.nodes.push(...Array.from(nodesSet).map((id) => ({id})));
            });

            setGraphData(newGraphData);
        }
    }, [runs]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new window.ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(containerRef.current);
        // Set initial size
        setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
        });
        return () => observer.disconnect();
    }, []);

    if (!runId) {
        return (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Select a run to view the path graph
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div ref={containerRef} className="w-full h-full">
                {/* <ForceGraph2D
                    graphData={graphData}
                    nodeLabel="id"
                    linkLabel="id"
                    nodeColor="color"
                    linkColor="gray"
                    width={dimensions.width}
                    height={dimensions.height}
                /> */}
            </div>
        </div>
    );
}
