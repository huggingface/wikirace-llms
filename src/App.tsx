import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewerTab from "@/components/viewer-tab";
import PlayTab from "@/components/play-tab";
import AboutTab from "@/components/about-tab";
import { SignInWithHuggingFaceButton } from "@/components/sign-in-with-hf-button";
import { useState } from "react";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<"view" | "play" | "about">("view");
  const [startArticle, setStartArticle] = useState<string>("");
  const [destinationArticle, setDestinationArticle] = useState<string>("");
  
  const handleTryRun = (startArticle: string, destinationArticle: string) => {
    console.log("Trying run from", startArticle, "to", destinationArticle);
    setSelectedTab("play");
    setStartArticle(startArticle);
    setDestinationArticle(destinationArticle);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold mb-6">WikiRacing Language Models</h1>
        <SignInWithHuggingFaceButton />
      </div>

      <Tabs defaultValue="view" className="w-full" onValueChange={(value) => setSelectedTab(value as "view" | "play")} value={selectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="view">View Runs</TabsTrigger>
          <TabsTrigger value="play">Play Game</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <ViewerTab handleTryRun={handleTryRun} />
        </TabsContent>

        <TabsContent value="play">
          <PlayTab startArticle={startArticle} destinationArticle={destinationArticle} />
        </TabsContent>

        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
