import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import NPCCoreModule from "./NPCCore";
import LearningEngineModule from "./LearningEngine";

const InteractionTrackerModule = buildModule("InteractionTrackerModule", (m) => {
  const { npcCore } = m.useModule(NPCCoreModule);
  const { learningEngine } = m.useModule(LearningEngineModule);

  const interactionTracker = m.contract("InteractionTracker", [npcCore, learningEngine]);

  // Set the interaction tracker address in NPCCore
  m.call(npcCore, "setInteractionTrackerAddress", [interactionTracker]);

  return { interactionTracker };
});

export default InteractionTrackerModule;