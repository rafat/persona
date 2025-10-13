// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NPCCore.sol";
import "./LearningEngine.sol";
import "./SharedTypes.sol";

contract InteractionTracker {
    NPCCore public immutable npcCore;
    LearningEngine public immutable learningEngine;

    /**
     * @dev Emitted after a successful interaction, providing a summary for off-chain indexers.
     * This is the ONLY source of historical data, making the system scalable.
     */
    event NPCInteraction(
        uint256 indexed npcId,
        address indexed player,
        SharedTypes.ActionType action,
        bool wasPositive
    );

    /**
     * @param _npcCoreAddress The deployed address of the NPCCore contract.
     * @param _learningEngineAddress The deployed address of the LearningEngine contract.
     */
    constructor(address _npcCoreAddress, address _learningEngineAddress) {
        npcCore = NPCCore(_npcCoreAddress);
        learningEngine = LearningEngine(_learningEngineAddress);
    }



    /**
     * @notice The main function for a player to interact with an NPC.
     * @param npcId The ID of the NPC being interacted with.
     * @param context A struct containing all the details of the player's action.
     */
    function interact(uint256 npcId, SharedTypes.InteractionContext calldata context) external {
        require(npcCore.getNPCState(npcId).isActive, "NPC is not active");
        require(msg.sender != address(0), "Invalid player address");
        require(npcId < npcCore.getNPCCount(), "Invalid NPC ID");
        // First, ask the LearningEngine to determine the nature of the interaction.
        bool isPositive = learningEngine.isInteractionPositive(context);

        // Step 1: CALCULATE the outcome.
        // This is a view call to the LearningEngine, which returns the calculated changes.
        NPCCore.InteractionOutcome memory outcome = learningEngine.calculateInteractionOutcome(
            npcId,
            msg.sender, // The player is always the message sender.
            context,
            isPositive
        );

        // Step 2: APPLY the outcome.
        // This is the single, state-changing call to NPCCore that updates everything at once.
        npcCore.applyInteractionOutcome(npcId, msg.sender, outcome);

        // Step 3: EMIT the event.
        // Log the interaction for frontends and data analytics services to consume.
        emit NPCInteraction(npcId, msg.sender, context.action, isPositive);
    }

    /**
     * @notice Helper function to check if an interaction would be valid without executing it
     * @param npcId The ID of the NPC to check
     * @return bool Whether the NPC is active and can be interacted with
     */
    function canInteractWith(uint256 npcId) external view returns (bool) {
        try npcCore.getNPCState(npcId) returns (NPCCore.NPC memory npc) {
            return npc.isActive;
        } catch {
            return false;
        }
    }
}