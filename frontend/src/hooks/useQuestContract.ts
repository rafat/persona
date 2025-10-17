import { useReadContract, useWriteContract } from 'wagmi';
import QuestSystemAbi from '@/lib/abi/QuestSystem.json';

// TODO: Replace with actual deployed contract address
const questSystemAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`;

interface Quest {
  id: bigint;
  npcId: bigint;
  questType: number;
  title: string;
  description: string;
  targetValue: bigint;
  rewardTokens: bigint;
  rewardXP: bigint;
  deadline: bigint;
  isActive: boolean;
  requiredReputation: number;
}

interface PlayerQuest {
  questId: bigint;
  status: number; // 0=AVAILABLE, 1=ACTIVE, 2=COMPLETED, 3=FAILED, 4=CLAIMED
  progress: bigint;
  acceptedAt: bigint;
  completedAt: bigint;
}

export function useGetPlayerQuests(playerAddress: `0x${string}`) {
  return useReadContract({
    abi: QuestSystemAbi,
    address: questSystemAddress,
    functionName: 'getPlayerQuests',
    args: [playerAddress],
  });
}

export function useAcceptQuest() {
  const { writeContract, address: userAddress } = useWriteContract();

  const acceptQuest = (questId: number) => {
    return writeContract({
      abi: QuestSystemAbi,
      address: questSystemAddress,
      functionName: 'acceptQuest',
      args: [userAddress, questId], // First argument is player address, second is questId
    });
  };

  return { acceptQuest };
}

export function useClaimReward() {
  const { writeContract } = useWriteContract();

  const claimReward = (questId: number) => {
    return writeContract({
      abi: QuestSystemAbi,
      address: questSystemAddress,
      functionName: 'claimReward',
      args: [questId],
    });
  };

  return { claimReward };
}

export function useGetFactionReputation(playerAddress: `0x${string}`, faction: number) {
  return useReadContract({
    abi: QuestSystemAbi,
    address: questSystemAddress,
    functionName: 'getFactionReputation',
    args: [playerAddress, faction],
  });
}

export function useCreateQuest() {
  const { writeContract } = useWriteContract();

  const createQuest = (
    npcId: number,
    questType: number,
    title: string,
    description: string,
    targetValue: number,
    rewardTokens: number,
    rewardXP: number,
    deadlineDuration: number,
    requiredReputation: number
  ) => {
    return writeContract({
      abi: QuestSystemAbi,
      address: questSystemAddress,
      functionName: 'createQuest',
      args: [
        npcId,
        questType,
        title,
        description,
        targetValue,
        rewardTokens,
        rewardXP,
        deadlineDuration,
        requiredReputation
      ],
    });
  };

  return { createQuest };
}