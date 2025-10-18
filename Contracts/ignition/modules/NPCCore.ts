import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NPCCoreModule = buildModule("NPCCoreModule", (m) => {
  const npcCore = m.contract("NPCCore");

  return { npcCore };
});

export default NPCCoreModule;