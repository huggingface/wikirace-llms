"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flag,
  Clock,
  Hash,
  ArrowRight,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useInference } from "@/lib/inference";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { API_BASE } from "@/lib/constants";
import ForceDirectedGraph from "./force-directed-graph";
import qwen3Data from "../../results/qwen3.json"
// Simple Switch component since it's not available in the UI components
const Switch = ({
  checked,
  onCheckedChange,
  disabled,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-ring/50 peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
};

type Message = {
  role: "user" | "assistant" | "game" | "result" | "error";
  content: string;
  metadata?: {
    page?: string;
    links?: string[];
    status?: "playing" | "won" | "lost";
    path?: string[];
  };
};

const buildPrompt = (
  current: string,
  target: string,
  path_so_far: string[],
  links: string[]
) => {
  const formatted_links = links
    .map((link, index) => `${index + 1}. ${link}`)
    .join("\n");
  const path_so_far_str = path_so_far.join(" -> ");

  return `You are playing WikiRun, trying to navigate from one Wikipedia article to another using only links.

IMPORTANT: You MUST put your final answer in <answer>NUMBER</answer> tags, where NUMBER is the link number.
For example, if you want to choose link 3, output <answer>3</answer>.

Current article: ${current}
Target article: ${target}
You have ${links.length} link(s) to choose from:
${formatted_links}

Your path so far: ${path_so_far_str}

Think about which link is most likely to lead you toward the target article.
First, analyze each link briefly and how it connects to your goal, then select the most promising one.

Remember to format your final answer by explicitly writing out the xml number tags like this: <answer>NUMBER</answer>`;
};

interface GameComponentProps {
  player: "me" | "model";
  model?: string;
  maxHops: number;
  startPage: string;
  targetPage: string;
  onReset: () => void;
  maxTokens: number;
  maxLinks: number;
}

export default function GameComponent({
  player,
  model,
  maxHops,
  startPage,
  targetPage,
  onReset,
  maxTokens,
  maxLinks,
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
  const [continuousPlay, setContinuousPlay] = useState<boolean>(true);
  const [autoRunning, setAutoRunning] = useState<boolean>(true);
  const [convo, setConvo] = useState<Message[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number | string, boolean>
  >({ game: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    status: modelStatus,
    partialText,
    inference
  } = useInference({
    apiKey:
      window.localStorage.getItem("huggingface_access_token") || undefined,
  });

  const fetchCurrentPageLinks = useCallback(async () => {
    setLinksLoading(true);
    const response = await fetch(
      `${API_BASE}/get_article_with_links/${currentPage}`
    );
    const data = await response.json();
    setCurrentPageLinks(data.links.slice(0, maxLinks));
    setLinksLoading(false);
  }, [currentPage, maxLinks]);

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
  };

  const currentRuns = useMemo(() => {
    const q3runs = qwen3Data.runs.filter((run) => run.result === "win");

    if (visitedNodes.length === 0) {
      return q3runs;
    }

    return [
      {
        steps: [
          {
            type: "start",
            article: startPage,
          },
          ...visitedNodes.map((node) => ({ type: "move", article: node })),
        ],
        start_article: startPage,
        destination_article: targetPage,
      },
      ...q3runs,
    ];
  }, [visitedNodes, startPage, targetPage]);

  const makeModelMove = async () => {
    const prompt = buildPrompt(
      currentPage,
      targetPage,
      visitedNodes,
      currentPageLinks
    );

    pushConvo({
      role: "user",
      content: prompt,
    });

    const {status, result: modelResponse} = await inference({
      model: model,
      prompt,
      maxTokens: maxTokens,
    });

    if (status === "error") {
      pushConvo({
        role: "error",
        content: "Error during inference: " + modelResponse,
      });

      setAutoRunning(false);
      return;
    }

    pushConvo({
      role: "assistant",
      content: modelResponse,
    });

    console.log("Model response", modelResponse);

    const answer = modelResponse.match(/<answer>(.*?)<\/answer>/)?.[1];
    if (!answer) {
      console.error("No answer found in model response");
      return;
    }

    // try parsing the answer as an integer
    const answerInt = parseInt(answer);
    if (isNaN(answerInt)) {
      console.error("Invalid answer found in model response");
      return;
    }

    if (answerInt < 1 || answerInt > currentPageLinks.length) {
      console.error(
        "Selected link out of bounds",
        answerInt,
        "from ",
        currentPageLinks.length,
        "links"
      );
      return;
    }

    const selectedLink = currentPageLinks[answerInt - 1];

    // Add a game status message after each move
    pushConvo({
      role: "game",
      content: `Model selected link ${answerInt}: ${selectedLink}`,
      metadata: {
        page: currentPage,
        links: [...currentPageLinks],
      },
    });

    console.log(
      "Model picked selectedLink",
      selectedLink,
      "from ",
      currentPageLinks
    );

    handleLinkClick(selectedLink);
  };

  const handleGiveUp = () => {
    setGameStatus("lost");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const pushConvo = (message: Message) => {
    setConvo((prev) => [...prev, message]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [convo, partialText]);

  const toggleMessageExpand = (index: number | string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Effect for continuous play mode
  useEffect(() => {
    if (
      continuousPlay &&
      autoRunning &&
      player === "model" &&
      gameStatus === "playing" &&
      modelStatus !== "thinking" &&
      !linksLoading
    ) {
      const timer = setTimeout(() => {
        makeModelMove();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    continuousPlay,
    autoRunning,
    player,
    gameStatus,
    modelStatus,
    linksLoading,
    currentPage,
  ]);

  // Add a result message when the game ends
  useEffect(() => {
    if (gameStatus !== "playing" && convo.length > 0 && convo[convo.length - 1].role !== "result") {
      pushConvo({
        role: "result",
        content: gameStatus === "won" 
          ? `${model} successfully navigated from ${visitedNodes[0]} to ${targetPage} in ${hops} moves!`
          : `${model} failed to reach ${targetPage} within the ${maxHops} hop limit.`,
        metadata: {
          status: gameStatus,
          path: [...visitedNodes],
        },
      });
    }
  }, [gameStatus]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-[calc(100vh-200px)] grid-rows-[auto_1fr_1fr]">
      {/* Condensed Game Status Card */}
      <Card className="p-2 col-span-12 h-12 row-start-1">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{currentPage}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{targetPage}</span>
            </div>
            <div
              className="flex items-center gap-1 cursor-help relative group"
              title="Path history"
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {hops} / {maxHops}
              </span>
              <div className="invisible absolute bottom-full left-0 mb-2 p-2 bg-popover border rounded-md shadow-md text-xs max-w-[300px] z-50 group-hover:visible whitespace-pre-wrap">
                Path: {visitedNodes.join(" → ")}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatTime(timeElapsed)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gameStatus === "playing" && (
              <>
                {player === "model" && (
                  <>
                    {continuousPlay ? (
                      <Button
                        onClick={() => setAutoRunning(!autoRunning)}
                        size="sm"
                        className="h-8"
                      >
                        {autoRunning ? "Stop" : "Start"}
                      </Button>
                    ) : (
                      <Button
                        onClick={makeModelMove}
                        disabled={modelStatus === "thinking" || linksLoading}
                        size="sm"
                        className="h-8"
                      >
                        Next Move
                      </Button>
                    )}

                    <div className="flex items-center gap-1 ml-1">
                      <Switch
                        id="continuous-play"
                        checked={continuousPlay}
                        onCheckedChange={(checked) => {
                          setContinuousPlay(checked);
                          if (!checked) setAutoRunning(false);
                        }}
                        disabled={
                          modelStatus === "thinking" ||
                          linksLoading ||
                          (continuousPlay && autoRunning)
                        }
                      />
                      <Label htmlFor="continuous-play" className="text-xs">
                        Auto
                      </Label>
                    </div>
                  </>
                )}

                {player === "me" && (
                  <Button
                    onClick={handleGiveUp}
                    variant="destructive"
                    size="sm"
                    className="h-8"
                  >
                    Give Up
                  </Button>
                )}
              </>
            )}

            {gameStatus !== "playing" && (
              <Button
                onClick={onReset}
                variant="outline"
                size="sm"
                className="h-8"
              >
                New Game
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Links panel - larger now */}
      {player === "me" && (
        <Card className="p-3 md:col-span-6 h-full overflow-hidden row-span-2 row-start-2">
          <h2 className="text-lg font-bold mb-2">
            Available Links
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-xs text-muted-foreground cursor-help inline-flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Why are some links missing?
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] p-3">
                  <p>
                    We're playing on a pruned version of Simple Wikipedia so
                    that every path between articles is possible. See dataset
                    details{" "}
                    <a
                      href="https://huggingface.co/datasets/HuggingFaceTB/simplewiki-pruned-350k"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      here
                    </a>
                    .
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>

          {gameStatus === "playing" ? (
            <div className="flex flex-wrap content-start overflow-y-auto h-[calc(100%-2.5rem)]">
              {currentPageLinks
                .sort((a, b) => a.localeCompare(b))
                .map((link) => (
                  <Button
                    key={link}
                    variant="outline"
                    size="sm"
                    className="justify-start overflow-hidden text-ellipsis whitespace-nowrap w-[calc(33.333%-0.5rem)] m-[0.25rem]"
                    onClick={() => handleLinkClick(link)}
                  >
                    {link}
                  </Button>
                ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100%-2.5rem)]">
              {gameStatus === "won" ? (
                <div className="bg-green-100 text-green-800 p-4 rounded-md w-full">
                  <h3 className="font-bold">
                    You won!
                  </h3>
                  <p>
                    You reached {targetPage} in {hops} hops.
                  </p>
                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    New Game
                  </Button>
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 p-4 rounded-md w-full">
                  <h3 className="font-bold">Game Over</h3>
                  <p>
                    You didn't reach {targetPage} within {maxHops} hops.
                  </p>
                  <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    New Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Reasoning panel - spans full height on left side */}
      {player === "model" && (
        <Card className="p-3 md:col-span-6 h-full overflow-hidden row-span-2 row-start-2">
          <h2 className="text-lg font-bold mb-2">LLM Reasoning</h2>
          <div className="overflow-y-auto h-[calc(100%-2.5rem)] space-y-2 pr-2">
            {convo.map((message, index) => {
              const isExpanded = expandedMessages[index] || false;
              
              if (message.role === "user" || message.role === "assistant") {
                const isLongUserMessage =
                  message.role === "user" && message.content.length > 300;
                const shouldTruncate = isLongUserMessage && !isExpanded;
                
                return (
                  <div
                    key={`message-${index}`}
                    className={`p-2 rounded-lg text-xs ${
                      message.role === "assistant"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                      {message.role === "assistant" ? (
                        <>
                          <Bot className="h-3 w-3" />
                          <span>Assistant</span>
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          <span>User</span>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="whitespace-pre-wrap text-xs">
                        {shouldTruncate
                          ? message.content.substring(0, 300) + "..."
                          : message.content}
                      </p>

                      {isLongUserMessage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-5 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleMessageExpand(index)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" /> Show more
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              } else if (message.role === "game") {
                // Game status block
                return (
                  <div 
                    key={`game-${index}`}
                    className="p-2 rounded-lg bg-yellow-50 border border-yellow-100 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Game Status</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground p-0"
                        onClick={() => toggleMessageExpand(index)}
                      >
                        {expandedMessages[index] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    <div>
                      <p className="font-medium">{message.content}</p>
                      {message.metadata?.page && (
                        <p className="mt-1">Current page: {message.metadata.page}</p>
                      )}
                      {message.metadata?.links && (
                        <p className="mt-1">
                          Available links: {message.metadata.links.length} 
                          {!isExpanded && message.metadata.links.length > 0 && (
                            <span className="text-muted-foreground">
                              {" "}({message.metadata.links.slice(0, 3).join(", ")}
                              {message.metadata.links.length > 3 ? "..." : ""})
                            </span>
                          )}
                        </p>
                      )}
                      
                      {isExpanded && message.metadata?.links && (
                        <div className="mt-2 space-y-1">
                          {message.metadata.links.map((link, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              {i+1}. {link}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (message.role === "result") {
                // Result block
                const isWon = message.metadata?.status === "won";
                return (
                  <div 
                    key={`result-${index}`}
                    className={`p-2 rounded-lg text-xs ${
                      isWon
                        ? "bg-green-50 border border-green-100" 
                        : "bg-red-50 border border-red-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                      <Flag className="h-3 w-3" />
                      <span>{isWon ? "Victory!" : "Game Over"}</span>
                    </div>
                    
                    <div>
                      <p>{message.content}</p>
                      
                      {message.metadata?.path && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Path: {message.metadata.path.join(" → ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              } else if (message.role === "error") {
                return (
                  <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-xs">
                    <p>{message.content}</p>
                  </div>
                );
              }
              
              return null;
            })}

            {modelStatus === "thinking" && (
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-xs">
                <div className="flex items-center gap-1 mb-1 text-xs font-medium text-muted-foreground">
                  <Bot className="h-3 w-3" />
                  <span className="animate-pulse">Thinking...</span>
                </div>
                <p className="whitespace-pre-wrap text-xs">{partialText}</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </Card>
      )}

      {/* Wikipedia view - top right quadrant */}
      <Card className="p-3 md:col-span-6 h-full overflow-hidden row-start-2">
        <h2 className="text-lg font-bold mb-2">Wikipedia View</h2>
        <div className="relative w-full h-[calc(100%-2.5rem)] overflow-hidden">
          <iframe
            style={{
              transform: "scale(0.5, 0.5)",
              width: "calc(100% * 2)",
              height: "calc(100% * 2)",
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
            src={`https://simple.wikipedia.org/wiki/${currentPage.replace(
              " ",
              "_"
            )}`}
            className="border-0"
          />
        </div>
      </Card>

      {/* Force directed graph - bottom right quadrant */}
      <Card className="p-3 md:col-span-6 h-full overflow-hidden row-start-3">
        <ForceDirectedGraph runs={currentRuns} runId={0} />
      </Card>
    </div>
  );
}
