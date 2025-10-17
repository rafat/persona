"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "./ui/button";
import { useGameStore } from "@/store/game";
import { useGetNpcState, useInteract } from "@/hooks/useNpcContracts";

const Interaction = {
  GREET: 0,
  TRADE: 1,
  PROVOKE: 2,
  HELP: 3,
} as const;

export function NpcInteractionDialog() {
  const { selectedNpcId, setSelectedNpcId } = useGameStore();
  const { data: npc } = useGetNpcState(selectedNpcId!);
  const { interact } = useInteract();

  const handleInteraction = (action: number) => {
    if (selectedNpcId === null) return;

    let value1 = 0;
    if (action === Interaction.TRADE) {
      value1 = 10;
    } else if (action === Interaction.HELP) {
      value1 = 50;
    }

    const context = {
      action: action,
      target: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      value1: BigInt(value1),
      value2: BigInt(0),
      memo: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    };

    interact(selectedNpcId, context);
    setSelectedNpcId(null);
  };

  return (
    <Dialog open={selectedNpcId !== null} onOpenChange={() => setSelectedNpcId(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Interacting with {npc?.name}</DialogTitle>
          <DialogDescription>
            Choose an action to perform.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
            <Button onClick={() => handleInteraction(Interaction.GREET)}>Greet</Button>
            <Button onClick={() => handleInteraction(Interaction.TRADE)}>Trade</Button>
            <Button onClick={() => handleInteraction(Interaction.PROVOKE)}>Provoke</Button>
            <Button onClick={() => handleInteraction(Interaction.HELP)}>Help</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
