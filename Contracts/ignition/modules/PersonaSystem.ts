import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import NPCCoreModule from "./NPCCore";
import LearningEngineModule from "./LearningEngine";
import QuestSystemModule from "./QuestSystem";
import InteractionTrackerModule from "./InteractionTracker";
import AdvancedAIEngineModule from "./AdvancedAIEngine";

const PersonaSystemModule = buildModule("PersonaSystem", (m) => {
  // Deploy contracts in dependency order
  const { npcCore } = m.useModule(NPCCoreModule);
  const { learningEngine } = m.useModule(LearningEngineModule);
  const { questSystem } = m.useModule(QuestSystemModule);
  const { interactionTracker } = m.useModule(InteractionTrackerModule);
  const { advancedAIEngine } = m.useModule(AdvancedAIEngineModule);

  // Connect QuestSystem to InteractionTracker
  m.call(questSystem, "setInteractionTrackerAddress", [interactionTracker]);

  return {
    npcCore,
    learningEngine,
    questSystem,
    interactionTracker,
    advancedAIEngine
  };
});

export default PersonaSystemModule;