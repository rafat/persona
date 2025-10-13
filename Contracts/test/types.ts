export interface NPCStruct {
  id: bigint;
  name: string;
  personality: bigint;
  intelligence: bigint;
  aggression: bigint;
  sociability: bigint;
  experiencePoints: bigint;
  lastInteraction: bigint;
  isActive: boolean;
}

export interface InteractionOutcome {
    newRelationshipScore: bigint;
    newAggression: bigint;
    newSociability: bigint;
    newIntelligence: bigint;
    memorySnippet: string;
}