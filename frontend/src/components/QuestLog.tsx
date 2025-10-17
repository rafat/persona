"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game";
import { useAccount } from "wagmi";
import { useAcceptQuest, useGetPlayerQuests, useClaimReward } from "@/hooks/useQuestContract";

export function QuestLog() {
  const { address } = useAccount();
  const { quests } = useGameStore();
  const { acceptQuest } = useAcceptQuest();
  const { claimReward } = useClaimReward();

  if (!address) {
    return <div>Connect your wallet to view quests</div>;
  }

  const activeQuests = quests.filter(quest => quest.status === 'active');
  const availableQuests = quests.filter(quest => quest.status === 'available');
  const completedQuests = quests.filter(quest => quest.status === 'completed');

  const handleAcceptQuest = (questId: number) => {
    if (address) {
      acceptQuest(questId);
    }
  };

  const handleClaimReward = (questId: number) => {
    if (address) {
      claimReward(questId);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Quest Log</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Quests</CardTitle>
          <CardDescription>Your current missions</CardDescription>
        </CardHeader>
        <CardContent>
          {activeQuests.length === 0 ? (
            <p>No active quests. Check available quests below.</p>
          ) : (
            <div className="space-y-3">
              {activeQuests.map(quest => (
                <Card key={quest.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (quest.progress / quest.targetValue) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm">Progress: {quest.progress}/{quest.targetValue}</p>
                    <p className="text-sm">Reward: {quest.rewardTokens} STT, {quest.rewardXP} XP</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Quests</CardTitle>
          <CardDescription>Quests you can accept</CardDescription>
        </CardHeader>
        <CardContent>
          {availableQuests.length === 0 ? (
            <p>No available quests. Try interacting with NPCs!</p>
          ) : (
            <div className="space-y-3">
              {availableQuests.map(quest => (
                <Card key={quest.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                    <p className="text-sm">Reward: {quest.rewardTokens} STT, {quest.rewardXP} XP</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => handleAcceptQuest(quest.id)}
                    >
                      Accept Quest
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Quests</CardTitle>
          <CardDescription>Completed quests ready for rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {completedQuests.length === 0 ? (
            <p>No completed quests to claim.</p>
          ) : (
            <div className="space-y-3">
              {completedQuests.map(quest => (
                <Card key={quest.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{quest.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{quest.description}</p>
                    <p className="text-sm">Reward: {quest.rewardTokens} STT, {quest.rewardXP} XP</p>
                    <Button 
                      className="mt-2" 
                      onClick={() => handleClaimReward(quest.id)}
                    >
                      Claim Reward
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}