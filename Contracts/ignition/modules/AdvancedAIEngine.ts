import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import NPCCoreModule from "./NPCCore";

const AdvancedAIEngineModule = buildModule("AdvancedAIEngineModule", (m) => {
  const { npcCore } = m.useModule(NPCCoreModule);

  const advancedAIEngine = m.contract("AdvancedAIEngine", [npcCore]);

  return { advancedAIEngine };
});

export default AdvancedAIEngineModule;