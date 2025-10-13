// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SharedTypes
 * @notice A central contract to hold enums and structs used across multiple contracts.
 * This prevents circular dependencies.
 */
contract SharedTypes {
    // Enum for readable, explicit action types.
    enum ActionType { Greet, Trade, Attack, Help, Give, Quest }

    enum ResponseType { Greet, Trade, Attack, Flee, Help, Ignore }

    /**
     * @dev A structured data packet describing a player's action.
     * This is created by the frontend and passed into the `interact` function.
     */
    struct InteractionContext {
        ActionType action;      // The verb: What did the player do?
        address target;         // The direct object: Who/what was the action for?
        uint256 value1;         // Contextual data 1 (e.g., item ID, damage amount)
        uint256 value2;         // Contextual data 2 (e.g., item quantity, gold amount)
        bytes32 memo;           // A short, gas-efficient memo for identifiers (e.g., quest ID)
    }
}