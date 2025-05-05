"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function AboutTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">About Wikispeedia</CardTitle>
          <CardDescription>
            A wiki racing game where you navigate from one Wikipedia article to another using only hyperlinks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Wikispeedia (also known as the Wikipedia Game, WikiRace, or WikiClick) is a game where players race to navigate from 
            one Wikipedia article to another using only the hyperlinks within each article. The goal is to reach the target 
            article in the fewest clicks or in the shortest time.
          </p>
          
          <p>
            This implementation allows you to play against AI models or challenge yourself to find the most efficient path 
            between articles.
          </p>

          <h3 className="text-lg font-semibold mt-4">How to Play</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Select a starting article and a target article</li>
            <li>Choose to play yourself or let an AI model play</li>
            <li>Navigate through the articles using the buttons</li>
            <li>Try to reach the target article in as few clicks as possible</li>
          </ol>

          <div className="flex justify-center mt-6">
            <Button variant="outline" className="gap-2" asChild>
              <a href="https://en.wikipedia.org/wiki/Wikipedia:Wiki_Game" target="_blank" rel="noopener noreferrer">
                Learn more on Wikipedia <ExternalLink size={16} />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
