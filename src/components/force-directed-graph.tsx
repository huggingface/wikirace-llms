"use client";

import { useEffect, useRef, useState } from "react";
import ForceGraph2D, {
  ForceGraphMethods,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";
import { Run } from "./reasoning-trace";
import * as d3 from "d3";
// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

// CSS variables for styling
const STYLES = {
  fixedNodeColor: "#e63946", // Red
  fluidNodeColor: "#457b9d", // Steel Blue
  linkColor: "#adb5bd", // Grey
  highlightColor: "#fca311", // Orange/Yellow
  successColor: "#2a9d8f", // Teal
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
  type?: "fixed" | "fluid";
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
  runId: number; // Array of run indices this link is part of
}

export default function ForceDirectedGraph({
  runs,
  runId,
}: ForceDirectedGraphProps) {
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        const width = parent ? parent.clientWidth : containerRef.current.clientWidth;
        const height = parent ? parent.clientHeight : containerRef.current.clientHeight;
        
        // Constrain dimensions to reasonable values
        const constrainedWidth = Math.min(width, window.innerWidth);
        const constrainedHeight = Math.min(height, window.innerHeight);
        
        setDimensions({
          width: constrainedWidth,
          height: constrainedHeight,
        });
      }
    };
    
    // Initial measurement
    updateDimensions();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    
    // Clean up
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
        if (containerRef.current.parentElement) {
          resizeObserver.unobserve(containerRef.current.parentElement);
        }
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Build graph data ONLY when runs change, not when runId changes
  useEffect(() => {
    // mock all the data
    const nodesMap: Map<string, GraphNode> = new Map();
    const linksList: GraphLink[] = [];
    const mainNodes: Set<string> = new Set();

    for (let runIndex = 0; runIndex < runs.length; runIndex++) {
      const run = runs[runIndex];
      const sourceArticle = run.start_article;
      const destinationArticle = run.destination_article;
      mainNodes.add(sourceArticle);
      mainNodes.add(destinationArticle);

      for (let i = 0; i < run.steps.length - 1; i++) {
        const step = run.steps[i];
        const nextStep = run.steps[i + 1];

        if (!nodesMap.has(step.article)) {
          nodesMap.set(step.article, { id: step.article, type: "fluid", radius: 5, runIds: [runIndex] });
        } else {
          const node = nodesMap.get(step.article)!;
          if (!node.runIds.includes(runIndex)) {
            node.runIds.push(runIndex);
          }
        }

        if (!nodesMap.has(nextStep.article)) {
          nodesMap.set(nextStep.article, { id: nextStep.article, type: "fluid", radius: 5, runIds: [runIndex] });
        } else {
          const node = nodesMap.get(nextStep.article)!;
          if (!node.runIds.includes(runIndex)) {
            node.runIds.push(runIndex);
          }
        }

        linksList.push({ source: step.article, target: nextStep.article, runId: runIndex });
      }
    }

    mainNodes.forEach((node) => {
        const oldNode = nodesMap.get(node)!;
        nodesMap.set(node, { ...oldNode, id: node, type: "fixed", radius: 7, isMainNode: true });
    });

    // position the main nodes in a circle
    const radius = 400;
    const centerX = 0;
    const centerY = 0;
    const mainNodesArray = Array.from(mainNodes);
    const angle = 2 * Math.PI / mainNodesArray.length;
    mainNodesArray.forEach((node, index) => {
      const nodeObj = nodesMap.get(node)!;
      nodeObj.fx = centerX + radius * Math.cos(angle * index);
      nodeObj.fy = centerY + radius * Math.sin(angle * index);
    });

    const tmpGraphData: { nodes: GraphNode[]; links: GraphLink[] } = {
      nodes: Array.from(nodesMap.values()),
      links: linksList,
    };

    setGraphData(tmpGraphData);

    return;
   
  }, [runs]); // Only depends on runs, not runId

  // Set up the force simulation
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
        // wait 100ms
        setTimeout(() => {
      const radialForceStrength = 0.7;
      const radialTargetRadius = 40;
      const linkDistance = 35;
      const chargeStrength = -100;
      const COLLISION_PADDING = 3;

      // Initialize force simulation
      graphRef.current.d3Force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: GraphNode) => d.id)
          .distance(linkDistance)
          .strength(0.9)
      );
      graphRef.current.d3Force(
        "charge",
        d3.forceManyBody().strength(chargeStrength)
      );
      graphRef.current.d3Force(
        "radial",
        d3.forceRadial(radialTargetRadius, 0, 0).strength(radialForceStrength)
      );
      graphRef.current.d3Force(
        "collide",
        d3
          .forceCollide()
          .radius((d: GraphNode) => (d.radius || 5) + COLLISION_PADDING)
      );
      graphRef.current.d3Force("center", d3.forceCenter(0, 0));

      // Give the simulation a bit of time to stabilize, then zoom to fit
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoomToFit(500,50);
        }
          }, 500);
        }, 100);
    }
  }, [graphData]);

  // Recenter graph when dimensions change
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, [dimensions]);

  // Full page resize handler
  useEffect(() => {
    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper function to determine node color based on current runId
  const getNodeColor = (node: GraphNode) => {
    if (runId !== null && node.runIds.includes(runId)) {
      // If the node is part of the selected run
      if (node.isMainNode) {
        // Main nodes (start/destination) of the selected run get highlight color
        const run = runs[runId];
        if (
          node.id === run.start_article ||
          node.id === run.destination_article
        ) {
          return STYLES.highlightColor;
        }
      }
      // Regular nodes in the selected run get highlight color
      return STYLES.highlightColor;
    }

    // Nodes not in the selected run get their default colors
    return node.type === "fixed"
      ? STYLES.fixedNodeColor
      : STYLES.fluidNodeColor;
  };

  // Helper function to determine link color based on current runId
  const getLinkColor = (link: GraphLink) => {
    return runId !== null && link.runId === runId
      ? STYLES.highlightColor
      : STYLES.linkColor;
  };


  const isLinkInCurrentRun = (link: GraphLink) => {
    return runId !== null && link.runId === runId;
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full absolute inset-0">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="id"
          nodeColor={getNodeColor}
          linkColor={getLinkColor}
          linkWidth={(link) => {
            return isLinkInCurrentRun(link) ? 4 : 1;
          }}
          nodeRelSize={5}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(
              (n) => n + fontSize * 0.2
            );

            const isInCurrentRun = node.runIds?.includes(runId);

            // Apply opacity based on node type and properties
            const opacity = isInCurrentRun ? 1.0 : STYLES.minNodeOpacity;

            // Draw node circle with appropriate styling
            ctx.globalAlpha = opacity;
            const radius = node.radius || (node.type === "fixed" ? 7 : 5);
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
            ctx.fillStyle = node.isMainNode ? STYLES.fixedNodeColor : STYLES.fluidNodeColor;
            ctx.fill();

            // Add white stroke around nodes
            ctx.strokeStyle = isInCurrentRun ? STYLES.highlightColor : "transparent";
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw label with background for better visibility
            const shouldShowLabel =
              node.type === "fixed" || isInCurrentRun;

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
              ctx.fillText(label, node.x!, node.y! + 8 + fontSize / 2);
            }
          }}
          width={dimensions.width || containerRef.current?.clientWidth || 800}
          height={dimensions.height || containerRef.current?.clientHeight || 800}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          cooldownTicks={100}
          cooldownTime={2000}
        />
      </div>
    </div>
  );
}
