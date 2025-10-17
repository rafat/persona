
import { useReadContract, useWriteContract } from 'wagmi'
import NPCCoreAbi from '@/lib/abi/NPCCore.json'
import InteractionTrackerAbi from '@/lib/abi/InteractionTracker.json'

// TODO: Replace with actual deployed contract addresses
const npcCoreAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const interactionTrackerAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

interface InteractionContext {
  action: number;
  target: `0x${string}`;
  value1: bigint;
  value2: bigint;
  memo: `0x${string}`;
}

type NpcState = {
  id: bigint;
  name: string;
  personality: number;
  intelligence: number;
  aggression: number;
  sociability: number;
  experiencePoints: bigint;
  lastInteraction: bigint;
  isActive: boolean;
};

export function useGetNpcState(npcId: number) {
  return useReadContract({
    abi: NPCCoreAbi,
    address: npcCoreAddress,
    functionName: 'getNPCState',
    args: [npcId],
  }) as { data: NpcState | undefined, isLoading: boolean };
}

export function useGetNpcCount() {
  return useReadContract({
    abi: NPCCoreAbi,
    address: npcCoreAddress,
    functionName: 'getNPCCount',
  })
}

export function useGetRelationship(npcId: number, playerAddress: `0x${string}`) {
  return useReadContract({
    abi: NPCCoreAbi,
    address: npcCoreAddress,
    functionName: 'getRelationship',
    args: [npcId, playerAddress],
  })
}

export function useInteract() {
  const { writeContract } = useWriteContract()

  const interact = (npcId: number, context: InteractionContext) => {
    return writeContract({
      abi: InteractionTrackerAbi,
      address: interactionTrackerAddress,
      functionName: 'interact',
      args: [npcId, context],
    })
  }

  return { interact }
}
