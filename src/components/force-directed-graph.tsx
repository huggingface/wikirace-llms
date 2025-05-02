"use client";

import { useEffect, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { Run } from "./reasoning-trace";
import * as d3 from "d3";
// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

// CSS variables for styling
const STYLES = {
  fixedNodeColor: '#e63946', // Red
  fluidNodeColor: '#457b9d', // Steel Blue
  linkColor: '#adb5bd', // Grey
  highlightColor: '#fca311', // Orange/Yellow
  successColor: '#2a9d8f', // Teal
  minNodeOpacity: 0.3,
  minLinkOpacity: 0.15,
};

interface ForceDirectedGraphProps {
  runId: number | null;
  runs: Run[];
}

export default function ForceDirectedGraph({runs, runId }: ForceDirectedGraphProps) {
    const [graphData, setGraphData] = useState<{nodes: {id: string, color?: string, type?: string, radius?: number, baseOpacity?: number}[], links: {source: string, target: string, color?: string}[]}>({nodes: [], links: []});
    const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods<NodeObject<{ id: string; color?: string; }>, LinkObject<{ id: string; color?: string; }, { source: string; target: string; color?: string; }>>>(null);
   
    useEffect(() => {
        const newGraphData: {nodes: {id: string, color?: string, type?: string, radius?: number, baseOpacity?: number}[], links: {source: string, target: string, color?: string}[]} = {nodes: [], links: []};
        const nodesSet: Set<string> = new Set();
        const mainNodeSet: Set<string> = new Set();

        if(runs) {
            // Create a map to track node degrees (number of connections)
            const nodeDegrees: Map<string, number> = new Map();
            
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

                    // Increment degree count for both nodes
                    nodeDegrees.set(step.article, (nodeDegrees.get(step.article) || 0) + 1);
                    nodeDegrees.set(nextStep.article, (nodeDegrees.get(nextStep.article) || 0) + 1);

                    newGraphData.links.push({
                        source: step.article, 
                        target: nextStep.article,
                        color: isSelectedRun ? STYLES.highlightColor : STYLES.linkColor
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
                        type: 'fixed',
                        radius: 7, // Larger radius for fixed nodes
                        color: isSelectedRun && (id === run.start_article || id === run.destination_article) ? STYLES.highlightColor : STYLES.fixedNodeColor,
                        baseOpacity: 1.0 // Fixed nodes are always fully visible
                    };
                });
                
                // Create opacity scale based on node degrees
                const maxDegree = Math.max(...Array.from(nodeDegrees.values()));
                const opacityScale = d3.scaleLinear()
                    .domain([1, Math.max(1, maxDegree)])
                    .range([STYLES.minNodeOpacity, 1.0])
                    .clamp(true);

                newGraphData.nodes.push(...Array.from(nodesSet).map((id) => ({
                    id,
                    type: 'fluid',
                    radius: 5, // Smaller radius for fluid nodes
                    color: isSelectedRun && run.steps.some(step => step.article === id) ? STYLES.highlightColor : STYLES.fluidNodeColor,
                    baseOpacity: opacityScale(nodeDegrees.get(id) || 1)
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
                    linkWidth={link => link.source.id === runId || link.target.id === runId ? 2.5 : 1}
                    linkOpacity={0.6}
                    nodeRelSize={1}
                    linkDirectionalParticles={link => link.source.id === runId || link.target.id === runId ? 4 : 0}
                    linkDirectionalParticleWidth={2}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const label = node.id;
                      const fontSize = 12 / globalScale;
                      ctx.font = `${fontSize}px Sans-Serif`;
                      const textWidth = ctx.measureText(label).width;
                      const bckgDimensions = [textWidth, fontSize].map(
                        (n) => n + fontSize * 0.2
                      );

                      // Apply opacity based on node type and properties
                      const opacity =
                        node.baseOpacity !== undefined
                          ? node.baseOpacity
                          : node.type === "fixed"
                          ? 1.0
                          : STYLES.minNodeOpacity;

                      // Draw node circle with appropriate styling
                      const radius =
                        node.radius || (node.type === "fixed" ? 7 : 5);
                      ctx.beginPath();
                      ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
                      ctx.fillStyle = node.color || STYLES.fluidNodeColor;
                      ctx.fill();

                      // Add white stroke around nodes
                      ctx.strokeStyle = "#fff";
                      ctx.globalAlpha = opacity;
                      ctx.lineWidth = 1;
                      ctx.stroke();

                      // Draw label with background for better visibility
                      const shouldShowLabel =
                        node.type === "fixed" ||
                        (runId !== null &&
                          node.id === runs[runId]?.start_article) ||
                        (runId !== null &&
                          node.id === runs[runId]?.destination_article);

                      if (shouldShowLabel) {
                        // Draw label background
                        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                        ctx.fillRect(
                          node.x! - bckgDimensions[0] / 2,
                          node.y! + 8,
                          bckgDimensions[0],
                          bckgDimensions[1]
                        );

                        // Draw label text
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "black";
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
