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


export default function PlayTab() {
  const [player, setPlayer] = useState<"me" | "model">("me");
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [maxHops, setMaxHops] = useState<number>(20);
  const [nodeList, setNodeList] = useState<string>("default");
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<string>("Dogs");
  const [targetPage, setTargetPage] = useState<string>("Canada");
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [maxLinks, setMaxLinks] = useState<number>(200);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [modelList, setModelList] = useState<{id: string, name: string, author: string, likes: number, trendingScore: number}[]>([]);
  const [allArticles, setAllArticles] = useState<string[]>([]);
  // Server connection check
  useEffect(() => {
    fetchAvailableModels();
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

  const fetchAvailableModels = async () => {
    const response = await fetch(
      "https://huggingface.co/api/models?inference_provider=all&pipeline_tag=text-generation"
    );
    const models = await response.json()
    const filteredModels = models.filter((m: any) => m.tags.includes('text-generation'))
    const modelList = filteredModels.map((m: any) => ({
        id: m.id,
        likes: m.likes,
        trendingScore: m.trendingScore,
        author: m.id.split('/')[0],
        name: m.id.split('/')[1],
    }));
    console.log("got model list", modelList);
    setModelList(modelList);
  }

  return (
    <div className="space-y-4">
      {!isGameStarted ? (
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            <div>
              <Label htmlFor="player-select" className="block mb-2">
                Player
              </Label>
              <Tabs
                defaultValue="me"
                value={player}
                onValueChange={handlePlayerChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="me">Me</TabsTrigger>
                  <TabsTrigger value="model">Model</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label htmlFor="start-page" className="block mb-2">
                Start Page
              </Label>
              <VirtualizedCombobox
                options={allArticles}
                value={startPage}
                onValueChange={(value) => setStartPage(value)}
                searchPlaceholder="e.g. Dogs"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="start-page" className="block mb-2">
                  Target Page
                </Label>
                <VirtualizedCombobox
                  options={allArticles}
                  value={targetPage}
                  onValueChange={(value) => setTargetPage(value)}
                  searchPlaceholder="e.g. Canada"
                />
              </div>
              <Button onClick={handleStartGame} className="mb-0.5">
                Start Game
              </Button>
            </div>
          </div>

          {player === "model" && (
            <div className="md:col-span-3 animate-in fade-in slide-in-from-top-5 duration-300 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="model-select" className="block mb-2">
                  Select Model
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Select a model (${modelList.length} models available)`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {modelList.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max-tokens" className="block mb-2">
                  Max Tokens
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
                <Label htmlFor="max-links" className="block mb-2">
                  Max Links
                </Label>
                <Input
                  id="max-links"
                  type="number"
                  value={maxLinks}
                  onChange={(e) => setMaxLinks(Number.parseInt(e.target.value))}
                  min={1}
                  max={1000}
                />
              </div>
            </div>
          )}
        </Card>
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
