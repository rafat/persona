import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import NPCCoreModule from "./NPCCore";

const QuestSystemModule = buildModule("QuestSystemModule", (m) => {
  const { npcCore } = m.useModule(NPCCoreModule);

  const questSystem = m.contract("QuestSystem", [npcCore]);

  return { questSystem };
});

export default QuestSystemModule;