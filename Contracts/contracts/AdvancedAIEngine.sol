// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NPCCore.sol";

/**
 * @title AdvancedAIEngine
 * @author [Your Name]
 * @notice This contract acts as a lean, on-chain registry. It links an NPC's on-chain ID
 * to a pointer for rich, descriptive, off-chain metadata (like personality, background, LLM prompts).
 * This hybrid model is gas-efficient and scalable.
 */
contract AdvancedAIEngine {
    NPCCore public immutable npcCore;

    /**
     * @dev The core of the new design:
     * Mapping from an NPC ID to a content identifier (e.g., an IPFS CID).
     * The CID points to a JSON file off-chain that contains all the rich personality data,
     * such as background stories, preferences, catchphrases, and custom LLM prompts.
     * We use bytes32 as it's a gas-efficient way to store hashes like an IPFS CID.
     */
    mapping(uint256 => bytes32) public npcDataPointer;

    event NpcDataPointerUpdated(uint256 indexed npcId, bytes32 newPointer);

    constructor(address _npcCoreAddress) {
        npcCore = NPCCore(_npcCoreAddress);
    }

    /**
     * @notice Sets or updates the off-chain data pointer for a specific NPC.
     * @dev Only the contract owner (representing a trusted backend or developer) can call this.
     * The off-chain data should be structured in a consistent way (e.g., JSON) that your AI agent understands.
     * @param npcId The ID of the NPC to update.
     * @param pointer The 32-byte content identifier (e.g., IPFS CID multihash).
     */
    function setNpcDataPointer(uint256 npcId, bytes32 pointer) external {
        require(msg.sender == npcCore.owner(), "Only owner can set data pointer");
        
        // You could add a check to ensure the NPC ID exists
        require(npcId < npcCore.getNPCCount(), "Invalid NPC ID");

        npcDataPointer[npcId] = pointer;
        emit NpcDataPointerUpdated(npcId, pointer);
    }

    /**
     * @notice Retrieves the off-chain data pointer for an NPC.
     * @dev Your off-chain AI agent will call this view function to find out where to fetch
     * the detailed personality and prompt information for an NPC.
     * @param npcId The ID of the NPC.
     * @return bytes32 The content identifier for the NPC's off-chain metadata.
     */
    function getNpcDataPointer(uint256 npcId) external view returns (bytes32) {
        return npcDataPointer[npcId];
    }
}