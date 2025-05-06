"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import GameComponent from "@/components/game-component";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE } from "@/lib/constants";
import { VirtualizedCombobox } from "./ui/virtualized-combobox";
import { Info, Shuffle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import popularNodes from "../../results/popular_nodes.json";

export default function PlayTab({
  startArticle,
  destinationArticle,
}: {
  startArticle?: string;
  destinationArticle?: string;
}) {
  const [player, setPlayer] = useState<"me" | "model">("model");
  const [selectedModel, setSelectedModel] = useState<string | undefined>(
    "deepseek-ai/DeepSeek-V3-0324"
  );
  const [maxHops, setMaxHops] = useState<number>(20);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<string>(
    startArticle || "Capybara"
  );
  const [targetPage, setTargetPage] = useState<string>(
    destinationArticle || "Pokémon"
  );
  const [maxTokens, setMaxTokens] = useState<number>(3000);
  const [maxLinks, setMaxLinks] = useState<number>(200);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [modelList, setModelList] = useState<string[]>([
    "deepseek-ai/DeepSeek-V3-0324",
    "Qwen/Qwen3-235B-A22B",
    "Qwen/Qwen3-30B-A3B",
    "Qwen/Qwen3-14B",
    "google/gemma-3-27b-it",
  ]);
  const [allArticles, setAllArticles] = useState<string[]>([]);

  // Server connection check
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await fetch(API_BASE + "/health");
        setIsServerConnected(response.ok);
      } catch {
        setIsServerConnected(false);
      }
    };

    // Check immediately and then every 30 seconds
    checkServerConnection();
    const interval = setInterval(checkServerConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuthentication = () => {
      const idToken = window.localStorage.getItem("huggingface_id_token");
      const accessToken = window.localStorage.getItem(
        "huggingface_access_token"
      );

      if (idToken && accessToken) {
        try {
          const idTokenObject = JSON.parse(idToken);
          if (idTokenObject.exp > Date.now() / 1000) {
            setIsAuthenticated(true);
            return;
          }
        } catch (error) {
          console.error("Error parsing ID token:", error);
        }
      }
      setIsAuthenticated(false);
    };

    checkAuthentication();
    window.addEventListener("storage", checkAuthentication);

    return () => {
      window.removeEventListener("storage", checkAuthentication);
    };
  }, []);

  useEffect(() => {
    const fetchAllArticles = async () => {
      const response = await fetch(`${API_BASE}/get_all_articles`);
      const data = await response.json();
      setAllArticles(data);
    };
    fetchAllArticles();
  }, []);

  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  const handleResetGame = () => {
    setIsGameStarted(false);
  };

  const handlePlayerChange = (value: string) => {
    setPlayer(value as "me" | "model");
  };

  const selectRandomArticle = (setter: (article: string) => void) => {
    if (popularNodes.length > 0) {
      const randomIndex = Math.floor(Math.random() * popularNodes.length);
      setter(popularNodes[randomIndex]);
    }
  };

  return (
    <div className="space-y-6">
      {!isGameStarted ? (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Game Setup</h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Player Mode</h4>
                <Tabs
                  defaultValue="me"
                  value={player}
                  onValueChange={handlePlayerChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="me">I'll Play</TabsTrigger>
                    <TabsTrigger value="model">AI Will Play</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Start Page</h4>
                  <div className="flex items-center">
                    <VirtualizedCombobox
                      options={allArticles}
                      value={startPage}
                      onValueChange={(value) => setStartPage(value)}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectRandomArticle(setStartPage)}
                      className="h-9 ml-2 whitespace-nowrap"
                    >
                      <Shuffle className="h-3.5 w-3.5 mr-1" />
                      Random
                    </Button>
                    {/* absorb rest of width */}
                    <div className="flex-1" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Target Page</h4>
                  <div className="flex items-center">
                    <VirtualizedCombobox
                      options={allArticles}
                      value={targetPage}
                      onValueChange={(value) => setTargetPage(value)}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectRandomArticle(setTargetPage)}
                      className="h-9 ml-2 whitespace-nowrap"
                    >
                      <Shuffle className="h-3.5 w-3.5 mr-1" />
                      Random
                    </Button>
                    {/* absorb rest of width */}
                    <div className="flex-1" />
                  </div>
                </div>
              </div>

              {player === "model" && (
                <>
                  <Separator className="my-4" />
                  <div className="animate-in fade-in slide-in-from-top-5 duration-300">
                    <h4 className="text-sm font-medium mb-3">Model Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label
                          htmlFor="model-select"
                          className="flex items-center gap-1 text-sm mb-2"
                        >
                          Select Model
                        </Label>
                        <Select
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={`Select a model (${modelList.length} available)`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {modelList.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="max-tokens"
                          className="flex items-center gap-1 text-sm mb-2"
                        >
                          Max Tokens
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Maximum number of tokens the model can
                                  generate per response.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="max-tokens"
                          type="number"
                          value={maxTokens}
                          onChange={(e) =>
                            setMaxTokens(Number.parseInt(e.target.value))
                          }
                          min={1}
                          max={10000}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="max-links"
                          className="flex items-center gap-1 text-sm mb-2"
                        >
                          Max Links
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Maximum number of links the model can consider
                                  per page. Small models tend to get stuck if
                                  this is too high.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <Input
                          id="max-links"
                          type="number"
                          value={maxLinks}
                          onChange={(e) =>
                            setMaxLinks(Number.parseInt(e.target.value))
                          }
                          min={1}
                          max={1000}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={handleStartGame}
                      size="lg"
                      className="px-8"
                      variant="default"
                      disabled={!isAuthenticated && player === "model"}
                    >
                      Start Game
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isAuthenticated && player === "model" && (
                  <TooltipContent>
                    <p className="max-w-xs">
                      Please sign in with Hugging Face to play the game
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {!isServerConnected && (
            <div className="text-center p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Server connection issue. Some features may be unavailable.
            </div>
          )}
        </div>
      ) : (
        <GameComponent
          player={player}
          model={player === "model" ? selectedModel : undefined}
          maxHops={maxHops}
          startPage={startPage}
          targetPage={targetPage}
          onReset={handleResetGame}
          maxTokens={maxTokens}
          maxLinks={maxLinks}
        />
      )}
    </div>
  );
}
