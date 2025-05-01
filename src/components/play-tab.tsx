"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun } from "lucide-react";
import { Wifi, WifiOff } from "lucide-react";
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

const API_BASE = "http://localhost:8000/"

// Available AI models
const aiModels = [
  { id: "gpt-4o", name: "GPT-4o", category: "OpenAI" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", category: "Anthropic" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", category: "Google" },
  { id: "llama-3-70b", name: "Llama 3 70B", category: "Meta" },
  { id: "mistral-large", name: "Mistral Large", category: "Mistral AI" },
];

export default function PlayTab() {
  const [player, setPlayer] = useState<"me" | "model">("me");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [maxHops, setMaxHops] = useState<number>(20);
  const [nodeList, setNodeList] = useState<string>("default");
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [startPage, setStartPage] = useState<string>("Dogs");
  const [targetPage, setTargetPage] = useState<string>("Canada");

   const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

   // Server connection check
   useEffect(() => {
     const checkServerConnection = async () => {
       try {
         const response = await fetch(API_BASE);
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

  const handleStartGame = () => {
    setIsGameStarted(true);
  };

  const handleResetGame = () => {
    setIsGameStarted(false);
  };

  const handlePlayerChange = (value: string) => {
    setPlayer(value as "me" | "model");
  };

  return (
    <div className="space-y-4">
      {!isGameStarted ? (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
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

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  {isServerConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={
                      isServerConnected ? "text-green-500" : "text-red-500"
                    }
                  >
                    {isServerConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>

              {player === "model" && (
                <div className="animate-in fade-in slide-in-from-top-5 duration-300">
                  <Label htmlFor="model-select" className="block mb-2">
                    Select Model
                  </Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(
                        aiModels.reduce((acc, model) => {
                          if (!acc[model.category]) {
                            acc[model.category] = [];
                          }
                          acc[model.category].push(model);
                          return acc;
                        }, {} as Record<string, typeof aiModels>)
                      ).map(([category, models]) => (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="max-hops" className="block mb-2">
                Max Hops
              </Label>
              <Input
                id="max-hops"
                type="number"
                value={maxHops}
                onChange={(e) => setMaxHops(Number.parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>

            <div>
              <Label htmlFor="node-list" className="block mb-2">
                Node List
              </Label>
              <Tabs
                defaultValue="default"
                value={nodeList}
                onValueChange={setNodeList}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="default">Default</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="start-page" className="block mb-2">
                Start Page
              </Label>
              <Input
                id="start-page"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                placeholder="e.g. Dogs"
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label
                  htmlFor="target-page"
                  className="flex items-center gap-1 mb-2"
                >
                  Target Page <Sun className="h-4 w-4 text-yellow-500" />
                </Label>
                <Input
                  id="target-page"
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                  placeholder="e.g. Canada"
                />
              </div>
              <Button onClick={handleStartGame} className="mb-0.5">
                Start Game
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <GameComponent
          player={player}
          model={player === "model" ? selectedModel : undefined}
          maxHops={maxHops}
          startPage={startPage}
          targetPage={targetPage}
          onReset={handleResetGame}
        />
      )}
    </div>
  );
}
