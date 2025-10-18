import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import NPCCoreModule from "./NPCCore";

const LearningEngineModule = buildModule("LearningEngineModule", (m) => {
  const { npcCore } = m.useModule(NPCCoreModule);

  const learningEngine = m.contract("LearningEngine", [npcCore]);

  // Set the learning engine address in NPCCore
  m.call(npcCore, "setLearningEngineAddress", [learningEngine]);

  return { learningEngine };
});

export default LearningEngineModule;