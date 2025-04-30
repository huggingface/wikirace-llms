"use client";

// This is a placeholder component for the force-directed graph
// In a real implementation, you would use a library like D3.js or react-force-graph

interface ForceDirectedGraphProps {
  runId: number | null;
}

export default function ForceDirectedGraph({ runId }: ForceDirectedGraphProps) {
  if (!runId) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Select a run to view the path graph
      </div>
    );
  }

  // This is just a placeholder SVG - in a real implementation,
  // you would render an actual force-directed graph
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 800 600">
        {/* Center node */}
        <circle cx="400" cy="300" r="20" fill="#ff4d4f" />

        {/* Surrounding nodes */}
        <circle cx="200" cy="150" r="15" fill="#ff9c6e" />
        <circle cx="600" cy="150" r="15" fill="#ff9c6e" />
        <circle cx="200" cy="450" r="15" fill="#ff9c6e" />
        <circle cx="600" cy="450" r="15" fill="#ff9c6e" />
        <circle cx="300" cy="100" r="15" fill="#ff9c6e" />
        <circle cx="500" cy="100" r="15" fill="#ff9c6e" />
        <circle cx="300" cy="500" r="15" fill="#ff9c6e" />
        <circle cx="500" cy="500" r="15" fill="#ff9c6e" />

        {/* Lines connecting nodes */}
        <line
          x1="400"
          y1="300"
          x2="200"
          y2="150"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="600"
          y2="150"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="200"
          y2="450"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="600"
          y2="450"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="300"
          y2="100"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="500"
          y2="100"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="300"
          y2="500"
          stroke="#ffa39e"
          strokeWidth="2"
        />
        <line
          x1="400"
          y1="300"
          x2="500"
          y2="500"
          stroke="#ffa39e"
          strokeWidth="2"
        />

        {/* Secondary connections */}
        <line
          x1="200"
          y1="150"
          x2="300"
          y2="100"
          stroke="#ffa39e"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="600"
          y1="150"
          x2="500"
          y2="100"
          stroke="#ffa39e"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="200"
          y1="450"
          x2="300"
          y2="500"
          stroke="#ffa39e"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="600"
          y1="450"
          x2="500"
          y2="500"
          stroke="#ffa39e"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}
