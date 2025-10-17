import { create } from 'zustand'

interface Quest {
  id: number;
  npcId: number;
  title: string;
  description: string;
  status: 'available' | 'active' | 'completed' | 'claimed';
  progress: number;
  targetValue: number;
  rewardTokens: number;
  rewardXP: number;
}

interface GameState {
  selectedNpcId: number | null
  setSelectedNpcId: (npcId: number | null) => void
  relationshipScores: Record<number, number>
  setRelationshipScore: (npcId: number, score: number) => void
  quests: Quest[]
  addQuest: (quest: Quest) => void
  updateQuestProgress: (questId: number, progress: number) => void
  completeQuest: (questId: number) => void
  claimQuest: (questId: number) => void
  factionReputation: Record<string, number> // key: faction_playerAddress
  setFactionReputation: (faction: string, playerAddress: string, reputation: number) => void
  playerReputation: Record<string, number> // key: playerAddress_npcId
  setPlayerReputation: (playerAddress: string, npcId: number, reputation: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedNpcId: null,
  setSelectedNpcId: (npcId) => set({ selectedNpcId: npcId }),
  relationshipScores: {},
  setRelationshipScore: (npcId, score) =>
    set((state) => ({
      relationshipScores: {
        ...state.relationshipScores,
        [npcId]: score,
      },
    })),
  quests: [],
  addQuest: (quest) =>
    set((state) => ({
      quests: [...state.quests, quest]
    })),
  updateQuestProgress: (questId, progress) =>
    set((state) => ({
      quests: state.quests.map(quest =>
        quest.id === questId ? { ...quest, progress } : quest
      )
    })),
  completeQuest: (questId) =>
    set((state) => ({
      quests: state.quests.map(quest =>
        quest.id === questId ? { ...quest, status: 'completed' } : quest
      )
    })),
  claimQuest: (questId) =>
    set((state) => ({
      quests: state.quests.map(quest =>
        quest.id === questId ? { ...quest, status: 'claimed' } : quest
      )
    })),
  factionReputation: {},
  setFactionReputation: (faction, playerAddress, reputation) =>
    set((state) => ({
      factionReputation: {
        ...state.factionReputation,
        [`${faction}_${playerAddress}`]: reputation,
      }
    })),
  playerReputation: {},
  setPlayerReputation: (playerAddress, npcId, reputation) =>
    set((state) => ({
      playerReputation: {
        ...state.playerReputation,
        [`${playerAddress}_${npcId}`]: reputation,
      }
    })),
}))
