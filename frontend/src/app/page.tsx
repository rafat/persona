"use client"
import { ConnectWallet } from "@/components/ConnectWallet";
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { NpcDashboard } from "@/components/NpcDashboard";
import { QuestLog } from "@/components/QuestLog";
import { FactionReputation } from "@/components/FactionReputation";

import { NpcInteractionDialog } from "@/components/NpcInteractionDialog";

const Game = dynamic(() => import('@/phaser/Game').then((mod) => mod.Game), {
  ssr: false,
})

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Adaptive NPCs</h1>
        <ConnectWallet />
      </header>
      <main className="flex-grow p-4">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="game">Game</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
          </TabsList>
          <TabsContent value="game" className="mt-4">
            <div className="flex gap-4">
              <Game />
              <div className="w-1/3 space-y-4">
                <NpcDashboard />
                <FactionReputation />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="npcs" className="mt-4">
            <NpcDashboard />
          </TabsContent>
          <TabsContent value="quests" className="mt-4">
            <QuestLog />
          </TabsContent>
          <TabsContent value="reputation" className="mt-4">
            <FactionReputation />
          </TabsContent>
        </Tabs>
        <NpcInteractionDialog />
      </main>
    </div>
  );
}
