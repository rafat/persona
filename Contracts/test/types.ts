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

export interface InteractionContext {
  action: bigint;
  target: string;
  value1: bigint;
  value2: bigint;
  memo: string;
}

// Additional types for contract return values
export interface Decision {
  responseType: number;
  intensity: number;
  contextData: string;
}

export interface PlayerQuest {
  status: bigint;
  progress: bigint;
  acceptedAt: bigint;
}