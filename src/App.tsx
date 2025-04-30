import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ViewerTab from "@/components/viewer-tab";
import PlayTab from "@/components/play-tab";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Wikispeedia</h1>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="view">View Runs</TabsTrigger>
          <TabsTrigger value="play">Play Game</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <ViewerTab />
        </TabsContent>

        <TabsContent value="play">
          <PlayTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
