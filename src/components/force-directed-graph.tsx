"use client";

import { useEffect, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { Run } from "./reasoning-trace";
import * as d3 from "d3";
// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

interface ForceDirectedGraphProps {
  runId: number | null;
  runs: Run[];
}

export default function ForceDirectedGraph({runs, runId }: ForceDirectedGraphProps) {
    const [graphData, setGraphData] = useState<{nodes: {id: string, color?: string}[], links: {source: string, target: string, color?: string}[]}>({nodes: [], links: []});
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods<NodeObject<{ id: string; color?: string; }>, LinkObject<{ id: string; color?: string; }, { source: string; target: string; color?: string; }>>>(null);
    useEffect(() => {

        const newGraphData: {nodes: {id: string, color?: string}[], links: {source: string, target: string, color?: string}[]} = {nodes: [], links: []};
        const nodesSet: Set<string> = new Set();
        const mainNodeSet: Set<string> = new Set();

        if(runs) {
            runs.forEach((run, runIndex) => {
                // add in src and dst to nodes
                const isSelectedRun = runId === runIndex;

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

                    newGraphData.links.push({
                        source: step.article, 
                        target: nextStep.article,
                        color: isSelectedRun ? '#ff6b6b' : 'gray'
                    });
                }

                const mainNodes = Array.from(mainNodeSet);
                const radius = 400; // Radius of the circle
                const centerX = 0; // Center X coordinate
                const centerY = 0; // Center Y coordinate

                newGraphData.nodes = mainNodes.map((id, index) => {
                    const angle = (index * 2 * Math.PI) / mainNodes.length;
                    return {
                        id,
                        fx: centerX + radius * Math.cos(angle),
                        fy: centerY + radius * Math.sin(angle),
                        color: isSelectedRun && (id === run.start_article || id === run.destination_article) ? '#ff6b6b' : 'red'
                    };
                });
                newGraphData.nodes.push(...Array.from(nodesSet).map((id) => ({
                    id,
                    color: isSelectedRun && run.steps.some(step => step.article === id) ? '#ff6b6b' : 'gray'
                })));
            });

            setGraphData(newGraphData);
        }
    }, [runs, runId]);

    useEffect(() => {
        if (graphRef.current) {
          const radialForceStrength = 0.7;
          const radialTargetRadius = 40; // Increased radius to allow more space
          const linkDistance = 35; // Keep links relatively short
          const chargeStrength = -100; // Increase repulsion more
          const COLLISION_PADDING = 3;


        //   graphRef.current.centerAt(400, 400);
          graphRef.current.zoomToFit();

          graphRef.current.d3Force("link", d3.forceLink(graphData.links).id((d) => d.id).distance(linkDistance).strength(0.9));
          graphRef.current.d3Force("charge", d3.forceManyBody().strength(chargeStrength));
          graphRef.current.d3Force("radial", d3.forceRadial(radialTargetRadius, 0, 0).strength(radialForceStrength));
          graphRef.current.d3Force("collide", d3.forceCollide().radius((d) => d.radius + COLLISION_PADDING));

        }
    }, [graphRef]);


    return (
        <div className="w-full h-full flex items-center justify-center">
            <div ref={containerRef} className="w-full h-full">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="id"
                    linkLabel="id"
                    nodeColor="color"
                    linkColor="color"
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = 12/globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                        // Draw node circle
                        ctx.beginPath();
                        ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI);
                        ctx.fillStyle = node.color || 'gray';
                        ctx.fill();

                        if(node.color === "red") {
                            // Draw label background
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.fillRect(
                            node.x! - bckgDimensions[0] / 2,
                            node.y! + 8,
                            bckgDimensions[0],
                            bckgDimensions[1]
                        );

                        // Draw label text
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'black';
                        ctx.fillText(
                            label,
                            node.x!,
                                node.y! + 8 + fontSize / 2
                            );
                        }
                    }}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            </div>
        </div>
    );
}
