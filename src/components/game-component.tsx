"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag, Clock, Hash, ArrowRight, Bot, User, ChevronDown, ChevronUp } from "lucide-react";
import { useInference } from "@/lib/inference";

import { API_BASE } from "@/lib/constants";


type Message = {
  role: "user" | "assistant";
  content: string;
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

  const [convo, setConvo] = useState<Message[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { status: modelStatus, partialText, inference } = useInference({
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

    const modelResponse = await inference({
      model: model,
      prompt,
      maxTokens: maxTokens,
    });

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

  const toggleMessageExpand = (index: number) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
      <Card className="p-4 flex col-span-2">
        <h2 className="text-xl font-bold">Game Status</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <ArrowRight className="h-4 w-4" /> Current
            </div>
            <div className="font-medium">{currentPage}</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
              <Flag className="h-4 w-4" /> Target
            </div>
            <div className="font-medium">{targetPage}</div>
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
                {model} {modelStatus === "thinking" ? "is thinking..." : "is playing"}
              </span>
            </div>
          </div>
        )}
      </Card>
      {/* Left pane - Current page and available links */}
      <Card className="p-4 flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-bold">Available Links</h2>
        <div className="flex justify-between items-center mb-4">
          {gameStatus !== "playing" && (
            <Button onClick={onReset} variant="outline">
              New Game
            </Button>
          )}
        </div>

        {/* Available links */}
        {gameStatus === "playing" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 overflow-y-auto max-h-[200px]">
              {currentPageLinks
                .sort((a, b) => a.localeCompare(b))
                .map((link) => (
                  <Button
                    key={link}
                    variant="outline"
                    size="sm"
                    className="justify-start overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => handleLinkClick(link)}
                    disabled={player === "model" || modelStatus === "thinking"}
                  >
                    {link}
                  </Button>
                ))}
            </div>

            {player === "model" && (
              <Button
                onClick={makeModelMove}
                disabled={modelStatus === "thinking" || linksLoading}
              >
                Make Move
              </Button>
            )}
          </>
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
              {player === "model" ? `${model} won!` : "You won!"}
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
              {player === "model" ? `${model} didn't` : "You didn't"} reach{" "}
              {targetPage} within {maxHops} hops.
            </p>
          </div>
        )}
      </Card>

      <Card className="p-4 flex flex-col h-full overflow-hidden">
        <h2 className="text-xl font-bold mb-4">LLM Reasoning</h2>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {convo.map((message, index) => {
            const isExpanded = expandedMessages[index] || false;
            const isLongUserMessage = message.role === "user" && message.content.length > 300;
            const shouldTruncate = isLongUserMessage && !isExpanded;
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  message.role === "assistant" 
                    ? "bg-blue-50 border border-blue-100" 
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-sm font-medium text-muted-foreground">
                  {message.role === "assistant" ? (
                    <>
                      <Bot className="h-4 w-4" />
                      <span>Assistant</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      <span>User</span>
                    </>
                  )}
                </div>
                
                <div>
                  <p className="whitespace-pre-wrap text-sm">
                    {shouldTruncate 
                      ? message.content.substring(0, 300) + "..." 
                      : message.content
                    }
                  </p>
                  
                  {isLongUserMessage && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-1 h-6 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleMessageExpand(index)}
                    >
                      {isExpanded 
                        ? <><ChevronUp className="h-3 w-3" /> Show less</> 
                        : <><ChevronDown className="h-3 w-3" /> Show more</>
                      }
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {modelStatus === "thinking" && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2 mb-1 text-sm font-medium text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span className="animate-pulse">Thinking...</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{partialText}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* <Card className="p-4 flex flex-col max-h-[500px] overflow-y-auto">
        <iframe
          src={`https://simple.wikipedia.org/wiki/${currentPage.replace(
            /\s+/g,
            "_"
          )}`}
          className="w-full h-full"
        />
      </Card> */}
    </div>
  );
}
