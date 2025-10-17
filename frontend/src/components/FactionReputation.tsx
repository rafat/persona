"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGameStore } from "@/store/game";
import { useAccount } from "wagmi";

const FACTION_NAMES = ["Guard", "Merchant", "Villager", "Elder", "Farmer"];
const REPUTATION_LEVELS = [
  { min: -1000, max: -750, name: "Hostile" },
  { min: -749, max: -250, name: "Unfriendly" },
  { min: -249, max: 249, name: "Neutral" },
  { min: 250, max: 749, name: "Friendly" },
  { min: 750, max: 1000, name: "Respected" },
];

export function FactionReputation() {
  const { address } = useAccount();
  const { factionReputation } = useGameStore();

  if (!address) {
    return <div>Connect your wallet to view faction reputation</div>;
  }

  const getReputationLevel = (reputation: number) => {
    for (const level of REPUTATION_LEVELS) {
      if (reputation >= level.min && reputation <= level.max) {
        return level.name;
      }
    }
    return "Unknown";
  };

  const getReputationColor = (reputation: number) => {
    if (reputation < -250) return "text-red-500";
    if (reputation < 250) return "text-gray-500";
    if (reputation < 750) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faction Reputation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FACTION_NAMES.map((faction, index) => {
            const reputation = factionReputation[`${faction}_${address}`] || 0;
            const levelName = getReputationLevel(reputation);
            const colorClass = getReputationColor(reputation);

            return (
              <div key={faction} className="border rounded-lg p-4">
                <h3 className="font-semibold">{faction}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className={`font-medium ${colorClass}`}>
                    {reputation}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {levelName}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (reputation + 1000) / 20))}%`,
                      marginLeft: reputation < 0 ? `${Math.max(0, (reputation + 1000) / 20)}%` : '0%'
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}