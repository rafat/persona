// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NPCCore is Ownable {

    uint256 private _npcIdCounter;
    address public learningEngineAddress;

    struct NPC {
        uint256 id;
        string name;
        uint8 personality;        // 0: Friendly, 1: Neutral, 2: Hostile
        uint16 intelligence;      // 0–1000
        uint16 aggression;        // 0–1000
        uint16 sociability;       // 0–1000
        uint256 experiencePoints;
        uint256 lastInteraction;
        bool isActive;
    }

    // NEW: A struct to bundle all state changes from an interaction.
    // This is passed from the LearningEngine to this contract.
    struct InteractionOutcome {
        uint16 newRelationshipScore;
        uint16 newAggression;
        uint16 newSociability;
        uint16 newIntelligence;
        string memorySnippet;
    }

    mapping(uint256 => NPC) public npcs;
    mapping(uint256 => mapping(address => uint16)) public playerRelationships; // 0–1000 scale
    mapping(uint256 => string[50]) public npcMemories;
    mapping(uint256 => uint8) public npcMemoryIndex; 

    event NPCCreated(uint256 indexed npcId, string name);
    event TraitsUpdated(uint256 indexed npcId, uint16 intelligence, uint16 aggression, uint16 sociability);
    event MemoryRecorded(uint256 indexed npcId, string memorySnippet);

    constructor() Ownable(msg.sender) {} 

    modifier onlyActiveNPC(uint256 npcId) {
        require(npcs[npcId].isActive, "NPC is not active");
        _;
    }

    modifier onlyLearningEngine() {
        require(msg.sender == learningEngineAddress, "Caller is not the LearningEngine");
        _;
    }
    
    modifier onlyInteractionTracker() {
        // We'll add this address during deployment in the tests
        require(msg.sender == interactionTrackerAddress, "Caller is not the InteractionTracker");
        _;
    }
    
    address public interactionTrackerAddress;
    
    function setInteractionTrackerAddress(address _interactionTrackerAddress) onlyOwner external {
        interactionTrackerAddress = _interactionTrackerAddress;
    }

    function createNPC(
        string memory _name,
        uint8 _personality,
        uint16 _intelligence,
        uint16 _aggression,
        uint16 _sociability
    ) onlyOwner external returns (uint256) {
        uint256 id = _npcIdCounter;
        require(_intelligence <= 1000 && _aggression <= 1000 && _sociability <= 1000, "Traits must be 0-1000");
        require(_personality <= 2, "Personality must be 0, 1, or 2");
        npcs[id] = NPC({
            id: id,
            name: _name,
            personality: _personality,
            intelligence: _intelligence,
            aggression: _aggression,
            sociability: _sociability,
            experiencePoints: 0,
            lastInteraction: block.timestamp,
            isActive: true
        });

        _npcIdCounter++;

        emit NPCCreated(id, _name);
        return id;
    }

    // NEW: The primary function for applying all state changes at once.
    // This is called by the InteractionTracker after getting calculations from the LearningEngine.
    function applyInteractionOutcome(
        uint256 npcId,
        address player,
        InteractionOutcome memory outcome
    ) external onlyInteractionTracker onlyActiveNPC(npcId) {
        // 1. Update Relationship
        playerRelationships[npcId][player] = _clamp(outcome.newRelationshipScore, 0, 1000);

        // 2. Update Traits
        NPC storage npc = npcs[npcId];
        npc.intelligence = _clamp(outcome.newIntelligence, 0, 1000);
        npc.aggression = _clamp(outcome.newAggression, 0, 1000);
        npc.sociability = _clamp(outcome.newSociability, 0, 1000);
        npc.lastInteraction = block.timestamp;
        emit TraitsUpdated(npcId, npc.intelligence, npc.aggression, npc.sociability);

        // 3. Record Contextual Memory using the circular buffer
        uint8 index = npcMemoryIndex[npcId];
        npcMemories[npcId][index] = outcome.memorySnippet;
        npcMemoryIndex[npcId] = (index + 1) % 50;
        emit MemoryRecorded(npcId, outcome.memorySnippet);
    }

    function getNPCState(uint256 npcId) external view returns (NPC memory) {
        return npcs[npcId];
    }

    function updateTraits(
        uint256 npcId,
        uint16 newIntelligence,
        uint16 newAggression,
        uint16 newSociability
    ) onlyLearningEngine external onlyActiveNPC(npcId) {
        NPC storage npc = npcs[npcId];
        npc.intelligence = _clamp(newIntelligence, 0, 1000);
        npc.aggression = _clamp(newAggression, 0, 1000);
        npc.sociability = _clamp(newSociability, 0, 1000);
        npc.lastInteraction = block.timestamp;
        emit TraitsUpdated(npcId, npc.intelligence, npc.aggression, npc.sociability);
    }

    function recordMemory(uint256 npcId, string memory memorySnippet) onlyLearningEngine external onlyActiveNPC(npcId) {
        uint8 index = npcMemoryIndex[npcId];
        npcMemories[npcId][index] = memorySnippet;
        npcMemoryIndex[npcId] = (index + 1) % 50;

        emit MemoryRecorded(npcId, memorySnippet);
    }

    function setRelationship(uint256 npcId, address player, uint16 score) onlyLearningEngine external onlyActiveNPC(npcId) {
        playerRelationships[npcId][player] = _clamp(score, 0, 1000);
    }

    function getRelationship(uint256 npcId, address player) external view returns (uint16) {
        return playerRelationships[npcId][player];
    }

    function setLearningEngineAddress(address _learningEngineAddress) onlyOwner external {
        learningEngineAddress = _learningEngineAddress;
    }

    function getMemories(uint256 npcId) external view returns (string[50] memory) {
        string[50] memory orderedMemories;
        uint8 nextSlot = npcMemoryIndex[npcId];
        uint8 size = 50; // The fixed size of our array

        // We reorder the array for the frontend so the newest memory is last.
        for (uint8 i = 0; i < size; i++) {
            orderedMemories[i] = npcMemories[npcId][(nextSlot + i) % size];
        }
        return orderedMemories;
    }

    function getNPCCount() external view returns (uint256) {
        return _npcIdCounter;
    }

    function _clamp(uint16 value, uint16 min, uint16 max) private pure returns (uint16) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}