import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewerTab from "@/components/viewer-tab";
import PlayTab from "@/components/play-tab";
import AboutTab from "@/components/about-tab";
import { SignInWithHuggingFaceButton } from "@/components/sign-in-with-hf-button";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<"view" | "play" | "about">("view");
  const [startArticle, setStartArticle] = useState<string>("");
  const [destinationArticle, setDestinationArticle] = useState<string>("");
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleTryRun = (startArticle: string, destinationArticle: string) => {
    console.log("Trying run from", startArticle, "to", destinationArticle);
    setSelectedTab("play");
    setStartArticle(startArticle);
    setDestinationArticle(destinationArticle);
  };

  return (
    <div className="container mx-auto p-4">
      {isSmallScreen && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded shadow">
          <p className="font-bold">Warning:</p>
          <p>This application doesn't work well on small screens. Please use a desktop for the best experience.</p>
        </div>
      )}
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
