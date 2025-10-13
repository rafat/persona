// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NPCCore.sol";
import "./SharedTypes.sol";

contract LearningEngine {
    NPCCore public immutable npcCore;

    struct Decision {
        SharedTypes.ResponseType responseType;   // 0: Greet, 1: Trade, 2: Attack, 3: Flee, 4: Help
        uint16 intensity;     // 0–1000
        string contextData;
    }

    constructor(address _npcCoreAddress) {
        npcCore = NPCCore(_npcCoreAddress);
    }

    function makeDecision(
        uint256 npcId,
        address player,
        SharedTypes.ActionType actionType,
        uint256 /*contextValue*/ // reserved for future use (e.g., time, location)
    ) external view returns (Decision memory) {
        NPCCore.NPC memory npc = npcCore.getNPCState(npcId);
        uint16 relationship = npcCore.getRelationship(npcId, player);

        // Base response logic
        SharedTypes.ResponseType responseType;
        uint16 intensity = 500; // default

        // Hostile NPCs more likely to attack if provoked
        if (npc.personality == 2 && actionType == SharedTypes.ActionType.Attack) {
            responseType = SharedTypes.ResponseType.Attack; // Attack
            intensity = uint16((1000 - relationship) / 2 + 500); // more hostile if low rep
        }
        // Friendly NPCs reward helpful actions
        else if (npc.personality == 0 && (actionType == SharedTypes.ActionType.Help ||
         actionType == SharedTypes.ActionType.Trade)) {
            responseType = SharedTypes.ResponseType.Help; // Help or reward
            intensity = uint16(relationship / 2 + 300);
        }
        // Neutral: respond based on relationship
        else {
            if (relationship > 700) {
                responseType = SharedTypes.ResponseType.Help; // Help
            } else if (relationship < 300 && actionType == SharedTypes.ActionType.Attack) {
                responseType = SharedTypes.ResponseType.Attack; // Attack
            } else {
                responseType = SharedTypes.ResponseType.Greet; // Greet
            }
            intensity = uint16(relationship / 2);
        }

        // Cap intensity
        if (intensity > 1000) intensity = 1000;

        return Decision(responseType, intensity, "");
    }

    function isInteractionPositive(SharedTypes.InteractionContext memory context) public pure returns (bool) { // <-- Use SharedTypes
        SharedTypes.ActionType action = context.action;
        if (action == SharedTypes.ActionType.Attack) return false;
        if (action == SharedTypes.ActionType.Help || action == SharedTypes.ActionType.Give) return true;
        return true;
    }

    function calculateInteractionOutcome(
        uint256 npcId,
        address player,
        SharedTypes.InteractionContext memory context, // <-- Use SharedTypes
        bool wasPositive
    ) external view returns (NPCCore.InteractionOutcome memory) {
        NPCCore.NPC memory npc = npcCore.getNPCState(npcId);
        uint16 relationship = npcCore.getRelationship(npcId, player);
        uint16 delta = uint16(npc.intelligence / 50) + 5;

        uint16 newRelationship;
        if (wasPositive) { newRelationship = (relationship + delta > 1000) ? 1000 : relationship + delta; }
        else { newRelationship = (relationship > delta) ? relationship - delta : 0; }

        uint16 newAggression = npc.aggression;
        uint16 newSociability = npc.sociability;
        uint16 newIntelligence = npc.intelligence;  // Start with current intelligence
        SharedTypes.ActionType action = context.action;

        // Update aggression based on actions
        if (action == SharedTypes.ActionType.Attack && !wasPositive) { 
            newAggression = (newAggression + delta > 1000) ? 1000 : newAggression + delta; 
        }
        // Update sociability based on helpful actions
        else if (action == SharedTypes.ActionType.Help && wasPositive) { 
            newSociability = (newSociability + delta > 1000) ? 1000 : newSociability + delta; 
        }
        
        // Update intelligence based on various factors
        // Intelligence increases with positive learning interactions
        if ((action == SharedTypes.ActionType.Help || action == SharedTypes.ActionType.Trade || 
             action == SharedTypes.ActionType.Quest) && wasPositive) {
            // Learning from positive social interactions
            newIntelligence = (newIntelligence + (delta / 2) > 1000) ? 1000 : newIntelligence + (delta / 2);
        } else if (action == SharedTypes.ActionType.Attack && !wasPositive) {
            // Learning from negative experiences (becoming more cautious)
            newIntelligence = (newIntelligence + (delta / 4) > 1000) ? 1000 : newIntelligence + (delta / 4);
        }

        string memory memorySnippet = generateMemorySnippet(context);

        return NPCCore.InteractionOutcome({
            newRelationshipScore: newRelationship,
            newAggression: newAggression,
            newSociability: newSociability,
            newIntelligence: newIntelligence,
            memorySnippet: memorySnippet
        });
    }

    function generateMemorySnippet(SharedTypes.InteractionContext memory context) internal pure returns (string memory) { // <-- Use SharedTypes
        SharedTypes.ActionType action = context.action;
        if (action == SharedTypes.ActionType.Attack) { return string.concat("attack:dmg:", uintToString(context.value1)); }
        if (action == SharedTypes.ActionType.Help) { return "help:player"; }
        if (action == SharedTypes.ActionType.Give) { return string.concat("give:item:", uintToString(context.value1), ":qty:", uintToString(context.value2)); }
        return "greet:player";
    }

    function uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits -= 1; buffer[digits] = bytes1(uint8(48 + uint256(value % 10))); value /= 10; }
        return string(buffer);
    }


}