"use client";

import { ForceGraph, ForceGraphNode, ForceGraphLink } from "react-vis-force";
import { Run } from "./reasoning-trace";

// import ForceGraph2D from "react-force-graph-2d";

// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

const tenChildren = [];

export default function ForceDirectedGraph({
  runs,
  runId,
}: {
  runs: Run[];
  runId: number;
}) {
  console.log("runs", runs);
  // const nodes = runs.reduce((acc, run) => {
  //     (run.steps || []).forEach((step) => {
  //         acc.add(step.article);
  //     });
  //     return acc;
  // }, new Set<string>());

  // const links = runs.reduce((acc, run) => {
  //     run.steps.forEach((step) => {
  //         acc.add({ source: step.article, target: step.next_article });
  //     });
  //     return acc;
  // }, new Set<{ source: string, target: string }>());

  // create links between all nodes
  // const links = new Set<{ source: string, target: string }>();
  // for(let i = 0; i < runs.length; i++) {
  //     const run = runs[i];
  //     for(let j = 0; j < (run.steps || []).length - 1; j++) {
  //         links.add({ source: run.steps[j].article, target: run.steps[j + 1].article });
  //     }
  // }

  return (
    <ForceGraph simulationOptions={{ animate: true, height: 300, width: 900 }}>
      {/* {Array.from(nodes).map((node) => (
            <ForceGraphNode key={node} node={{ id: node }} fill="red" />
        ))}
        {Array.from(links).map((link) => (
            <ForceGraphLink key={link.source + link.target} link={{ source: link.source, target: link.target }} />
        ))} */}
      <ForceGraphNode node={{ id: "first-node", radius: 5 }} fill="#11939A" />
      <ForceGraphNode node={{ id: "second-node", radius: 10 }} fill="#47d3d9" />

      <ForceGraphNode node={{ id: "third-node", radius: 15 }} fill="#11939A" />
      <ForceGraphNode node={{ id: "fourth-node", radius: 15 }} fill="#47d3d9" />

      <ForceGraphNode node={{ id: "fifth-node", radius: 5 }} fill="#11939A" />
      <ForceGraphNode node={{ id: "sixth-node", radius: 15 }} fill="#47d3d9" />
      <ForceGraphNode
        node={{ id: "seventh-node", radius: 10 }}
        fill="#11939A"
      />

      <ForceGraphNode node={{ id: "eighth-node", radius: 5 }} fill="#47d3d9" />
      <ForceGraphNode node={{ id: "ninth-node", radius: 5 }} fill="#11939A" />
      <ForceGraphNode node={{ id: "tenth-node", radius: 5 }} fill="#47d3d9" />
      <ForceGraphLink link={{ source: "first-node", target: "second-node" }} />
      <ForceGraphLink link={{ source: "third-node", target: "second-node" }} />
      <ForceGraphLink link={{ source: "third-node", target: "fourth-node" }} />
      <ForceGraphLink link={{ source: "fifth-node", target: "fourth-node" }} />
      <ForceGraphLink link={{ source: "fifth-node", target: "fourth-node" }} />
      <ForceGraphLink link={{ source: "sixth-node", target: "fourth-node" }} />
      <ForceGraphLink
        link={{ source: "seventh-node", target: "fourth-node" }}
      />
      <ForceGraphLink link={{ source: "eighth-node", target: "fourth-node" }} />
      <ForceGraphLink link={{ source: "ninth-node", target: "tenth-node" }} />
      <ForceGraphLink link={{ source: "tenth-node", target: "fifth-node" }} />
    </ForceGraph>
  );
}
