// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NPCCore.sol";
import "./SharedTypes.sol";

contract LearningEngine {
    NPCCore public immutable npcCore;

    struct Decision {
        SharedTypes.ResponseType responseType;   // Greet, Trade, Attack, Flee, Help, Ignore 
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
        string memory contextData = "";

        // Enhanced decision-making algorithm considering personality, relationship, and action type
        if (actionType == SharedTypes.ActionType.Attack) {
            // If attacked, respond with attack, flee, or ignore depending on relative strength
            if (npc.aggression > 700) {
                responseType = SharedTypes.ResponseType.Attack;
                intensity = uint16(npc.aggression / 2 + relationship / 3);
                contextData = "defensive_response";
            } else if (npc.aggression < 300) {
                responseType = SharedTypes.ResponseType.Flee;
                intensity = uint16(500 + (1000 - npc.aggression) / 3);
                contextData = "retreat";
            } else {
                // Moderate aggression NPCs might ignore or respond minimally
                responseType = SharedTypes.ResponseType.Ignore;
                intensity = uint16(200 + relationship / 4);
                contextData = "cautious_ignore";
            }
        } else if (actionType == SharedTypes.ActionType.Help || actionType == SharedTypes.ActionType.Give) {
            // Positive actions elicit positive responses from most NPCs
            if (npc.sociability > 700) {
                responseType = SharedTypes.ResponseType.Help;
                intensity = uint16(relationship / 2 + npc.sociability / 3);
                contextData = "grateful_assistance";
            } else if (npc.personality == 0) { // Friendly personality
                responseType = SharedTypes.ResponseType.Greet;
                intensity = uint16(relationship / 2 + 200);
                contextData = "friendly_greeting";
            } else if (npc.sociability > 400) {
                responseType = SharedTypes.ResponseType.Greet;
                intensity = uint16(relationship / 3 + 150);
                contextData = "polite_greeting";
            } else {
                // Less social NPCs may still acknowledge help but with lower intensity
                responseType = SharedTypes.ResponseType.Ignore;
                intensity = uint16(relationship / 4 + 100);
                contextData = "reserved_acknowledgment";
            }
        } else if (actionType == SharedTypes.ActionType.Trade) {
            // Trading behavior depends on intelligence and sociability
            if (npc.sociability > 500 && npc.intelligence > 500) {
                responseType = SharedTypes.ResponseType.Trade;
                intensity = uint16((npc.sociability + npc.intelligence) / 3);
                contextData = "favorable_terms";
            } else if (relationship > 500) {
                responseType = SharedTypes.ResponseType.Trade;
                intensity = uint16(relationship / 3 + 100);
                contextData = "trusted_trade";
            } else {
                // Low relationship, low social NPCs may be reluctant to trade
                responseType = SharedTypes.ResponseType.Ignore;
                intensity = uint16(relationship / 5 + 50);
                contextData = "hesitant_trade";
            }
        } else if (actionType == SharedTypes.ActionType.Greet) {
            // Greeting responses vary by personality and sociability
            if (npc.sociability > 700) {
                responseType = SharedTypes.ResponseType.Greet;
                intensity = uint16(relationship / 2 + npc.sociability / 4);
                contextData = "warm_greeting";
            } else if (npc.personality == 0 && relationship > 300) { // Friendly + positive relationship
                responseType = SharedTypes.ResponseType.Greet;
                intensity = uint16(relationship / 2 + 100);
                contextData = "friendly_greeting";
            } else if (npc.personality == 1 && relationship > 600) { // Neutral + good relationship
                responseType = SharedTypes.ResponseType.Greet;
                intensity = uint16(relationship / 3 + 50);
                contextData = "respectful_greeting";
            } else {
                responseType = SharedTypes.ResponseType.Ignore;
                intensity = uint16(relationship / 4 + 50);
                contextData = "distant_acknowledgment";
            }
        } else if (actionType == SharedTypes.ActionType.Quest) {
            // Quest-related interactions depend on faction and relationship
            if (npc.faction == NPCCore.Faction.ELDER || npc.faction == NPCCore.Faction.VILLAGER) {
                if (relationship > 400) {
                    responseType = SharedTypes.ResponseType.Help;
                    intensity = uint16(relationship / 2 + 100);
                    contextData = "quest_assistance";
                } else {
                    responseType = SharedTypes.ResponseType.Ignore;
                    intensity = uint16(relationship / 4 + 50);
                    contextData = "reluctant_help";
                }
            } else if (npc.faction == NPCCore.Faction.MERCHANT) {
                if (npc.sociability > 400) {
                    responseType = SharedTypes.ResponseType.Greet;
                    intensity = uint16(npc.sociability / 3 + 50);
                    contextData = "business_greeting";
                } else {
                    responseType = SharedTypes.ResponseType.Ignore;
                    intensity = uint16(relationship / 4 + 30);
                    contextData = "business_hesitant";
                }
            } else {
                // Guard or other factions
                responseType = SharedTypes.ResponseType.Greet; // At least acknowledge
                intensity = uint16(relationship / 4 + 75);
                contextData = "formal_acknowledgment";
            }
        } else {
            // Default response for Greet or other action types
            // Use a more sophisticated algorithm based on personality, relationship, and traits
            uint16 combinedFactor = uint16(
                (relationship * 3 + npc.sociability * 2 + npc.intelligence) / 6
            );

            if (combinedFactor > 700) {
                responseType = SharedTypes.ResponseType.Greet;
                intensity = combinedFactor;
                contextData = "positive_response";
            } else if (combinedFactor > 500) {
                responseType = SharedTypes.ResponseType.Ignore;
                intensity = combinedFactor - 200;
                contextData = "neutral_response";
            } else {
                // Low combined factor leads to ignore or flee if aggressive
                if (npc.aggression > 600 && relationship < 300) {
                    responseType = SharedTypes.ResponseType.Flee;
                    intensity = uint16(1000 - combinedFactor);
                    contextData = "avoid_response";
                } else {
                    responseType = SharedTypes.ResponseType.Ignore;
                    intensity = combinedFactor / 2;
                    contextData = "indifferent_response";
                }
            }
        }

        // Adjust intensity based on NPC's core traits
        // Use safe math to avoid overflow
        if (responseType == SharedTypes.ResponseType.Attack && npc.aggression > 500) {
            // Calculate with safe multiplication
            uint256 adjustedIntensity = (uint256(intensity) * (1000 + npc.aggression)) / 1000;
            intensity = uint16(adjustedIntensity > 1000 ? 1000 : adjustedIntensity);
        } else if (responseType == SharedTypes.ResponseType.Help && npc.sociability > 500) {
            uint256 adjustedIntensity = (uint256(intensity) * (1000 + npc.sociability)) / 1000;
            intensity = uint16(adjustedIntensity > 1000 ? 1000 : adjustedIntensity);
        } else if (responseType == SharedTypes.ResponseType.Flee && (1000 - npc.aggression) > 500) {
            uint256 adjustedIntensity = (uint256(intensity) * (1500 - npc.aggression)) / 1000;
            intensity = uint16(adjustedIntensity > 1000 ? 1000 : adjustedIntensity);
        }

        // Final cap intensity
        if (intensity > 1000) intensity = 1000;
        // intensity cannot be negative in current implementation, but keeping for safety
        if (intensity > type(uint16).max) intensity = type(uint16).max;

        return Decision(responseType, intensity, contextData);
    }

    function isInteractionPositive(SharedTypes.InteractionContext memory context) public pure returns (bool) { // <-- Use SharedTypes
        SharedTypes.ActionType action = context.action;
        if (action == SharedTypes.ActionType.Attack) return false;
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