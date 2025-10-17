
"use client";

import { useGetNpcCount, useGetNpcState, useGetRelationship } from "@/hooks/useNpcContracts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAccount } from "wagmi";
import { useGameStore } from "@/store/game";
import { useEffect } from "react";

function NpcCard({ npcId }: { npcId: number }) {
  const { address } = useAccount();
  const { data: npc, isLoading: isLoadingNpc } = useGetNpcState(npcId);
  const { data: relationship, isLoading: isLoadingRelationship } = useGetRelationship(npcId, address!);
  const { setRelationshipScore } = useGameStore();

  useEffect(() => {
    if (relationship !== undefined) {
      setRelationshipScore(npcId, Number(relationship));
    }
  }, [relationship, npcId, setRelationshipScore]);

  if (isLoadingNpc || isLoadingRelationship || !npc) {
    return <Card>Loading...</Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{npc.name}</CardTitle>
        <CardDescription>ID: {npcId}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Personality: {npc.personality}</p>
        <p>Intelligence: {Number(npc.intelligence)}</p>
        <p>Aggression: {Number(npc.aggression)}</p>
        <p>Sociability: {Number(npc.sociability)}</p>
        <p>Relationship: {Number(relationship)}</p>
      </CardContent>
    </Card>
  );
}

export function NpcDashboard() {
  const { data: npcCount, isLoading } = useGetNpcCount();

  if (isLoading) {
    return <div>Loading NPCs...</div>;
  }

  const count = Number(npcCount);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">NPC Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }, (_, i) => (
          <NpcCard key={i} npcId={i} />
        ))}
      </div>
    </div>
  );
}

