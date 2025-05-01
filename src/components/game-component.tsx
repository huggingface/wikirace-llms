"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag, Clock, Hash, BarChart, ArrowRight, Bot } from "lucide-react";

const API_BASE = "http://localhost:8000"

interface GameComponentProps {
  player: "me" | "model";
  model?: string;
  maxHops: number;
  startPage: string;
  targetPage: string;
  onReset: () => void;
}

export default function GameComponent({
  player,
  model,
  maxHops,
  startPage,
  targetPage,
  onReset,
}: GameComponentProps) {
  const [currentPage, setCurrentPage] = useState<string>(startPage);
  const [currentPageLinks, setCurrentPageLinks] = useState<string[]>([]);
  const [linksLoading, setLinksLoading] = useState<boolean>(false);
  const [hops, setHops] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([startPage]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">(
    "playing"
  );

  const [isModelThinking, setIsModelThinking] = useState<boolean>(false);

  const fetchCurrentPageLinks = useCallback(async () => {
    setLinksLoading(true);
    const response = await fetch(`${API_BASE}/get_article_with_links/${currentPage}`);
    const data = await response.json();
    setCurrentPageLinks(data.links);
    setLinksLoading(false);
  }, [currentPage]);

  useEffect(() => { 
    fetchCurrentPageLinks();
  }, [fetchCurrentPageLinks]);
  

  useEffect(() => {
    if (gameStatus === "playing") {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  // Check win condition
  useEffect(() => {
    if (currentPage === targetPage) {
      setGameStatus("won");
    } else if (hops >= maxHops) {
      setGameStatus("lost");
    }
  }, [currentPage, targetPage, hops, maxHops]);

    const handleLinkClick = (link: string) => {
        if (gameStatus !== "playing") return;

        setCurrentPage(link);
        setHops((prev) => prev + 1);
        setVisitedNodes((prev) => [...prev, link]);
    }

    const makeModelMove = async () => {
        setIsModelThinking(true);

        // Simulate model thinking time
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const randomLink = currentPageLinks[Math.floor(Math.random() * currentPageLinks.length)];

        console.log("Model picked randomLink", randomLink, "from ", currentPageLinks);

        handleLinkClick(randomLink);
        setIsModelThinking(false);
    }


  // Model player effect
//   useEffect(() => {
//     if (player === "model" && gameStatus === "playing" && !isModelThinking && !linksLoading) {
//       const makeModelMove = async () => {
//         setIsModelThinking(true);

//         // Simulate model thinking time
//         await new Promise((resolve) => setTimeout(resolve, 1500));

//         // Randomly select a link
//         const randomLink =
//           currentPageLinks[Math.floor(Math.random() * currentPageLinks.length)];


//         console.log("Model picked randomLink", randomLink, "from ", currentPageLinks);

//         handleLinkClick(randomLink);
//         setIsModelThinking(false);
//       };

//       makeModelMove();
//     }
//   }, [player, currentPage, gameStatus, isModelThinking, linksLoading, currentPageLinks, handleLinkClick]);


  const handleGiveUp = () => {
    setGameStatus("lost");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Get model name from ID
  const getModelName = () => {
    const models: Record<string, string> = {
      "gpt-4o": "GPT-4o",
      "claude-3-5-sonnet": "Claude 3.5 Sonnet",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "llama-3-70b": "Llama 3 70B",
      "mistral-large": "Mistral Large",
    };
    return model ? models[model] || model : "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left pane - Current page and available links */}
      <Card className="p-4 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-4">
          {gameStatus !== "playing" && (
            <Button onClick={onReset} variant="outline">
              New Game
            </Button>
          )}
        </div>

        {/* Wikipedia iframe (mocked) */}
        <div className="bg-muted/30 rounded-md flex-1 mb-4 overflow-hidden">
          <div className="bg-white p-4 border-b">
            <h2 className="text-xl font-bold">{currentPage}</h2>
            <p className="text-sm text-muted-foreground">
              https://en.wikipedia.org/wiki/{currentPage.replace(/\s+/g, "_")}
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm">
              This is a mock Wikipedia page for {currentPage}. In the actual
              implementation, this would be an iframe showing the real Wikipedia
              page.
            </p>
          </div>
        </div>

        {/* Available links */}
        {gameStatus === "playing" && (
          <>
            <h4 className="text-sm font-medium mb-2">Available Links:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {currentPageLinks.map((link) => (
                <Button
                  key={link}
                  variant="outline"
                  size="sm"
                  className="justify-start overflow-hidden text-ellipsis whitespace-nowrap"
                  onClick={() => handleLinkClick(link)}
                  disabled={player === "model" || isModelThinking}
                >
                  {link}
                </Button>
              ))}
            </div>

            {player === "model" && (
                <Button
                    onClick={makeModelMove}
                    disabled={isModelThinking || linksLoading}
                >
                    Make Move
                </Button>
            )}
          </>
        )}

        {player === "model" && isModelThinking && gameStatus === "playing" && (
          <div className="flex items-center gap-2 text-sm animate-pulse mb-4">
            <Bot className="h-4 w-4" />
            <span>{getModelName()} is thinking...</span>
          </div>
        )}

        {gameStatus === "playing" && player === "me" && (
          <Button
            onClick={handleGiveUp}
            variant="destructive"
            className="mt-auto"
          >
            Give Up
          </Button>
        )}

        {gameStatus === "won" && (
          <div className="bg-green-100 text-green-800 p-4 rounded-md mt-auto">
            <h3 className="font-bold">
              {player === "model" ? `${getModelName()} won!` : "You won!"}
            </h3>
            <p>
              {player === "model" ? "It" : "You"} reached {targetPage} in {hops}{" "}
              hops.
            </p>
          </div>
        )}

        {gameStatus === "lost" && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md mt-auto">
            <h3 className="font-bold">Game Over</h3>
            <p>
              {player === "model" ? `${getModelName()} didn't` : "You didn't"}{" "}
              reach {targetPage} within {maxHops} hops.
            </p>
          </div>
        )}
      </Card>

      {/* Right pane - Game stats and graph */}
      <Card className="p-4 flex flex-col h-[600px]">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Flag className="h-4 w-4" /> Target
            </div>
            <div className="font-medium">{targetPage}</div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <ArrowRight className="h-4 w-4" /> Current
            </div>
            <div className="font-medium">{currentPage}</div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Hash className="h-4 w-4" /> Hops
            </div>
            <div className="font-medium">
              {hops} / {maxHops}
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Time
            </div>
            <div className="font-medium">{formatTime(timeElapsed)}</div>
          </div>
        </div>

        {player === "model" && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-blue-700">
                {getModelName()}{" "}
                {isModelThinking ? "is playing..." : "is playing"}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 bg-muted/30 rounded-md p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <BarChart className="h-4 w-4" /> Path Visualization
          </div>

          <div className="h-full">
            {/* Simple visualization of visited nodes */}
            <div className="h-full flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 300 200">
                {visitedNodes.map((node, index) => {
                  if (index === 0) return null;

                  const prevX = 50 + ((index - 1) % 3) * 100;
                  const prevY = 50 + Math.floor((index - 1) / 3) * 50;
                  const currX = 50 + (index % 3) * 100;
                  const currY = 50 + Math.floor(index / 3) * 50;

                  return (
                    <g key={index}>
                      <line
                        x1={prevX}
                        y1={prevY}
                        x2={currX}
                        y2={currY}
                        stroke="#888"
                        strokeWidth="2"
                      />
                      <circle
                        cx={currX}
                        cy={currY}
                        r="10"
                        fill={node === targetPage ? "#22c55e" : "#3b82f6"}
                      />
                      <text
                        x={currX}
                        y={currY + 25}
                        textAnchor="middle"
                        fontSize="10"
                      >
                        {node}
                      </text>
                    </g>
                  );
                })}

                {/* Starting node */}
                {visitedNodes.length > 0 && (
                  <>
                    <circle cx={50} cy={50} r="10" fill="#3b82f6" />
                    <text x={50} y={75} textAnchor="middle" fontSize="10">
                      {visitedNodes[0]}
                    </text>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
