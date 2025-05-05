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
        nodesMap.set(node, { ...oldNode, type: "fixed", radius: 7, isMainNode: true });
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

    // for (let i = 0; i < 10; i++) {
    //   nodes.push({ id: `node${i}`, type: i === 0 || i === 9 ? "fixed" : "fluid", radius: 5, runIds: [0] });
    // }

    // for (let i = 0; i < 9; i++) {
    //   links.push({
    //     source: `node${i}`,
    //     target: `node${i + 1}`,
    //     runId: 0,
    //   });
    // }






    const tmpGraphData: { nodes: GraphNode[]; links: GraphLink[] } = {
      nodes: Array.from(nodesMap.values()),
      links: linksList,
    };

    setGraphData(tmpGraphData);

    return;
    //  const newGraphData: { nodes: GraphNode[]; links: GraphLink[] } = {
    //   nodes: [],
    //   links: [],
    // };
    // const nodesMap = new Map<string, GraphNode>();
    // const linksList: GraphLink[] = [];
    // // const mainNodeSet: Set<GraphNode> = new Set();

    // // First identify all main nodes (start and destination)
    // // runs.forEach((run, runIndex) => {
    // //   mainNodeSet.add({
    // //     id: run.start_article,
    // //     type: "fixed",
    // //     radius: 7,
    // //     runIds: [runIndex],
    // //     isMainNode: true,
    // //   });
    // //   mainNodeSet.add({
    // //     id: run.destination_article,
    // //     type: "fixed",
    // //     radius: 7,
    // //     runIds: [runIndex],
    // //     isMainNode: true,
    // //   });
    // // });

    // // Process all runs to build data with metadata
    // runs.forEach((run, runIndex) => {
    //   for (let i = 0; i < run.steps.length - 1; i++) {
    //     const step = run.steps[i];
    //     const nextStep = run.steps[i + 1];

    //     // Update or create source node
    //     if (!nodesMap.has(step.article)) {
    //       const isMainNode = i === 0 || i === run.steps.length - 2;
    //       nodesMap.set(step.article, {
    //         id: step.article,
    //         type: isMainNode ? "fixed" : "fluid",
    //         radius: isMainNode ? 7 : 5,
    //         runIds: [runIndex],
    //         isMainNode,
    //       });
    //     } else {
    //       const node = nodesMap.get(step.article)!;
    //       if (!node.runIds.includes(runIndex)) {
    //         node.runIds.push(runIndex);
    //       }
    //     }

    //     // Update or create target node
    //     if (!nodesMap.has(nextStep.article)) {
    //       const isMainNode = i === 0;
    //       nodesMap.set(nextStep.article, {
    //         id: nextStep.article,
    //         type: isMainNode ? "fixed" : "fluid",
    //         radius: isMainNode ? 7 : 5,
    //         runIds: [runIndex],
    //         isMainNode,
    //       });
    //     } else {
    //       const node = nodesMap.get(nextStep.article)!;
    //       if (!node.runIds.includes(runIndex)) {
    //         node.runIds.push(runIndex);
    //       }
    //     }

    //     // Create or update link
    //     const linkId = `${step.article}->${nextStep.article}`;
    //     linksList.push({
    //       source: step.article,
    //       target: nextStep.article,
    //       runId: runIndex,
    //       id: linkId,
    //     });

    //     // if (!linksMap.has(linkId)) {
    //     //     linksMap.set(linkId, {
    //     //         source: step.article,
    //     //         target: nextStep.article,
    //     //         runIds: [runIndex],
    //     //         id: linkId
    //     //     });
    //     // } else {
    //     //     const link = linksMap.get(linkId)!;
    //     //     if (!link.runIds.includes(runIndex)) {
    //     //         link.runIds.push(runIndex);
    //     //     }
    //     // }
    //   }
    // });

    // // Position main nodes in a circle
    // // const mainNodes = Array.from(mainNodeSet);
    // const radius = 400; // Radius of the circle
    // const centerX = 0; // Center X coordinate
    // const centerY = 0; // Center Y coordinate

    // const mainNodes = Array.from(nodesMap.values()).filter(
    //   (node) => node.type === "fixed"
    // );

    // mainNodes.forEach((node, index) => {
    //   const angle = (index * 2 * Math.PI) / mainNodes.length;
    //   if (node) {
    //     node.fx = centerX + radius * Math.cos(angle);
    //     node.fy = centerY + radius * Math.sin(angle);
    //   }
    // });

    // // Convert maps to arrays for the graph
    // newGraphData.nodes = Array.from(nodesMap.values());
    // newGraphData.links = linksList;

    // // Convert string IDs to actual node objects in links
    // newGraphData.links = linksList
    //   .map((link) => {
    //     const sourceNode = nodesMap.get(link.source as string);
    //     const targetNode = nodesMap.get(link.target as string);

    //     // Only create links when both nodes exist
    //     if (sourceNode && targetNode) {
    //       return {
    //         ...link,
    //         source: sourceNode,
    //         target: targetNode,
    //       };
    //     }
    //     // Skip this link if nodes don't exist
    //     return null;
    //   })
    //   .filter(Boolean) as GraphLink[];

    // setGraphData(newGraphData);
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
          .id((d: any) => d.id)
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
          .radius((d: any) => (d.radius || 5) + COLLISION_PADDING)
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
    <div className="w-full h-full flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="id"
          nodeColor={getNodeColor}
          linkColor={getLinkColor}
          // nodeRelSize={getNodeSize}
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

            const isInCurrentRun = node.runIds.includes(runId);

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
          width={containerRef.current?.clientWidth || 800}
          height={containerRef.current?.clientHeight || 800}
        />
      </div>
    </div>
  );
}
