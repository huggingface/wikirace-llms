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

// Extended node and link types that include run metadata
interface GraphNode extends NodeObject {
  id: string;
  type?: 'fixed' | 'fluid';
  radius?: number;
  baseOpacity?: number;
  runIds: number[]; // Array of run indices this node is part of
  isMainNode?: boolean; // Whether this is a start/destination node
  fx?: number;
  fy?: number;
}

interface GraphLink extends LinkObject {
  source: string | GraphNode;
  target: string | GraphNode;
  runIds: number[]; // Array of run indices this link is part of
}

export default function ForceDirectedGraph({runs, runId }: ForceDirectedGraphProps) {
    const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({nodes: [], links: []});
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(null);
   
    // Build graph data ONLY when runs change, not when runId changes
    useEffect(() => {
        const newGraphData: {nodes: GraphNode[], links: GraphLink[]} = {nodes: [], links: []};
        const nodesMap = new Map<string, GraphNode>();
        const linksMap = new Map<string, GraphLink>();
        const nodeDegrees: Map<string, number> = new Map();
        const mainNodeSet: Set<string> = new Set();
        
        // First identify all main nodes (start and destination)
        runs.forEach((run) => {
            mainNodeSet.add(run.start_article);
            mainNodeSet.add(run.destination_article);
        });

        // Process all runs to build data with metadata
        runs.forEach((run, runIndex) => {
            for(let i = 0; i < run.steps.length - 1; i++) {
                const step = run.steps[i];
                const nextStep = run.steps[i + 1];
                
                // Update or create source node
                if (!nodesMap.has(step.article)) {
                    const isMainNode = mainNodeSet.has(step.article);
                    nodesMap.set(step.article, {
                        id: step.article,
                        type: isMainNode ? 'fixed' : 'fluid',
                        radius: isMainNode ? 7 : 5,
                        runIds: [runIndex],
                        isMainNode
                    });
                } else {
                    const node = nodesMap.get(step.article)!;
                    if (!node.runIds.includes(runIndex)) {
                        node.runIds.push(runIndex);
                    }
                }
                
                // Update or create target node
                if (!nodesMap.has(nextStep.article)) {
                    const isMainNode = mainNodeSet.has(nextStep.article);
                    nodesMap.set(nextStep.article, {
                        id: nextStep.article, 
                        type: isMainNode ? 'fixed' : 'fluid',
                        radius: isMainNode ? 7 : 5,
                        runIds: [runIndex],
                        isMainNode
                    });
                } else {
                    const node = nodesMap.get(nextStep.article)!;
                    if (!node.runIds.includes(runIndex)) {
                        node.runIds.push(runIndex);
                    }
                }
                
                // Update degrees for sizing/opacity calculations
                nodeDegrees.set(step.article, (nodeDegrees.get(step.article) || 0) + 1);
                nodeDegrees.set(nextStep.article, (nodeDegrees.get(nextStep.article) || 0) + 1);
                
                // Create or update link
                const linkId = `${step.article}->${nextStep.article}`;
                if (!linksMap.has(linkId)) {
                    linksMap.set(linkId, {
                        source: step.article,
                        target: nextStep.article,
                        runIds: [runIndex],
                        id: linkId
                    });
                } else {
                    const link = linksMap.get(linkId)!;
                    if (!link.runIds.includes(runIndex)) {
                        link.runIds.push(runIndex);
                    }
                }
            }
        });
        
        // Position main nodes in a circle
        const mainNodes = Array.from(mainNodeSet);
        const radius = 400; // Radius of the circle
        const centerX = 0; // Center X coordinate
        const centerY = 0; // Center Y coordinate
        
        mainNodes.forEach((nodeId, index) => {
            const angle = (index * 2 * Math.PI) / mainNodes.length;
            const node = nodesMap.get(nodeId);
            if (node) {
                node.fx = centerX + radius * Math.cos(angle);
                node.fy = centerY + radius * Math.sin(angle);
            }
        });
        
        // Create opacity scale based on node degrees
        const maxDegree = Math.max(...Array.from(nodeDegrees.values()));
        const opacityScale = d3.scaleLinear()
            .domain([1, Math.max(1, maxDegree)])
            .range([STYLES.minNodeOpacity, 1.0])
            .clamp(true);
            
        // Set base opacity for all nodes
        nodesMap.forEach(node => {
            node.baseOpacity = node.type === 'fixed' ? 
                1.0 : opacityScale(nodeDegrees.get(node.id) || 1);
        });
        
        // Convert maps to arrays for the graph
        newGraphData.nodes = Array.from(nodesMap.values());
        const links = Array.from(linksMap.values());

        // Convert string IDs to actual node objects in links
        newGraphData.links = links.map(link => {
            const sourceNode = nodesMap.get(link.source as string);
            const targetNode = nodesMap.get(link.target as string);
            
            // Only create links when both nodes exist
            if (sourceNode && targetNode) {
                return {
                    ...link,
                    source: sourceNode,
                    target: targetNode
                };
            }
            // Skip this link if nodes don't exist
            return null;
        }).filter(Boolean) as GraphLink[];
        
        setGraphData(newGraphData);
    }, [runs]); // Only depends on runs, not runId

    // Set up the force simulation
    useEffect(() => {
        if (graphRef.current && graphData.nodes.length > 0) {
            const radialForceStrength = 0.7;
            const radialTargetRadius = 40;
            const linkDistance = 35;
            const chargeStrength = -100;
            const COLLISION_PADDING = 3;

            // Initialize force simulation
            graphRef.current.d3Force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(linkDistance).strength(0.9));
            graphRef.current.d3Force("charge", d3.forceManyBody().strength(chargeStrength));
            graphRef.current.d3Force("radial", d3.forceRadial(radialTargetRadius, 0, 0).strength(radialForceStrength));
            graphRef.current.d3Force("collide", d3.forceCollide().radius((d: any) => (d.radius || 5) + COLLISION_PADDING));
            graphRef.current.d3Force("center", d3.forceCenter(0, 0));
            
            // Give the simulation a bit of time to stabilize, then zoom to fit
            setTimeout(() => {
                if (graphRef.current) {
                    graphRef.current.zoomToFit(400);
                }
            }, 500);
        }
    }, [graphData, graphRef.current]);

    // Full page resize handler
    useEffect(() => {
        const handleResize = () => {
            if (graphRef.current) {
                graphRef.current.zoomToFit(400);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper function to determine node color based on current runId
    const getNodeColor = (node: GraphNode) => {
        if (runId !== null && node.runIds.includes(runId)) {
            // If the node is part of the selected run
            if (node.isMainNode) {
                // Main nodes (start/destination) of the selected run get highlight color
                const run = runs[runId];
                if (node.id === run.start_article || node.id === run.destination_article) {
                    return STYLES.highlightColor;
                }
            }
            // Regular nodes in the selected run get highlight color
            return STYLES.highlightColor;
        }
        
        // Nodes not in the selected run get their default colors
        return node.type === 'fixed' ? STYLES.fixedNodeColor : STYLES.fluidNodeColor;
    };

    // Helper function to determine link color based on current runId
    const getLinkColor = (link: GraphLink) => {
        return runId !== null && link.runIds.includes(runId) ? 
            STYLES.highlightColor : STYLES.linkColor;
    };

    // Helper function to determine if a node is in the current run
    const isNodeInCurrentRun = (node: GraphNode) => {
        // Handle case where node might be a string ID
        if (typeof node === 'string') return false;
        return runId !== null && node.runIds && node.runIds.includes(runId);
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div ref={containerRef} className="w-full h-full">
                <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeLabel="id"
                    linkLabel="id"
                    nodeColor={getNodeColor}
                    linkColor={getLinkColor}
                    linkWidth={link => {
                        const source = typeof link.source === 'object' ? link.source : null;
                        const target = typeof link.target === 'object' ? link.target : null;
                        return (source && isNodeInCurrentRun(source)) || (target && isNodeInCurrentRun(target)) ? 2.5 : 1;
                    }}
                    nodeRelSize={1}
                    linkDirectionalParticles={link => {
                        const source = typeof link.source === 'object' ? link.source : null;
                        const target = typeof link.target === 'object' ? link.target : null;
                        return (source && isNodeInCurrentRun(source)) || (target && isNodeInCurrentRun(target)) ? 4 : 0;
                    }}
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
                      const radius = node.radius || (node.type === "fixed" ? 7 : 5);
                      ctx.beginPath();
                      ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
                      ctx.fillStyle = getNodeColor(node);
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
                    width={containerRef.current?.clientWidth || 800}
                    height={containerRef.current?.clientHeight || 800}
                />
            </div>
        </div>
    );
}
